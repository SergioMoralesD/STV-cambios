import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PASS_HASH =
  '$argon2id$v=19$m=65536,t=3,p=1$Mc0Kur99vyODix8A0VoSHA$ZXbzwb0GOVEeipqzTqq8PAg1HmBgrxMk2I9UcDSQK0w';

const VISTAS = [
  ['AVERIAS', 'Averías', false],
  ['AVREPE', 'Averías Repetitivas', false],
  ['AVSLA', 'Averías SLA', false],
  ['STVLOG', 'Logística', false],
  ['RECUR', 'Recursos', true],
  ['PEDREP', 'Pedidos Repuestos', true],
  ['SANMTTO', 'Saneamientos', false],
  ['TRABCL', 'Trabajo Cliente', false],
  ['FAEQUIP', 'FA Equipos', false],
  ['FLYFB', 'FL y FB', false],
  ['STVLOGAG', 'Agenda Logística', false],
  ['RANKPROD', 'Ranking Productividad', true],
  ['PRODTEC', 'Gestión Técnicos', false],
  ['REPAVRO', 'Aprovisionamiento', false],
  ['REPINV', 'Repuestos Sin Inventariar', false],
  ['CONREP', 'Consumo Repuestos', false],
];

const VISTA_URLS = [
  ['C', 'AVERIAS', '/averias'],
  ['C', 'AVREPE', '/AveriasRepetitivas'],
  ['C', 'AVSLA', '/Averias_SLA'],
  ['C', 'STVLOG', '/STVLogistics'],
  ['C', 'RECUR', '/recursos'],
  ['C', 'PEDREP', '/Pedidos_Repuestos'],
  ['C', 'SANMTTO', '/SanitizacionesYMantenimientos'],
  ['C', 'TRABCL', '/Trabajo_Cliente'],
  ['C', 'FAEQUIP', '/FA_de_Equipos_recien_instalados'],
  ['C', 'FLYFB', '/Trabajo_FL_FB'],
  ['C', 'STVLOGAG', '/STVLogisticaAgenda'],
  ['C', 'RANKPROD', '/Ranking_Tecnicos'],
  ['C', 'PRODTEC', '/Gestion_Tecnicos'],
  ['C', 'REPAVRO', '/AprovisionamientoRepuestos'],
  ['C', 'REPINV', '/RepuestosSinInventariar'],
  ['C', 'CONREP', '/Consumo'],
  ['B', 'AVERIAS', '/averias'],
  ['B', 'AVREPE', '/AveriasRepetitivas'],
  ['B', 'AVSLA', '/Averias_SLA'],
  ['B', 'STVLOG', '/STVLogistics'],
  ['B', 'RECUR', '/recursos'],
  ['B', 'PEDREP', '/Pedidos_Repuestos'],
  ['B', 'SANMTTO', '/SanitizacionesYMantenimientos'],
  ['B', 'TRABCL', '/Trabajo_Cliente'],
  ['B', 'FAEQUIP', '/FA_de_Equipos_recien_instalados'],
  ['B', 'FLYFB', '/Trabajo_FL_FB'],
  ['B', 'STVLOGAG', '/STVLogisticaAgenda'],
  ['B', 'RANKPROD', '/Ranking_Tecnicos'],
  ['B', 'PRODTEC', '/Gestion_Tecnicos'],
  ['B', 'REPAVRO', '/AprovisionamientoRepuestos'],
  ['B', 'REPINV', '/RepuestosSinInventariar'],
  ['B', 'CONREP', '/Consumo'],
];

const DELEGACIONES = [
  ['6S21', 'Tenerife', 'C'],
  ['6S23', 'Gran Canaria', 'C'],
  ['6S24', 'Lanzarote', 'C'],
  ['6S25', 'Fuerteventura', 'C'],
  ['6S21_MENORES', 'Islas Menores', 'C'],
  ['6E21', 'Mallorca', 'B'],
  ['6E22', 'Ibiza', 'B'],
  ['6E23', 'Menorca', 'B'],
  ['6E41', 'Formentera', 'B'],
];

const PERMISOS_ADMIN = {
  C: '6S21',
  B: '6E21',
};

