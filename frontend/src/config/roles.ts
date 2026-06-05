/**
 * roles.ts
 * 
 * Definición centralizada de roles y permisos del sistema.
 */

export enum Role {
    ADMIN = 'Admin',
    COORDINADOR = 'Coordinador',
    TECNICO = 'Tecnico', // Genérico por si acaso
    TECNICOS_C = 'Tecnicos-C',
    TECNICOS_B = 'Tecnicos-B',
    TECNICOS_AVERIAS = 'Tecnicos-Averias',
    SUPERVISOR = 'Supervisor',
    CLIENTE = 'Cliente',
}

/**
 * Vistas que ciertos roles tienen garantizadas por defecto,
 * independientemente de lo que venga de la base de datos (vistas).
 */
export const ROLE_DEFAULT_VISTAS: Record<string, string[]> = {
    [Role.ADMIN]: ['*'], // Mantenemos el comodín para el Admin por seguridad de acceso total
    [Role.TECNICOS_C]: [],
    [Role.TECNICOS_B]: [],
    [Role.TECNICOS_AVERIAS]: [],
    [Role.COORDINADOR]: [],
};

/**
 * Helper para verificar si un rol es "staff" (pueden ver paneles de gestión)
 */
export const isStaff = (roleName: string) => {
    return [Role.ADMIN, Role.COORDINADOR, Role.SUPERVISOR].includes(roleName as Role);
};
  