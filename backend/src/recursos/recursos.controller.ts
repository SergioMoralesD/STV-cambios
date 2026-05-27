import { Controller, Get, UseGuards } from '@nestjs/common';
import { RecursosService } from './recursos.service';
import { AuthGuard } from './auth/guards/auth.guard'; 

@Controller('recursos') 
export class RecursosController {
  constructor(private readonly recursosService: RecursosService) {}

  @Get('datos') 
  @UseGuards(AuthGuard) // 🔒 Bloquea el paso si el técnico no está logueado
  async obtenerDatos() {
    return await this.recursosService.obtenerDatosDeAPI();
  }
}
