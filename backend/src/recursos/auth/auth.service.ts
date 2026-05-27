import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(username: string, pass: string) {
    // Si ves que esto no funciona, descomenta la siguiente línea para debuguear:
    // console.log(`Validando: ${username} con clave: ${pass}`);

    if (username === 'admin' && pass === 'stv2026') {
      const payload = { username: username, role: 'admin' };
      return {
        backend_status: 'AUTHENTICATED',
        accessToken: await this.jwtService.signAsync(payload, {
          secret: 'stv_2026'
        }),
      };
    }
    return null;
  }
}
