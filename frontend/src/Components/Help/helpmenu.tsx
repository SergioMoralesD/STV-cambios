import React from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import './helpmenu.css';

import AveriasHelp from './Contents/AveriasHelp';
import RepetitivasHelp from './Contents/RepetitivasHelp';
// import HubHelp from './Contents/HubHelp';
import AdminHelp from './Contents/AdminHelp';
import DefaultHelp from './Contents/DefaultHelp';
import LogisticaHelp from './Contents/LogisticaHelp';
import TrabajoClienteHelp from './Contents/TrabajoClienteHelp';

// --- BOTÓN DE AYUDA ---
interface HelpButtonProps {
    onClick: () => void;
    className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ onClick, className = '' }) => {
    const { user } = useAuth();
    const location = useLocation();

    // 1. Detectamos si estamos en el Panel de Administrador (URL /hub o /PanelAdmin)
    const esGestionAdmin = location.pathname.includes('PanelAdmin') || location.pathname.includes('hub');

    if (esGestionAdmin && user?.rol_nombre !== 'Administrador' && user?.rol_nombre !== 'Admin') {
        return null;
    }

    return (
        <div
            className={`help-button-fixed ${className}`}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
            <div id="ayuda">?</div>
        </div>
    );
};

// --- MENÚ DE AYUDA ---
interface HelpMenuProps {
    isOpen: boolean;
    onClose: () => void;
    subView?: string;
}

export const HelpMenu: React.FC<HelpMenuProps> = ({ isOpen, onClose, subView }) => {
    const location = useLocation();
    const { user } = useAuth();

    if (!isOpen) return null;

    const getHelpContent = () => {
        const path = location.pathname;

        // Mapeo de vistas a componentes
        if (subView === 'averiasrepetitivas' || path.includes('averiasrepetitivas')) {
            return <RepetitivasHelp />;
        }
        if (subView === 'averias' || path.includes('averias')) {
            return <AveriasHelp />;
        }
        if (subView === 'logistica' || path.includes('logistica')) {
            return <LogisticaHelp />;
        }
        if (subView === 'trabajocliente' || path.includes('trabajocliente')) {
            return <TrabajoClienteHelp />;
        }

        // Ayuda contextual para el Panel Admin
        if (path.includes('hub') || path.includes('PanelAdmin')) {
            if (!subView || subView === 'menu') return <AdminHelp />;

            switch (subView) {
                case 'users':
                    return <><h3>Gestión de Usuarios</h3><p>Desde aquí puedes registrar nuevos usuarios, editar sus datos o activar/desactivar sus cuentas.</p></>;
                case 'roles':
                    return <><h3>Gestión de Roles</h3><p>Configura los roles del sistema, sus descripciones y el tiempo de caducidad de sus tokens de sesión. También puedes asignar permisos específicos por región y vista.</p></>;
                case 'vistas':
                    return <><h3>Gestión de Vistas</h3><p>Controla qué módulos y secciones son visibles para cada perfil de usuario en el sistema.</p></>;
                case 'activity':
                    return <><h3>Actividad de Usuarios</h3><p>Próximamente: Historial de acciones y registros de actividad del sistema.</p></>;
                case 'sessions':
                    return <><h3>Sesiones Activas</h3><p>Visualiza y gestiona las sesiones concurrentes de los usuarios.</p></>;
                default:
                    return <AdminHelp />;
            }
        }

        return <DefaultHelp path={path} />;
    };

    // Usamos Portal para evitar que el menú se corte por el diseño del PanelAdmin
    return ReactDOM.createPortal(
        <div className="help-overlay" onClick={onClose}>
            <div className="help-sidebar" onClick={(e) => e.stopPropagation()}>
                <div className="help-header">
                    <h2>Centro de Ayuda</h2>
                    <img src="/img/logo.png" alt="logo" className='logo-help' />
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="help-content">
                    {getHelpContent()}
                </div>
                <div className="help-footer">
                    <small>Usuario: {user?.usuario || 'Invitado'}</small>
                </div>
            </div>
        </div>,
        document.body
    );
};  