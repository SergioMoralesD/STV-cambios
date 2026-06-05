import { query } from './db.js';

export async function getMockPayload(endpointPath) {
  const result = await query(
    'SELECT payload FROM api_mock_data WHERE endpoint_path = $1',
    [endpointPath],
  );
  if (!result?.rows?.length) return undefined;
  return result.rows[0].payload;
}

export async function handleExternalApi(req, res) {
  const url = (req.originalUrl || req.url).split('?')[0];
  const path = url.replace(/^\/external-api\/?/, '');

  if (req.method === 'POST' && path === 'sla-objetivo') {
    const body = req.body || {};
    const sla = body.sla ?? 90;
    return res.json({ nuevo_sla_objetivo: sla });
  }

  const payload = await getMockPayload(path);
  if (payload === undefined) {
    return res.status(404).json({ error: `No mock data for path: ${path}` });
  }

  if (path === 'tecnico-info' && Array.isArray(payload)) {
    const codTecnico = req.query.codTecnico;
    if (codTecnico) {
      const match = payload.find((t) => t.CODIGO_EMPLEADO === codTecnico);
      return res.json(match ?? {});
    }
  }

  return res.json(payload);
}
