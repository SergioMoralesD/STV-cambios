import { useState, useEffect } from 'react';
import axios from 'axios';
import './roleManagement.css';

interface Role {
    id: number;
    nombre: string;
    descripcion: string;
    tiempo_del_token?: number;
}

interface PermissionData {
    regiones: { id: number; codigo: string; nombre: string }[];
    vistas: { id: number; codigo: string; nombre: string }[];
    delegaciones: { id: number; region_id: number; codigo: string; nombre: string }[];
}

interface Permission {
    regionId: number;
    vistaId: number;
    delegacionId: number;
}

interface RoleManagementProps {
    onChanges?: () => void;
}

const RoleManagement = ({ onChanges }: RoleManagementProps) => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [roleTimeEdits, setRoleTimeEdits] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const [permData, setPermData] = useState<PermissionData | null>(null);
    const [currentPermissions, setCurrentPermissions] = useState<Permission[]>([]);

    const [newRole, setNewRole] = useState({ nombre: '', descripcion: '', tiempo_del_token: 8 });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2500);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        fetchRoles();
        fetchPermissionData();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await axios.get('/roles', { withCredentials: true });
            const data = Array.isArray(response.data) ? response.data : [];
            setRoles(data);
            const initialTimes: Record<number, string> = {};
            data.forEach((r: Role) => {
                if (typeof r.tiempo_del_token === 'number') {
                    initialTimes[r.id] = r.tiempo_del_token.toString();
                }
            });
            setRoleTimeEdits(initialTimes);
        } catch (err) {
            console.error('Error fetching roles:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissionData = async () => {
        try {
            const response = await axios.get('/roles/permissions-data', { withCredentials: true });
            setPermData(response.data);
        } catch (err) {
            console.error('Error fetching permission data:', err);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/roles', newRole, { withCredentials: true });
            setShowCreateModal(false);
            setNewRole({ nombre: '', descripcion: '', tiempo_del_token: 8 });
            fetchRoles();
            onChanges?.();
        } catch (err) {
            alert('Error al crear el rol');
        }
    };

    const handleOpenPermissions = async (role: Role) => {
        setSelectedRole(role);
        try {
            const response = await axios.get(`/roles/${role.id}/permissions`, { withCredentials: true });
            // Map keys from DB (region_id, vista_id, delegacion_id) to our state format
            const mapped = response.data.map((p: any) => ({
                regionId: p.region_id,
                vistaId: p.vista_id,
                delegacionId: p.delegacion_id
            }));
            setCurrentPermissions(mapped);
            setShowPermissionsModal(true);
        } catch (err) {
            alert('Error al cargar permisos del rol');
        }
    };

    const togglePermission = (regionId: number, vistaId: number, delegacionId: number) => {
        const index = currentPermissions.findIndex(
            p => p.regionId === regionId && p.vistaId === vistaId && p.delegacionId === delegacionId
        );

        if (index > -1) {
            setCurrentPermissions(currentPermissions.filter((_, i) => i !== index));
        } else {
            setCurrentPermissions([...currentPermissions, { regionId, vistaId, delegacionId }]);
        }
    };

    const toggleAllForVistaInRegion = (regionId: number, vistaId: number) => {
        const delegations = permData?.delegaciones.filter(d => d.region_id === regionId) || [];
        const isAllSelected = isAllSelectedForVistaInRegion(regionId, vistaId);

        if (isAllSelected) {
            setCurrentPermissions(prev => prev.filter(p => !(p.regionId === regionId && p.vistaId === vistaId)));
        } else {
            const newPerms = delegations.map(d => ({ regionId, vistaId, delegacionId: d.id }));
            setCurrentPermissions(prev => {
                const other = prev.filter(p => !(p.regionId === regionId && p.vistaId === vistaId));
                return [...other, ...newPerms];
            });
        }
    };

    const isAllSelectedForVistaInRegion = (regionId: number, vistaId: number) => {
        const delegations = permData?.delegaciones.filter(d => d.region_id === regionId) || [];
        if (delegations.length === 0) return false;
        return delegations.every(d =>
            currentPermissions.some(p => p.regionId === regionId && p.vistaId === vistaId && p.delegacionId === d.id)
        );
    };

    const toggleAllForRegion = (regionId: number) => {
        const isAllSelected = isAllSelectedForRegion(regionId);
        if (isAllSelected) {
            setCurrentPermissions(prev => prev.filter(p => p.regionId !== regionId));
        } else {
            const allInRegion: Permission[] = [];
            const regionDelegations = permData?.delegaciones.filter(d => d.region_id === regionId) || [];
            permData?.vistas.forEach(v => {
                regionDelegations.forEach(d => {
                    allInRegion.push({ regionId, vistaId: v.id, delegacionId: d.id });
                });
            });
            setCurrentPermissions(prev => {
                const other = prev.filter(p => p.regionId !== regionId);
                return [...other, ...allInRegion];
            });
        }
    };

    const isAllSelectedForRegion = (regionId: number) => {
        const regionDelegations = permData?.delegaciones.filter(d => d.region_id === regionId) || [];
        if (regionDelegations.length === 0) return false;
        return permData?.vistas.every(v =>
            regionDelegations.every(d =>
                currentPermissions.some(p => p.regionId === regionId && p.vistaId === v.id && p.delegacionId === d.id)
            )
        ) || false;
    };

    const toggleAllPermissions = () => {
        const isCurrentlyAnySelected = currentPermissions.length > 0;

        if (isCurrentlyAnySelected) {
            setCurrentPermissions([]);
        } else {
            const all: Permission[] = [];
            permData?.regiones.forEach(r => {
                const regionDelegations = permData.delegaciones.filter(d => d.region_id === r.id);
                permData.vistas.forEach(v => {
                    regionDelegations.forEach(d => {
                        all.push({ regionId: r.id, vistaId: v.id, delegacionId: d.id });
                    });
                });
            });
            setCurrentPermissions(all);
        }
    };

    const isPermissionActive = (regionId: number, vistaId: number, delegacionId: number) => {
        return currentPermissions.some(
            p => p.regionId === regionId && p.vistaId === vistaId && p.delegacionId === delegacionId
        );
    };

    const savePermissions = async () => {
        if (!selectedRole) return;
        try {
            await axios.post(`/roles/${selectedRole.id}/permissions`,
                { permissions: currentPermissions },
                { withCredentials: true }
            );
            setShowPermissionsModal(false);
            setToast({ message: 'Permisos actualizados correctamente', type: 'success' });
            onChanges?.();
        } catch (err) {
            setToast({ message: 'Error al guardar permisos', type: 'error' });
        }
    };

    const handleSaveTokenTime = async (roleId: number) => {
        const value = roleTimeEdits[roleId];
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            alert('El tiempo del token debe ser un número mayor que 0');
            return;
        }
        try {
            await axios.patch(
                `/roles/${roleId}`,
                { tiempo_del_token: Math.floor(parsed) },
                { withCredentials: true }
            );
            setToast({ message: 'Tiempo del token actualizado', type: 'success' });
            fetchRoles();
            onChanges?.();
        } catch (err) {
            setToast({ message: 'Error al actualizar el tiempo del token', type: 'error' });
        }
    };
    if (loading) return <div>Cargando roles...</div>;

    return (
        <div className="role-management">
            {toast && (
                <div className={`rm-toast ${toast.type === 'success' ? 'rm-toast-success' : 'rm-toast-error'}`}>
                    {toast.message}
                </div>
            )}

            <div className="rm-header">
                <button className="rm-add-button" onClick={() => setShowCreateModal(true)}>+ Nuevo Rol</button>
            </div>

            <div className="rm-table-container">
                <table className="rm-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Caducida Token (h)</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(roles) && roles.map(role => (
                            <tr key={role.id}>
                                <td>{role.id}</td>
                                <td>{role.nombre}</td>
                                <td>{role.descripcion}</td>
                                <td>
                                    <input
                                        type="number"
                                        min={1}
                                        className="rm-input-time"
                                        value={roleTimeEdits[role.id] ?? ''}
                                        onChange={e => setRoleTimeEdits({
                                            ...roleTimeEdits,
                                            [role.id]: e.target.value
                                        })}
                                    />
                                </td>
                                <td>
                                    <button
                                        className="rm-action-btn permissions-btn"
                                        onClick={() => handleOpenPermissions(role)}
                                    >
                                        Configurar Permisos
                                    </button>
                                    <button
                                        className="rm-action-btn gurdartiempo-btn"
                                        onClick={() => handleSaveTokenTime(role.id)}
                                    >
                                        Guardar tiempo
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Crear Rol */}
            {showCreateModal && (
                <div className="rm-modal-overlay">
                    <div className="rm-modal">
                        <h4>Crear Nuevo Rol</h4>
                        <form onSubmit={handleCreateRole}>
                            <div className="form-group">
                                <label>Nombre del Rol</label>
                                <input
                                    type="text"
                                    value={newRole.nombre}
                                    onChange={e => setNewRole({ ...newRole, nombre: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    value={newRole.descripcion}
                                    onChange={e => setNewRole({ ...newRole, descripcion: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Tiempo del token (horas)</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={newRole.tiempo_del_token}
                                    onChange={e => setNewRole({
                                        ...newRole,
                                        tiempo_del_token: Number(e.target.value)
                                    })}
                                    required
                                />
                            </div>
                            <div className="rm-modal-actions">
                                <button type="button" className="rm-cancel-btn" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                                <button type="submit" className="rm-submit-btn">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Configurar Permisos */}
            {showPermissionsModal && selectedRole && permData && (
                <div className="rm-modal-overlay">
                    <div className="rm-modal rm-modal-large">
                        <h4>Permisos para: {selectedRole.nombre}</h4>

                        <div className="permissions-matrix">
                            <div className="all-selector">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={currentPermissions.length > 0 && permData.regiones.every(r => isAllSelectedForRegion(r.id))}
                                        onChange={toggleAllPermissions}
                                    />
                                    <strong>Marcar/Desmarcar Todos los Permisos</strong>
                                </label>
                            </div>

                            {permData.regiones.map(region => (
                                <div key={region.id} className="region-section">
                                    <div className="region-header">
                                        <label className="region-header-label">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelectedForRegion(region.id)}
                                                onChange={() => toggleAllForRegion(region.id)}
                                            />
                                            {region.nombre} ({region.codigo})
                                        </label>
                                    </div>

                                    {permData.vistas.map(vista => (
                                        <div key={vista.id} className="vista-row">
                                            <div className="vista-header">
                                                <label className="vista-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllSelectedForVistaInRegion(region.id, vista.id)}
                                                        onChange={() => toggleAllForVistaInRegion(region.id, vista.id)}
                                                    />
                                                    <span className="vista-name">{vista.nombre}</span>
                                                </label>
                                            </div>
                                            <div className="delegations-grid">
                                                {permData.delegaciones
                                                    .filter(d => d.region_id === region.id)
                                                    .map(deleg => (
                                                        <label key={deleg.id} className="delegation-item">
                                                            <input
                                                                type="checkbox"
                                                                checked={isPermissionActive(region.id, vista.id, deleg.id)}
                                                                onChange={() => togglePermission(region.id, vista.id, deleg.id)}
                                                            />
                                                            {deleg.nombre}
                                                        </label>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="rm-modal-actions">
                            <button type="button" className="rm-cancel-btn" onClick={() => setShowPermissionsModal(false)}>Cerrar</button>
                            <button type="button" className="rm-submit-btn" onClick={savePermissions}>Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManagement;














  