function loadJson(relativePath) {
  const full = path.join(ROOT, relativePath);
  return JSON.parse(fs.readFileSync(full, 'utf-8'));
}

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://stv_user:stv_secret@localhost:5432/stv_portal';

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const { rows: exists } = await client.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'roles'
       ) AS ok`,
    );
    if (!exists[0].ok) {
      console.log('[seed] Aplicando esquema...');
      const schemaSql = fs.readFileSync(
        path.join(__dirname, '01_schema.sql'),
        'utf-8',
      );
      await client.query(schemaSql);
    }

    console.log('[seed] Limpiando tablas...');
    await client.query(`
      TRUNCATE
        permisos_acceso, vista_islas, vistas_urls, usuarios,
        api_mock_data, recursos_catalogo, averias_incidencias, tecnicos,
        delegaciones, vistas, regiones, roles
      RESTART IDENTITY CASCADE
    `);

    console.log('[seed] Roles y regiones...');
    const roles = [
      ['Admin', 'Acceso total al portal', 480],
      ['Coordinador', 'Gestión operativa por región', 480],
      ['Supervisor', 'Supervisión de equipos', 480],
      ['Tecnico', 'Acceso técnico de campo', 480],
      ['Visor', 'Solo lectura', 240],
    ];
    for (const [nombre, desc, timeout] of roles) {
      await client.query(
        'INSERT INTO roles (nombre, descripcion, session_timeout_min) VALUES ($1, $2, $3)',
        [nombre, desc, timeout],
      );
    }

    await client.query(
      `INSERT INTO regiones (codigo, nombre) VALUES ('C', 'Canarias'), ('B', 'Baleares')`,
    );

    for (const [codigo, nombre, mostrar] of VISTAS) {
      await client.query(
        'INSERT INTO vistas (codigo, nombre, mostrar_juntas) VALUES ($1, $2, $3)',
        [codigo, nombre, mostrar],
      );
    }

    for (const [codigo, nombre, region] of DELEGACIONES) {
      await client.query(
        'INSERT INTO delegaciones (codigo, nombre, region_codigo) VALUES ($1, $2, $3)',
        [codigo, nombre, region],
      );
    }

    for (const [region, vista, url] of VISTA_URLS) {
      await client.query(
        'INSERT INTO vistas_urls (region_codigo, vista_codigo, url) VALUES ($1, $2, $3)',
        [region, vista, url],
      );
    }

    const vistaIslas = [
      'AVERIAS', 'AVREPE', 'AVSLA', 'STVLOG', 'SANMTTO', 'TRABCL',
      'FAEQUIP', 'FLYFB', 'STVLOGAG', 'PRODTEC', 'REPAVRO', 'REPINV', 'CONREP',
    ];
    for (const vista of vistaIslas) {
      await client.query(
        `INSERT INTO vista_islas (region_codigo, vista_codigo, label, mainplant)
         VALUES ('C', $1, 'Tenerife', '6S21')`,
        [vista],
      );
    }

    const { rows: roleRows } = await client.query(
      `SELECT id, nombre FROM roles WHERE nombre = 'Admin'`,
    );
    const adminRolId = roleRows[0].id;

    for (const [region, delegacion] of Object.entries(PERMISOS_ADMIN)) {
      for (const [vistaCodigo] of VISTAS) {
        await client.query(
          `INSERT INTO permisos_acceso (rol_id, region_codigo, vista_codigo, delegacion_codigo)
           VALUES ($1, $2, $3, $4)`,
          [adminRolId, region, vistaCodigo, delegacion],
        );
      }
    }

    console.log('[seed] Usuarios...');
    const users = [
      ['admin', 'admin@stv.com', 'Admin', 'admin'],
      ['neftali', 'neftali@stv.com', 'Coordinador', 'neftali'],
      ['lukas', 'lukas@stv.com', 'Coordinador', 'lukas'],
    ];
    for (const [usuario, correo, rolNombre, codigo] of users) {
      const { rows } = await client.query(
        'SELECT id FROM roles WHERE nombre = $1',
        [rolNombre],
      );
      await client.query(
        `INSERT INTO usuarios (usuario, correo, pass_hash, rol_id, codigo_usuario, activo)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [usuario, correo, PASS_HASH, rows[0].id, codigo],
      );
    }

    console.log('[seed] API mock (utils/mock-data.json)...');
    const mockData = loadJson('utils/mock-data.json');
    for (const [endpoint, payload] of Object.entries(mockData)) {
      await client.query(
        `INSERT INTO api_mock_data (endpoint_path, payload) VALUES ($1, $2::jsonb)`,
        [endpoint, JSON.stringify(payload)],
      );
    }

    console.log('[seed] Recursos...');
    const recursos = loadJson('utils/recursos-api.json');
    for (const item of recursos) {
      await client.query(
        `INSERT INTO recursos_catalogo (id, payload) VALUES ($1, $2::jsonb)`,
        [String(item.id), JSON.stringify(item)],
      );
    }

    console.log('[seed] Averías (utils/stv-mock.json)...');
    const averias = loadJson('utils/stv-mock.json');
    for (const row of averias) {
      await client.query(
        `INSERT INTO averias_incidencias (
          id, carretera, kilometro, isla, municipio, tipo_averia,
          prioridad, estado, fecha_reporte, tecnico_asignado, payload
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)`,
        [
          row.id,
          row.carretera,
          row.kilometro,
          row.isla,
          row.municipio,
          row.tipo_averia,
          row.prioridad,
          row.estado,
          row.fecha_reporte,
          row.tecnico_asignado,
          JSON.stringify(row),
        ],
      );
    }

    console.log('[seed] Técnicos...');
    const tecnicos = mockData['tecnico-info'] || [];
    for (const t of tecnicos) {
      await client.query(
        `INSERT INTO tecnicos (codigo, nombre, codigo_area, telefono, email)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (codigo) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           codigo_area = EXCLUDED.codigo_area,
           telefono = EXCLUDED.telefono,
           email = EXCLUDED.email`,
        [
          t.CODIGO_EMPLEADO,
          t.NOMBRE_EMPLEADO,
          t.CODIGO_AREA,
          t.TLF ?? null,
          t.EMAIL ?? null,
        ],
      );
    }

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM usuarios) AS usuarios,
        (SELECT COUNT(*) FROM api_mock_data) AS api_endpoints,
        (SELECT COUNT(*) FROM averias_incidencias) AS averias,
        (SELECT COUNT(*) FROM recursos_catalogo) AS recursos,
        (SELECT COUNT(*) FROM permisos_acceso) AS permisos
    `);
    console.log('[seed] Completado:', counts.rows[0]);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
