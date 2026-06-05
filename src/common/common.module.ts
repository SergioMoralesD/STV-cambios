import { Module } from '@nestjs/common';
import { StubController } from './stub.controller';

@Module({
  controllers: [StubController],
})
export class CommonModule {}
