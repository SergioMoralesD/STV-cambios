import { Controller, All, Req, Res } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { FastifyRequest, FastifyReply } from 'fastify';

const JSON_PATH = join(__dirname, '..', '..', '..', 'utils', 'mock-data.json');

let cache: Record<string, any> = {};
function loadJson(): Record<string, any> {
  if (Object.keys(cache).length === 0) {
    cache = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));
  }
  return cache;
}

@Controller('external-api')
export class MockController {
  @All('/*')
  async handleAll(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const url = req.url.split('?')[0];
    const path = url.replace(/^\/external-api\//, '');
    const data = loadJson();
    const result = data[path];

    if (req.method === 'POST' && path === 'sla-objetivo') {
      const body = req.body as any;
      const sla = body?.sla ?? 90;
      return res.send({ "nuevo_sla_objetivo": sla });
    }

    if (result !== undefined) {
      return res.send(result);
    }
    return res.status(404).send({ error: `No mock data for path: ${path}` });
  }
}
