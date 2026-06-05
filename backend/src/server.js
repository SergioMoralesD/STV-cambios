import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildAdminProfile } from './adminProfile.js';
import { query, isDbReady } from './db.js';
import { buildProfileFromDb } from './profileFromDb.js';
import { handleExternalApi } from './mockApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'CLAVE_SECRETA_STV_DE_PRUEBAS';
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : null;

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins?.includes(origin)) {
        callback(null, true);
        return;
      }
      if (
        !allowedOrigins &&
        /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin no permitido por CORS: ${origin}`));
    },
    credentials: true,
  }),
);

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => tester.close(() => resolve(true)));
    tester.listen(port);
  });
}

async function findAvailablePort(startPort, maxAttempts = 20) {
  for (let offset = 0; offset < maxAttempts; offset++) {
    const port = startPort + offset;
    if (await isPortAvailable(port)) {
      if (offset > 0) {
        console.warn(`[Bootstrap] Puerto ${startPort} ocupado, usando ${port}`);
      }
      return port;
    }
  }
  throw new Error(
    `No hay puertos libres entre ${startPort} y ${startPort + maxAttempts - 1}`,
  );
}

function normalizeLoginCredentials(body = {}) {
  const usuario = (body.usuario ?? body.username ?? '').trim();
  const clave = (body.clave ?? body.password ?? '').trim();
  if (!usuario || !clave) return null;
  return { usuario, clave };
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !token) {
    return res.status(401).json({
      message: 'Acceso denegado: No se ha iniciado sesión',
      error: 'Unauthorized',
      statusCode: 401,
    });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({
      message: 'Acceso denegado: Sesión inválida o expirada',
      error: 'Unauthorized',
      statusCode: 401,
    });
  }
}

async function buildProfileFromPayload(payload, accessToken) {
  const username = payload?.username ?? payload?.usuario ?? 'admin';

  if (await isDbReady()) {
    const fromDb = await buildProfileFromDb(username);
    if (fromDb) {
      return { ...fromDb, session_token: accessToken };
    }
  }

  if ((payload?.role ?? 'admin') === 'admin') {
    return buildAdminProfile(username, accessToken);
  }

  return {
    id: 1,
    usuario: username,
    correo: `${username}@stv.local`,
    rol_id: 1,
    rol_nombre: 'Invitado',
    activo: 1,
    regiones: [],
    vistas: {},
    delegaciones: {},
    session_token: accessToken,
  };
}

async function verifyUserPassword(usuario, clave) {
  if (!(await isDbReady())) {
    if (usuario === 'admin' && clave === 'stv2026') {
      return { username: usuario, role: 'admin' };
    }
    return null;
  }

  const result = await query(
    `SELECT u.usuario, u.pass_hash, r.nombre AS rol_nombre
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE u.usuario = $1 AND u.activo = TRUE`,
    [usuario],
  );
  if (!result?.rows?.length) return null;

  const row = result.rows[0];
  if (!row.pass_hash) return null;

  const valid = await argon2.verify(row.pass_hash, clave);
  if (!valid) return null;

  return {
    username: row.usuario,
    role: row.rol_nombre === 'Admin' ? 'admin' : row.rol_nombre.toLowerCase(),
  };
}

app.get(['/auth/me', '/external-api/auth/me'], authMiddleware, async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');
  const profile = await buildProfileFromPayload(req.user, token);
  return res.json(profile);
});

app.post(['/auth/logout', '/external-api/auth/logout'], (_req, res) => {
  res.json({ ok: true });
});

app.post(['/auth/logout-all', '/external-api/auth/logout-all'], (_req, res) => {
  res.json({ ok: true });
});

app.post(['/auth/login', '/external-api/auth/login'], async (req, res) => {
  const credentials = normalizeLoginCredentials(req.body);
  if (!credentials) {
    return res.status(400).json({
      message:
        'Body JSON inválido: envía "usuario" y "clave" (o "username" y "password").',
      error: 'Bad Request',
      statusCode: 400,
    });
  }

  const { usuario, clave } = credentials;
  const authUser = await verifyUserPassword(usuario, clave);
  if (!authUser) {
    return res.status(401).json({
      message: 'Usuario o contraseña incorrectos',
      error: 'Unauthorized',
      statusCode: 401,
    });
  }

  const accessToken = jwt.sign(authUser, JWT_SECRET, { expiresIn: '8h' });
  return res.json({
    backend_status: 'AUTHENTICATED',
    accessToken,
  });
});

app.get(['/users', '/users/'], authMiddleware, async (_req, res) => {
  if (!(await isDbReady())) return res.json([]);
  const result = await query(
    `SELECT u.id, u.usuario, u.correo, u.activo, r.nombre AS rol_nombre
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     ORDER BY u.usuario`,
  );
  return res.json(result?.rows ?? []);
});

app.get(['/roles', '/roles/'], authMiddleware, async (_req, res) => {
  if (!(await isDbReady())) {
    return res.json([{ id: 1, nombre: 'Admin', descripcion: 'Acceso total' }]);
  }
  const result = await query(
    'SELECT id, nombre, descripcion FROM roles ORDER BY id',
  );
  return res.json(result?.rows ?? []);
});

app.use('/external-api', async (req, res) => {
  if (!(await isDbReady())) {
    return res.status(503).json({ error: 'Base de datos no disponible' });
  }
  return handleExternalApi(req, res);
});

app.get(
  ['/recursos/datos', '/external-api/recursos/datos', '/recursos-api'],
  authMiddleware,
  async (_req, res) => {
    if (await isDbReady()) {
      const result = await query(
        'SELECT payload FROM recursos_catalogo ORDER BY id',
      );
      if (result?.rows?.length) {
        return res.json(result.rows.map((r) => r.payload));
      }
    }
    try {
      const mockPath = path.resolve(__dirname, '../../utils/recursos-api.json');
      return res.json(JSON.parse(fs.readFileSync(mockPath, 'utf-8')));
    } catch {
      return res.json([]);
    }
  },
);

app.get('/health', async (_req, res) => {
  const dbOk = await isDbReady();
  let counts = null;
  if (dbOk) {
    const r = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM usuarios) AS usuarios,
        (SELECT COUNT(*)::int FROM api_mock_data) AS api_endpoints,
        (SELECT COUNT(*)::int FROM averias_incidencias) AS averias
    `);
    counts = r?.rows?.[0] ?? null;
  }
  res.json({
    status: 'ok',
    db: dbOk ? 'connected' : 'unavailable',
    counts,
  });
});

async function bootstrap() {
  const preferredPort = Number(process.env.PORT) || 4000;
  const port =
    process.env.NODE_ENV === 'production'
      ? preferredPort
      : await findAvailablePort(preferredPort);

  const dbOk = await isDbReady();
  console.log(
    dbOk
      ? '[Bootstrap] PostgreSQL conectada'
      : '[Bootstrap] Sin PostgreSQL — modo fallback JSON',
  );

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Bootstrap] Servidor Express STV en http://0.0.0.0:${port}`);
    console.log(`[Bootstrap] Login: POST http://localhost:${port}/auth/login`);
  });
}

bootstrap().catch((error) => {
  console.error('[Bootstrap] No se pudo iniciar la aplicación', error);
  process.exit(1);
});
