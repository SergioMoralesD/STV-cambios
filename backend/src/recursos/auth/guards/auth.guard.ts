import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Acceso denegado: No se ha iniciado sesión');
    }

    try {
      // Verificamos si el token es real y no ha caducado
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'CLAVE_SECRETA_STV_DE_PRUEBAS', // Debe coincidir con la del módulo
      });
      
      // Guardamos los datos del usuario dentro de la petición por seguridad
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Acceso denegado: Sesión inválida o expirada');
    }
    
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
