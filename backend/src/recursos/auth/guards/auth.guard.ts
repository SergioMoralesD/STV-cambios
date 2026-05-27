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
      // Usamos la MISMA clave secreta aquí
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'stv_2026', 
      });
      
      request['user'] = payload;
    } catch (e) {
      console.log("Error de validación JWT:", e.message);
      throw new UnauthorizedException('Acceso denegado: Sesión inválida o expirada');
    }
    
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;
    
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
