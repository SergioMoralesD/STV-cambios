import { useState, useEffect } from 'react'
import './panelAdmin.css'
import { useAuth } from '../../Context/AuthContext'
import UserManagement from './UserManagement'
import RoleManagement from './RoleManagement'
import VistasManagement from './VistasManagement'
import { HelpButton, HelpMenu } from '../Help/helpmenu'

const PanelAdmin = () => {
    const { user } = useAuth();
    const [view, setView] = useState<'menu' | 'activity' | 'sessions' | 'users' | 'roles' | 'vistas'>('menu');
    const [isActive, setIsActive] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const notifyChanges = () => setHasChanges(true);

    useEffect(() => {
        if (isActive) {
            console.log('[PanelAdmin] User Role:', user?.rol_nombre);
            console.log('[PanelAdmin] Current View:', view);
        }
    }, [isActive, view, user]);

    const togglePanel = () => {
        if (isCollapsed) {
            setIsCollapsed(false);
            return;
        } else {
            setIsActive(!isActive);
        }
    }
    const toggleCollapse = () => setIsCollapsed(!isCollapsed);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    return (
        <>
            <button className="panel-admin-button" onClick={togglePanel}>Panel de Administrador</button>


            <div className={`panel-admin-container ${isActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
                <button
                    className="panel-collapse-toggle"
                    onClick={toggleCollapse}
                    title={isCollapsed ? "Expandir" : "Colapsar"}
                >
                    {isCollapsed ? '>' : '<'}
                </button>

                <div className="panel-admin-content">
                    {/* 1. Pasamos 'view' a 'subView' */}
                    <HelpMenu
                        isOpen={isHelpOpen}
                        onClose={() => setIsHelpOpen(false)}
                        subView={view}
                    />
                    <div className="panel-admin-header">
                        <h2 className="panel-admin-title">
                            {/* 2. El botón detectará solo si eres Admin y abrirá el menú */}
                            <HelpButton onClick={() => setIsHelpOpen(true)} />
                            {view === 'menu' ? 'Panel de Administrador' :
                                view === 'users' ? 'Gestión de Usuarios' :
                                    view === 'activity' ? 'Actividad' :
                                        view === 'roles' ? 'Gestión de Roles' :
                                            view === 'vistas' ? 'Gestión de Vistas' : 'Sesiones'}
                        </h2>
                        {view !== 'menu' && (
                            <button className="back-to-menu" onClick={() => setView('menu')}>
                                Volver al Menú
                            </button>
                        )}
                    </div>

                    {hasChanges && (
                        <div className="panel-admin-alert">
                            <span>⚠️ Necesita recargar la página para ver los cambios</span>
                            <button className="reload-btn" onClick={() => window.location.reload()}>
                                Recargar ahora
                            </button>
                        </div>
                    )}

                    {view === 'menu' && (
                        <div className="panel-menu-options">
                            <button
                                className="admin-btn"
                                onClick={() => setView('activity')}
                            >
                                Actividad de Usuarios
                            </button>
                            <button
                                className="admin-btn"
                                onClick={() => setView('users')}
                            >
                                Usuarios Registrados
                            </button>
                            <button
                                className="admin-btn"
                                onClick={() => setView('roles')}
                            >
                                Gestionar Roles
                            </button>
                            <button
                                className="admin-btn"
                                onClick={() => setView('vistas')}
                            >
                                Gestionar Vistas
                            </button>
                        </div>
                    )}

                    {view === 'users' && <UserManagement onChanges={notifyChanges} />}
                    {view === 'roles' && <RoleManagement onChanges={notifyChanges} />}
                    {view === 'vistas' && <VistasManagement onChanges={notifyChanges} />}
                    {view === 'activity' && <div className="placeholder-view">Próximamente: Actividad de Usuarios</div>}
                </div>
            </div>
        </>
    )
}

export default PanelAdmin  