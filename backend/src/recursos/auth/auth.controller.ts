import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { usuario: string; clave: string }) {
    const user = await this.authService.login(body.usuario, body.clave);
    if (!user) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    return user;
  }
}
