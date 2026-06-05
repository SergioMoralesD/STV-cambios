import { useState, useEffect } from 'react';
import axios from 'axios';
import './vistasManagement.css';

interface Vista {
    id: number;
    codigo: string;
    nombre: string;
    mostrar_juntas: number;
    param_key: string;
    joiner: string;
}

interface Region {
    id: number;
    codigo: string;
    nombre: string;
}

interface Delegacion {
    id: number;
    region_id: number;
    codigo: string;
    nombre: string;
}

interface UrlConfig {
    region_id: number;
    url: string;
}

interface IslaConfig {
    region_id: number;
    label: string;
    mainplant: string;
    orden: number;
}

interface VistasManagementProps {
    onChanges?: () => void;
}

const VistasManagement = ({ onChanges }: VistasManagementProps) => {
    const [vistas, setVistas] = useState<Vista[]>([]);
    const [regiones, setRegiones] = useState<Region[]>([]);
    const [delegaciones, setDelegaciones] = useState<Delegacion[]>([]);
    const [loading, setLoading] = useState(true);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);

    const [selectedVista, setSelectedVista] = useState<Vista | null>(null);
    const [urls, setUrls] = useState<UrlConfig[]>([]);
    const [islas, setIslas] = useState<IslaConfig[]>([]);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [newVista, setNewVista] = useState({
        codigo: '',
        nombre: '',
        mostrar_juntas: 0,
        param_key: 'mainplant',
        joiner: '-'
    });

    const [editingVista, setEditingVista] = useState<Vista | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Añade esta función dentro de tu componente VistasManagement
    const probarEnlace = (url: string) => {
        if (!url) return alert("Escribe una URL primero");

        if (url.startsWith('http')) {
            alert("🔍 ENLACE EXTERNO: Se intentará abrir en una pestaña nueva.");
            window.open(url, '_blank');
            return;
        }

        // Aquí comparamos con las rutas que tú sabes que tienes en
        const rutasValidas = ["averias", "averiasrepetitivas", "cordinacion", "hub", "stvlogisticaagenda"];

        // Limpiamos la URL de parámetros para la prueba (quitamos el ?mainplant=...)
        const rutaBase = url.split('?')[0];

        if (rutasValidas.includes(rutaBase)) {
            alert(`✅ RUTA INTERNA VÁLIDA: El código reconoce "${rutaBase}" y debería cargar el componente.`);
        } else {
            alert(`❌ RUTA NO ENCONTRADA: Has escrito "${rutaBase}", pero esta puerta no está configurada. ¡No funcionará!`);
        }
    };


    useEffect(() => {
        fetchVistas();
        fetchPermissionsData();
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 1500);
        return () => clearTimeout(timer);
    }, [toast]);

    const fetchVistas = async () => {
        try {
            const response = await axios.get('/vistas/all', { withCredentials: true });
            setVistas(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching vistas:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissionsData = async () => {
        try {
            const response = await axios.get('/roles/permissions-data', { withCredentials: true });
            setRegiones(response.data.regiones);
            setDelegaciones(response.data.delegaciones);
        } catch (err) {
            console.error('Error fetching permissions data:', err);
        }
    };

    const handleCreateVista = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/vistas', newVista, { withCredentials: true });
            setShowCreateModal(false);
            setNewVista({ codigo: '', nombre: '', mostrar_juntas: 0, param_key: 'mainplant', joiner: '-' });
            fetchVistas();
            onChanges?.();
        } catch (err) {
            alert('Error al crear la vista');
        }
    };

    const handleUpdateVista = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingVista) return;
        try {
            await axios.patch(`/vistas/${editingVista.id}`, editingVista, { withCredentials: true });
            setShowEditModal(false);
            setEditingVista(null);
            fetchVistas();
            onChanges?.();
            setToast({ message: 'Vista actualizada correctamente', type: 'success' });
        } catch (err) {
            alert('Error al actualizar la vista');
        }
    };

    const handleDeleteVista = async (id: number) => {
        if (!window.confirm('¿Seguro que deseas eliminar esta vista? Se borrará también toda su configuración de URLs e islas.')) return;
        try {
            await axios.delete(`/vistas/${id}`, { withCredentials: true });
            fetchVistas();
            onChanges?.();
        } catch (err) {
            alert('Error al borrar la vista');
        }
    };

    const toggleMostrarJuntas = async (vista: Vista) => {
        if (savingId) return;
        const next = vista.mostrar_juntas === 1 ? 0 : 1;
        setSavingId(vista.id);
        setVistas(prev => prev.map(v => v.id === vista.id ? { ...v, mostrar_juntas: next } : v));
        try {
            await axios.patch(`/vistas/${vista.id}`, {
                codigo: vista.codigo,
                nombre: vista.nombre,
                mostrar_juntas: next,
                param_key: vista.param_key,
                joiner: vista.joiner
            }, { withCredentials: true });
            setToast({ message: `Mostrar juntas: ${next === 1 ? 'Si' : 'No'}`, type: 'success' });
            onChanges?.();
        } catch (err) {
            setVistas(prev => prev.map(v => v.id === vista.id ? { ...v, mostrar_juntas: vista.mostrar_juntas } : v));
            setToast({ message: 'Error al guardar el cambio', type: 'error' });
        } finally {
            setSavingId(null);
        }
    };

    const handleOpenEdit = (vista: Vista) => {
        setEditingVista({ ...vista });
        setShowEditModal(true);
    };

    const handleOpenConfig = async (vista: Vista) => {
        setSelectedVista(vista);
        try {
            const response = await axios.get(`/vistas/${vista.id}/config`, { withCredentials: true });
            const loadedUrls = response.data.urls || [];
            const loadedIslas = response.data.islas || [];

            const configUrls: UrlConfig[] = regiones.map(r => {
                const exist = loadedUrls.find((u: any) => u.region_id === r.id);
                return exist ? { region_id: r.id, url: exist.url } : { region_id: r.id, url: '' };
            });

            setUrls(configUrls);
            setIslas(loadedIslas);
            setShowConfigModal(true);
        } catch (err) {
            alert('Error al cargar la configuración de la vista');
        }
    };

    const handleSaveConfig = async () => {
        if (!selectedVista) return;
        try {
            await axios.post(`/vistas/${selectedVista.id}/config`, {
                urls: urls.filter(u => u.url.trim() !== ''),
                islas: islas.filter(i => i.label.trim() !== '' && i.mainplant.trim() !== '')
            }, { withCredentials: true });

            setShowConfigModal(false);
            alert('Configuración guardada correctamente');
            onChanges?.();
        } catch (err) {
            alert('Error al guardar configuración');
        }
    };

    const updateUrl = (regionId: number, val: string) => {
        setUrls(urls.map(u => u.region_id === regionId ? { ...u, url: val } : u));
    };

    // Cuando se añade una isla, pre-seleccionamos la primera delegación de la región
    const addIsla = (regionId: number) => {
        const regionDelegs = delegaciones.filter(d => d.region_id === regionId);
        const firstDeleg = regionDelegs[0];
        const newOrden = islas.filter(i => i.region_id === regionId).length + 1;
        setIslas([...islas, {
            region_id: regionId,
            label: firstDeleg ? firstDeleg.nombre : '',
            mainplant: firstDeleg ? firstDeleg.codigo : '',
            orden: newOrden
        }]);
    };

    // Al seleccionar delegación en el desplegable, actualizamos label y mainplant
    const handleDelegacionChange = (index: number, delegCodigo: string, regionId: number) => {
        const deleg = delegaciones.find(d => d.codigo === delegCodigo && d.region_id === regionId);
        if (!deleg) return;
        const copy = [...islas];
        copy[index] = {
            ...copy[index],
            mainplant: deleg.codigo,
            label: deleg.nombre
        };
        setIslas(copy);
    };

    const updateIsla = (index: number, key: keyof IslaConfig, val: any) => {
        const copy = [...islas];
        copy[index] = { ...copy[index], [key]: val };
        setIslas(copy);
    };

    const removeIsla = (index: number) => {
        const copy = [...islas];
        copy.splice(index, 1);
        setIslas(copy);
    };

    if (loading) return <div>Cargando vistas...</div>;

    return (
        <div className="vistas-management">
            {toast && (
                <div className={`vm-toast ${toast.type === 'success' ? 'vm-toast-success' : 'vm-toast-error'}`}>
                    {toast.message}
                </div>
            )}
            <div className="vm-header">
                <button className="vm-add-button" onClick={() => setShowCreateModal(true)}>+ Nueva Vista</button>
            </div>

            <div className="vm-table-container">
                <table className="vm-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Código</th>
                            <th>Nombre</th>
                                <th title="Si activo, las islas del submenú se agrupan en un único parámetro de URL (ej: ?mps=6S21-6S23). Si desactivado, cada isla es un enlace independiente.">
                                    Param. Conjunto
                                </th>
                                <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(vistas) && vistas.map(vista => (
                            <tr key={vista.id}>
                                <td>{vista.id}</td>
                                <td><strong>{vista.codigo}</strong></td>
                                <td>{vista.nombre}</td>
                                <td>
                                    <button
                                        className={`vm-toggle ${vista.mostrar_juntas === 1 ? 'vm-toggle-on' : 'vm-toggle-off'}`}
                                        onClick={() => toggleMostrarJuntas(vista)}
                                        disabled={savingId === vista.id}
                                        aria-pressed={vista.mostrar_juntas === 1}
                                    >
                                        {vista.mostrar_juntas === 1 ? 'Si' : 'No'}
                                    </button>
                                </td>
                                <td>
                                    <button
                                        className="vm-action-btn edit-btn"
                                        onClick={() => handleOpenEdit(vista)}
                                    >
                                        ✏️ Editar
                                    </button>
                                    <button
                                        className="vm-action-btn config-btn"
                                        onClick={() => handleOpenConfig(vista)}
                                    >
                                        ⚙️ Configurar
                                    </button>
                                    <button
                                        className="vm-action-btn delete-btn"
                                        onClick={() => handleDeleteVista(vista.id)}
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Crear Vista */}
            {showCreateModal && (
                <div className="vm-modal-overlay">
                    <div className="vm-modal">
                        <h4>Crear Nueva Vista</h4>
                        <form onSubmit={handleCreateVista}>
                            <div className="form-group">
                                <label>Código (ej: AVERIAS)</label>
                                <input
                                    type="text"
                                    value={newVista.codigo}
                                    onChange={e => setNewVista({ ...newVista, codigo: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Nombre Descriptivo</label>
                                <input
                                    type="text"
                                    value={newVista.nombre}
                                    onChange={e => setNewVista({ ...newVista, nombre: e.target.value })}
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={newVista.mostrar_juntas === 1}
                                        onChange={e => setNewVista({ ...newVista, mostrar_juntas: e.target.checked ? 1 : 0 })}
                                    />
                                    Parámetro conjunto (agrupar islas)
                                </label>
                            </div>

                            <div className="vm-modal-actions">
                                <button type="button" className="vm-cancel-btn" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                                <button type="submit" className="vm-submit-btn">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Editar Vista */}
            {showEditModal && editingVista && (
                <div className="vm-modal-overlay">
                    <div className="vm-modal">
                        <h4>Editar Vista: {editingVista.codigo}</h4>
                        <form onSubmit={handleUpdateVista}>
                            <div className="form-group">
                                <label>Código (ej: AVERIAS)</label>
                                <input
                                    type="text"
                                    value={editingVista.codigo}
                                    onChange={e => setEditingVista({ ...editingVista, codigo: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Nombre Descriptivo</label>
                                <input
                                    type="text"
                                    value={editingVista.nombre}
                                    onChange={e => setEditingVista({ ...editingVista, nombre: e.target.value })}
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={editingVista.mostrar_juntas === 1}
                                        onChange={e => setEditingVista({ ...editingVista, mostrar_juntas: e.target.checked ? 1 : 0 })}
                                    />
                                    Parámetro conjunto (agrupar islas)
                                </label>
                            </div>

                            <div className="vm-modal-actions">
                                <button type="button" className="vm-cancel-btn" onClick={() => setShowEditModal(false)}>Cancelar</button>
                                <button type="submit" className="vm-submit-btn">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Configurar URLs e Islas */}
            {showConfigModal && selectedVista && (
                <div className="vm-modal-overlay">
                    <div className="vm-modal vm-modal-large">
                        <h4>Configurar Vista: <strong>{selectedVista.codigo}</strong> — {selectedVista.nombre}</h4>

                        <div className="config-matrix">
                            {regiones.map(region => {
                                const urlObj = urls.find(u => u.region_id === region.id);
                                const currentUrl = urlObj ? urlObj.url : '';
                                const regionIslas = islas
                                    .map((isla, idx) => ({ ...isla, originalIndex: idx }))
                                    .filter(i => i.region_id === region.id);
                                const regionDelegs = delegaciones.filter(d => d.region_id === region.id);

                                return (
                                    <div key={region.id} className="region-config-section">
                                        <div className="region-header">{region.nombre} ({region.codigo})</div>

                                        <div className="config-url">
                                            <label>URL / Ruta:</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    style={{ flex: 1 }} // Hace que el input ocupe el espacio sobrante
                                                    value={currentUrl}
                                                    onChange={(e) => updateUrl(region.id, e.target.value)}
                                                    placeholder="Ej: averias   o   https://sharepoint.com/..."
                                                />
                                                <button
                                                    type="button"
                                                    className="vm-sm-btn" // Usamos tu clase de botón pequeño
                                                    style={{
                                                        whiteSpace: 'nowrap',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                    onClick={() => probarEnlace(currentUrl)}
                                                >
                                                    👁️ Probar
                                                </button>
                                            </div>
                                            <small style={{ color: '#666', fontSize: '0.75rem' }}>
                                                Las rutas internas deben coincidir con <code>App.tsx</code>
                                            </small>
                                        </div>

                                        <div className="config-islas">
                                            <div className="islas-header">
                                                <h5>Submenú de Islas / Delegaciones</h5>
                                                {regionDelegs.length > 0
                                                    ? <button className="vm-sm-btn" onClick={() => addIsla(region.id)}>+ Añadir</button>
                                                    : <span className="no-delegs-note">Sin delegaciones configuradas para esta región</span>
                                                }
                                            </div>

                                            {regionIslas.length === 0 ? (
                                                <div className="empty-islas">Sin submenús — esta vista tendrá un único enlace directo.</div>
                                            ) : (
                                                <table className="islas-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Orden</th>
                                                            <th>Delegación (Mainplant)</th>
                                                            <th>Etiqueta visible</th>
                                                            <th></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {regionIslas.map((isla) => (
                                                            <tr key={isla.originalIndex}>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        value={isla.orden}
                                                                        onChange={e => updateIsla(isla.originalIndex, 'orden', Number(e.target.value))}
                                                                        className="orden-input"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <select
                                                                        value={isla.mainplant}
                                                                        onChange={e => handleDelegacionChange(isla.originalIndex, e.target.value, region.id)}
                                                                        className="delegacion-select"
                                                                    >
                                                                        {/* Opción para mainplants compuestos existentes que no estén en la lista */}
                                                                        {!regionDelegs.find(d => d.codigo === isla.mainplant) && isla.mainplant && (
                                                                            <option value={isla.mainplant}>{isla.mainplant} (personalizado)</option>
                                                                        )}
                                                                        {regionDelegs.map(d => (
                                                                            <option key={d.id} value={d.codigo}>
                                                                                {d.nombre} ({d.codigo})
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        value={isla.label}
                                                                        onChange={e => updateIsla(isla.originalIndex, 'label', e.target.value)}
                                                                        placeholder="Nombre visible en el menú"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <button className="del-isla-btn" onClick={() => removeIsla(isla.originalIndex)}>🗑</button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="vm-modal-actions">
                            <button type="button" className="vm-cancel-btn" onClick={() => setShowConfigModal(false)}>Cerrar</button>
                            <button type="button" className="vm-submit-btn" onClick={handleSaveConfig}>Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VistasManagement;

  