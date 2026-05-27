import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    JwtModule.register({
      global: true, // Hace que la protección JWT sirva para todo el backend
      secret: 'CLAVE_SECRETA_STV_DE_PRUEBAS', // Sello de seguridad
      signOptions: { expiresIn: '8h' }, // La sesión del técnico expira a las 8 horas
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
