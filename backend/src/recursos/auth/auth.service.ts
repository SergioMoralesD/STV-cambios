import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth') // La URL base será: tu-dominio.com/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login') // La URL final para la web será: tu-dominio.com/auth/login
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    // Recogemos el usuario y clave que se escriben en el formulario de la web
    const { usuario, clave } = body;
    return await this.authService.login(usuario, clave);
  }
}
