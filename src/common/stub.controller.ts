import { Controller, All, Post, Req, Res } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Controller()
export class StubController {
  @Post('system-logs/client')
  async logClient(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return res.send({ ok: true });
  }

  @Post('log-accesos')
  async logAcceso(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return res.send({ ok: true });
  }

  @All('users*')
  async users(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    if (req.url === '/users/me') {
      return res.send({
        id: 1,
        usuario: 'admin',
        correo: 'admin@stv.com',
        rol_id: 1,
        rol_nombre: 'Admin',
        activo: 1,
      });
    }
    return res.send([]);
  }

  @All('roles*')
  async roles(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return res.send([{ id: 1, nombre: 'Admin' }]);
  }

  @All('vistas*')
  async vistas(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    return res.send([]);
  }
}
