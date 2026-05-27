import { Controller, Get } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

const JSON_PATH = join(__dirname, '..', '..', '..', 'utils', 'recursos-api.json');

@Controller('recursos-api')
export class RecursosApiController {
  @Get()
  async obtener() {
    try {
      const data = readFileSync(JSON_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
}
