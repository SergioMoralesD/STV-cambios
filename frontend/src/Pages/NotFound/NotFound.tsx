import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import './notFound.css';

const NotFound = () => {
    const [countdown, setCountdown] = useState(5);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (countdown === 0) {
            // Si hay usuario (token activo), redirigir a hub. Si no, a login (/).
            if (user) {
                navigate('/hub', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
            return;
        }

        const timer = setTimeout(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown, navigate, user]);

    return (
        <div className="notfound-container">
            <div className="notfound-content">
                <h1 className="notfound-title">404👾</h1>
                <p className="notfound-message">¡Ups! La página que buscas no existe o no tienes acceso.</p>
                <div className="notfound-redirect-info">
                    <p>Serás redirigido automáticamete en:</p>
                    <div className="countdown-display">
                        <span className="countdown-number">{countdown}</span>
                        <div className="countdown-progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${(countdown / 5) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                <button
                    className="back-button"
                    onClick={() => user ? navigate('/hub') : navigate('/')}
                >
                    Ir al inicio
                </button>
            </div>
        </div>
    );
};

export default NotFound;
  