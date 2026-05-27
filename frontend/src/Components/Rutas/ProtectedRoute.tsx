import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import { remoteLog } from '../../utils/logger';
import { usePermissions } from '../../Hooks/usePermissions';
import { Role } from '../../config/roles';
import Loader from '../common/Loader';

interface ProtectedRouteProps {
    requiredRole?: Role | Role[];
}

/**
 * Componente que protege rutas del frontend verificando la sesión con el AuthContext.
 * ⚠️  DEV: Si VITE_DEV_BYPASS_AUTH=true se salta el login (solo para desarrollo local).
 */
const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const { hasRole } = usePermissions();

    // ── DEV BYPASS ──────────────────────────────────────────────────
    if (import.meta.env.VITE_DEV_BYPASS_AUTH === 'true') {
        return <Outlet />;
    }
    // ────────────────────────────────────────────────────────────────

    if (loading) {
        return <Loader />;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Si se requiere un rol específico y no coincide, redirigir al login (o a una pág de error)
    if (requiredRole) {
        if (!hasRole(requiredRole)) {
            const rolesStr = Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole;
            remoteLog(`Acceso denegado: se requieren roles [${rolesStr}] para usuario ${user.usuario} (rol actual: ${user.rol_nombre})`, { level: 'WARN', context: 'ProtectedRoute' });
            return <Navigate to="/hub" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
  