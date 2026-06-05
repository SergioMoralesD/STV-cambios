import { useState } from 'react'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'; // Librería de iconos recomendada
import PanelAdmin from '../PanelAdmin/PanelAdmin'
import { useAuth } from '../../Context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'
import './header.css'

type Props = {
    texto?: string;
    logo?: string;
    verDetalles: boolean;
    onToggle: () => void;
}

import { usePermissions } from '../../Hooks/usePermissions'

const Cabecera = (props: Props) => {
    const { user, logout } = useAuth();
    const { verDetalles, onToggle } = props;
    const location = useLocation();
    const navigate = useNavigate();

    const { isTecnico } = usePermissions();

    const showAdminPanel = user && user.rol_nombre === 'Admin' && location.pathname === '/hub';

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleLogoClick = () => {
        if (isTecnico) {
            navigate('/cordinacion');
        } else {
            navigate('/hub');
        }
    };

    return (
        <header className={`header-main ${!verDetalles ? 'header-oculto' : ''}`}>
            <div className="header-left-section">
                <a 
                    href={isTecnico ? '/cordinacion' : '/hub'}
                    className="logo-container" 
                    onClick={(e) => {
                        e.preventDefault();
                        handleLogoClick();
                    }}
                    style={{ cursor: 'pointer', display: 'block' }}
                >
                    <img alt="~LOGO STV~" src={props.logo || "/img/menu-logo.png"} />
                </a>
            </div>

            <div className="texto-container">
                {/* 2. El título cambia de color según el estado del ojo */}
                <h1 className={verDetalles ? "titulo-activo" : "titulo-normal"}>
                    {props.texto}
                </h1>
            </div>

            <div className="acciones-container">
                {/* 3. BOTÓN CON EL OJO */}
                <button
                    onClick={onToggle}
                    className={`boton-ojo ${verDetalles ? 'activo' : ''}`}
                >
                    {verDetalles ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>

                {user && (
                    <div className="logout-container">
                        <button onClick={handleLogout} className="logout-button">
                            Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>

            {showAdminPanel && <PanelAdmin />}
        </header>
    )
}

export default Cabecera;  