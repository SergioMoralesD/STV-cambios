import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { RecursosModule } from './recursos.module';

@Module({
  imports: [
    AuthModule,     // 🔒 Conecta el Login
    RecursosModule, // 📊 Conecta los datos
  ],
})
export class AppModule {}
