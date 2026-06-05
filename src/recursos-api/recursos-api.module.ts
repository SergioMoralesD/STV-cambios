import { Module } from '@nestjs/common';
import { RecursosApiController } from './recursos-api.controller';

@Module({
  controllers: [RecursosApiController],
})
export class RecursosApiModule {}
