import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(usuario: string, pass: string) {
    if (usuario === 'admin' && pass === 'stv2026') {
      const payload = { usuario: usuario, role: 'admin' };
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
