import { Module } from '@nestjs/common';
import { AuthModule } from './backend/src/recursos/auth/auth.module';
import { RecursosModule } from './backend/src/recursos/recursos.module';

@Module({
  imports: [
    AuthModule,     // 🔒 Activa el Login de STV
    RecursosModule, // 📊 Activa el lector de averías del JSON
  ],
})
export class AppModule {}
