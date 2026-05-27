import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    // DEBUG: Ver qué está llegando al servidor en la consola de VS Code
    console.log("Token extraído:", token);

    if (!token) {
      console.log("Error: No se encontró token en los headers");
      throw new UnauthorizedException('Acceso denegado: No se ha iniciado sesión');
    }

    try {
      // Verificamos el token con la clave secreta
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'mi_super_clave_secreta_stv_123', 
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
