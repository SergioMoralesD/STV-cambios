import { useAuth } from '../Context/AuthContext';
import { Role, ROLE_DEFAULT_VISTAS } from '../config/roles';
import { useMemo } from 'react';

/**
 * Hook para gestionar permisos y roles de forma centralizada.
 */
export const usePermissions = () => {
    const { user } = useAuth();

    const permissions = useMemo(() => {
        if (!user) return { roles: [], vistas: new Set<string>(), isAdmin: false, isTecnico: false };

        const userRole = user.rol_nombre as Role;
        const isAdmin = userRole === Role.ADMIN;
        const isTecnico = [Role.TECNICO, Role.TECNICOS_C, Role.TECNICOS_B, Role.TECNICOS_AVERIAS].includes(userRole);
        const codigoUsuario = user.codigo_usuario;

        // 1. Vistas desde la DB
        const allowedVistas = new Set(Object.values(user.vistas || {}).flat());

        // 2. Vistas por defecto según el rol
        const defaultVistas = ROLE_DEFAULT_VISTAS[userRole] || [];
        defaultVistas.forEach(v => {
            if (v === '*') {
                // El admin puede tener un flag especial o simplemente inyectamos todo si fuera necesario
                // Pero generalmente el admin ya tiene todo en user.vistas
            } else {
                allowedVistas.add(v);
            }
        });

        // 3. Vistas específicas para técnicos (Aseguramos que tengan sus vistas base)
        if (isTecnico) {
            [Role.TECNICO, Role.TECNICOS_C, Role.TECNICOS_B, Role.TECNICOS_AVERIAS].forEach(r => {
                (ROLE_DEFAULT_VISTAS[r] || []).forEach(v => allowedVistas.add(v));
            });
        }

        return {
            role: userRole,
            vistas: allowedVistas,
            isAdmin,
            isTecnico,
            codigoUsuario,
            canAccessVista: (vistaCodigo: string) => isAdmin || allowedVistas.has(vistaCodigo),
            hasRole: (roles: Role | Role[]) => {
                if (isAdmin) return true;
                const rolesArray = Array.isArray(roles) ? roles : [roles];
                return rolesArray.includes(userRole);
            }
        };
    }, [user]);

    return permissions;
};
  