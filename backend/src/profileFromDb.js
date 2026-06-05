import { query } from './db.js';

export async function buildProfileFromDb(usuario) {
  const userResult = await query(
    `SELECT u.id, u.usuario, u.correo, u.codigo_usuario, u.activo,
            r.id AS rol_id, r.nombre AS rol_nombre
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.usuario = $1 AND u.activo = TRUE`,
    [usuario],
  );
  if (!userResult?.rows?.length) return null;

  const user = userResult.rows[0];
  const rolId = user.rol_id;

  const regionesResult = await query(
    `SELECT DISTINCT reg.codigo, reg.nombre
     FROM permisos_acceso p
     JOIN regiones reg ON reg.codigo = p.region_codigo
     WHERE p.rol_id = $1
     ORDER BY reg.codigo`,
    [rolId],
  );

  const vistasResult = await query(
    `SELECT p.region_codigo, p.vista_codigo
     FROM permisos_acceso p
     WHERE p.rol_id = $1`,
    [rolId],
  );

  const delegacionesResult = await query(
    `SELECT p.region_codigo, p.vista_codigo, p.delegacion_codigo
     FROM permisos_acceso p
     WHERE p.rol_id = $1`,
    [rolId],
  );

  const vistasRows = await query(
    `SELECT codigo, nombre, mostrar_juntas FROM vistas ORDER BY codigo`,
  );
  const urlsRows = await query(
    `SELECT region_codigo, vista_codigo, url, param_key, joiner FROM vistas_urls`,
  );
  const islasRows = await query(
    `SELECT region_codigo, vista_codigo, label, mainplant FROM vista_islas`,
  );

  const vistas = {};
  for (const row of vistasResult?.rows ?? []) {
    if (!vistas[row.region_codigo]) vistas[row.region_codigo] = [];
    if (!vistas[row.region_codigo].includes(row.vista_codigo)) {
      vistas[row.region_codigo].push(row.vista_codigo);
    }
  }

  const delegaciones = {};
  for (const row of delegacionesResult?.rows ?? []) {
    if (!delegaciones[row.region_codigo]) delegaciones[row.region_codigo] = {};
    if (!delegaciones[row.region_codigo][row.vista_codigo]) {
      delegaciones[row.region_codigo][row.vista_codigo] = [];
    }
    if (
      !delegaciones[row.region_codigo][row.vista_codigo].includes(
        row.delegacion_codigo,
      )
    ) {
      delegaciones[row.region_codigo][row.vista_codigo].push(
        row.delegacion_codigo,
      );
    }
  }

  return {
    id: user.id,
    usuario: user.usuario,
    correo: user.correo,
    rol_id: user.rol_id,
    rol_nombre: user.rol_nombre,
    activo: user.activo ? 1 : 0,
    codigo_usuario: user.codigo_usuario,
    regiones: regionesResult?.rows ?? [],
    vistas,
    delegaciones,
    menuConfig: {
      vistas: (vistasRows?.rows ?? []).map((v) => ({
        codigo: v.codigo,
        nombre: v.nombre,
        mostrar_juntas: v.mostrar_juntas,
      })),
      vistaUrls: (urlsRows?.rows ?? []).map((u) => ({
        region_codigo: u.region_codigo,
        vista_codigo: u.vista_codigo,
        url: u.url,
        param_key: u.param_key,
        joiner: u.joiner,
      })),
      vistaIslas: (islasRows?.rows ?? []).map((i) => ({
        region_codigo: i.region_codigo,
        vista_codigo: i.vista_codigo,
        label: i.label,
        mainplant: i.mainplant,
      })),
    },
  };
}
