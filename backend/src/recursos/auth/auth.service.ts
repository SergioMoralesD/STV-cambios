import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(usuario: string, clave: string) {
    if (usuario === 'admin' && clave === 'stv2026') {
      const payload = { username: usuario, role: 'admin' };
      return {
        backend_status: 'AUTHENTICATED',
        // Usamos la clave secreta aquí
        accessToken: await this.jwtService.signAsync(payload, {
          secret: 'stv_2026'
        }),
      };
    }
    return null;
  }
}
