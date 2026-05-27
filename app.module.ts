import { Module } from '@nestjs/common';
import { AuthModule } from './backend/src/recursos/auth/auth.module';
import { RecursosModule } from './backend/src/recursos/recursos.module';

@Module({
  imports: [
    AuthModule,     // 🔒 Conecta tu Login real
    RecursosModule, // 📊 Conecta el lector del JSON de averías
  ],
})
export class AppModule {}
