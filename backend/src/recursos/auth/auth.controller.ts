import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    // Aquí forzamos la lectura del cuerpo JSON enviado desde Talend
    const { username, password } = body;
    const result = await this.authService.login(username, password);
    
    if (!result) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    return result;
  }
}
