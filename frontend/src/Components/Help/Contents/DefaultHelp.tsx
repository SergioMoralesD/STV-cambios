import React from 'react';

const DefaultHelp: React.FC<{ path: string }> = ({ path }) => {
    return (
        <div className="help-section">
            <h3>Centro de Ayuda</h3>
            <p>Estás en la sección: <b>{path}</b></p>
            <p>Aquí encontrarás información general del portal.</p>
            <p>Si necesitas asistencia específica, navega a una de las secciones principales del menú.</p>
        </div>
    );
};

export default DefaultHelp;
  