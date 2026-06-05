import React from 'react';

const HubHelp: React.FC = () => {
    return (
        <div className="help-section">
            <h3>Panel de Control (Hub)</h3>
            <p>Bienvenido al centro de operaciones. Desde aquí puedes:</p>
            <ul>
                <li>Acceder a los módulos de <b>Coordinación</b> y <b>B2B</b>.</li>
                <li>Gestionar la configuración del sistema si eres administrador.</li>
                <li>Seleccionar la región y delegaciones de trabajo en el menú superior.</li>
            </ul>
        </div>
    );
};

export default HubHelp;
  