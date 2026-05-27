async login(usuario: string, clave: string) {
  if (usuario === 'admin' && clave === 'stv2026') {
    const payload = { username: usuario, role: 'admin' };
    return {
      backend_status: 'AUTHENTICATED',
      // ¡Aquí añadimos la clave secreta igual que en el Guard!
      accessToken: await this.jwtService.signAsync(payload, {
        secret: 'stv_2026'
      }),
    };
  }
  return null;
}
