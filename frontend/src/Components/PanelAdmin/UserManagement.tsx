import { useState, useEffect } from 'react';
import axios from 'axios';
import './userManagement.css';

interface User {
    id: number;
    usuario: string;
    correo: string;
    activo: boolean;
    rol_nombre: string;
}

// 1. Definimos la interfaz según tu captura de pantalla
interface Role {
    id: number;
    nombre: string;
    descripcion: string;
}

interface UserManagementProps {
    onChanges?: () => void;
}

const UserManagement = ({ onChanges }: UserManagementProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]); // Estado para los roles de la DB
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        usuario: '',
        correo: '',
        password: '',
        rol_id: '' // Empezamos vacío hasta que carguen los roles
    });

    useEffect(() => {
        // Cargamos usuarios y roles al iniciar
        const loadData = async () => {
            try {
                await Promise.all([fetchUsers(), fetchRoles()]);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/users', { withCredentials: true });
            setUsers(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError('Error al cargar usuarios');
        }
    };

    // 2. Función para obtener los roles de tu SQLite
    const fetchRoles = async () => {
        try {
            const response = await axios.get('/roles', { withCredentials: true });
            const data = Array.isArray(response.data) ? response.data : [];
            setRoles(data);

            // Opcional: Seleccionar el primer rol por defecto si hay datos
            if (response.data.length > 0) {
                setFormData(prev => ({ ...prev, rol_id: response.data[0].id.toString() }));
            }
        } catch (err) {
            console.error('Error al cargar roles de la API');
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            await axios.patch(`/users/${user.id}/status`,
                { activo: !user.activo },
                { withCredentials: true }
            );
            fetchUsers();
            onChanges?.();
        } catch (err) {
            alert('Error al actualizar estado');
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Convertimos rol_id a número antes de enviar (ya que en la DB es INTEGER)
            const dataToSend = { ...formData, rol_id: Number(formData.rol_id) };

            await axios.post('/users', dataToSend, { withCredentials: true });
            setShowModal(false);
            setFormData({
                usuario: '',
                correo: '',
                password: '',
                rol_id: roles.length > 0 ? roles[0].id.toString() : ''
            });
            fetchUsers();
            onChanges?.();
        } catch (err: any) {
            if (err.response?.data?.message) {
                const msg = err.response.data.message;
                alert(`Error: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
            } else {
                alert('Error al crear usuario');
            }
        }
    };

    if (loading) return <div className="um-loading">Cargando...</div>;
    if (error) return <div className="um-error">{error}</div>;

    return (
        <div className="user-management">
            <div className="um-header">
                <button className="um-add-button" onClick={() => setShowModal(true)}>+ Nuevo Usuario</button>
            </div>

            <div className="um-table-container">
                <table className="um-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Usuario</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(users) && users.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.usuario}</td>
                                <td>{user.correo}</td>
                                <td>{user.rol_nombre}</td>
                                <td>
                                    <span className={`status-badge ${user.activo ? 'active' : 'inactive'}`}>
                                        {user.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className={`um-action-btn ${user.activo ? 'deactivate' : 'activate'}`}
                                        onClick={() => handleToggleStatus(user)}
                                    >
                                        {user.activo ? 'Desactivar' : 'Activar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="um-modal-overlay">
                    <div className="um-modal">
                        <h4>Registrar Nuevo Usuario</h4>
                        <form onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <label>Usuario</label>
                                <input
                                    type="text"
                                    value={formData.usuario}
                                    onChange={e => setFormData({ ...formData, usuario: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Correo</label>
                                <input
                                    type="email"
                                    value={formData.correo}
                                    onChange={e => setFormData({ ...formData, correo: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Contraseña</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>

                            {/* 3. El SELECT ahora es dinámico */}
                            <div className="form-group">
                                <label>Rol</label>
                                <select
                                    value={formData.rol_id}
                                    onChange={e => setFormData({ ...formData, rol_id: e.target.value })}
                                    required
                                >
                                    {roles.length === 0 && <option value="">Cargando roles...</option>}
                                    {roles.map(rol => (
                                        <option key={rol.id} value={rol.id}>
                                            {rol.nombre} {/* Mostraría todos los campos del rol*/}
                                        </option>
                                    ))}
                                </select>
                                {roles.length > 0 && (
                                    <small style={{ display: 'block', color: '#666', marginTop: '4px' }}>
                                        {/* Muestra la descripción del rol seleccionado como ayuda */}
                                        {roles.find(r => r.id.toString() === formData.rol_id)?.descripcion}
                                    </small>
                                )}
                            </div>

                            <div className="um-modal-actions">
                                <button className="um-cancel-btn" type="button" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="um-submit-btn">Registrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
  