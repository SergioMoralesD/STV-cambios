import { Module } from '@nestjs/common';
import { AuthModule } from './recursos/auth/auth.module';
import { RecursosModule } from './recursos/recursos.module';
import { RecursosApiModule } from './recursos-api/recursos-api.module';
import { CommonModule } from './common/common.module';
import { MockModule } from './mock/mock.module';

@Module({
  imports: [
    AuthModule,
    RecursosModule,
    RecursosApiModule,
    CommonModule,
    MockModule,
  ],
})
export class AppModule {}
