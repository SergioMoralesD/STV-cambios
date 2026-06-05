import { useAuth } from '../Context/AuthContext';
import { Role, ROLE_DEFAULT_VISTAS } from '../config/roles';
import { useMemo } from 'react';

export interface Permissions {
  role?: Role;
  roles: Role[];
  vistas: Set<string>;
  isAdmin: boolean;
  isTecnico: boolean;
  codigoUsuario?: string | null;
  canAccessVista: (vistaCodigo: string) => boolean;
  hasRole: (roles: Role | Role[]) => boolean;
}

const EMPTY_PERMISSIONS: Permissions = {
  roles: [],
  vistas: new Set<string>(),
  isAdmin: false,
  isTecnico: false,
  canAccessVista: () => false,
  hasRole: () => false,
};

/**
 * Hook para gestionar permisos y roles de forma centralizada.
 */
export const usePermissions = (): Permissions => {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return EMPTY_PERMISSIONS;
    }

    const userRole = user.rol_nombre as Role;
    const isAdmin = userRole === Role.ADMIN;
    const isTecnico = [
      Role.TECNICO,
      Role.TECNICOS_C,
      Role.TECNICOS_B,
      Role.TECNICOS_AVERIAS,
    ].includes(userRole);
    const codigoUsuario = user.codigo_usuario;

    const allowedVistas = new Set(Object.values(user.vistas || {}).flat());

    const defaultVistas = ROLE_DEFAULT_VISTAS[userRole] || [];
    defaultVistas.forEach((v) => {
      if (v !== '*') {
        allowedVistas.add(v);
      }
    });

    if (isTecnico) {
      [
        Role.TECNICO,
        Role.TECNICOS_C,
        Role.TECNICOS_B,
        Role.TECNICOS_AVERIAS,
      ].forEach((r) => {
        (ROLE_DEFAULT_VISTAS[r] || []).forEach((v) => allowedVistas.add(v));
      });
    }

    return {
      role: userRole,
      roles: [userRole],
      vistas: allowedVistas,
      isAdmin,
      isTecnico,
      codigoUsuario,
      canAccessVista: (vistaCodigo: string) =>
        isAdmin || allowedVistas.has(vistaCodigo),
      hasRole: (roles: Role | Role[]) => {
        if (isAdmin) return true;
        const rolesArray = Array.isArray(roles) ? roles : [roles];
        return rolesArray.includes(userRole);
      },
    };
  }, [user]);
};
