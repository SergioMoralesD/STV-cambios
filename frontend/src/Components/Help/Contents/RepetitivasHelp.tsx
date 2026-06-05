import React from 'react';

const RepetitivasHelp: React.FC = () => {
    return (
        <div className="help-section">
            <h3>Averías Repetitivas</h3>
            <p>Este módulo identifica máquinas con fallos recurrentes:</p>
            <ul>
                <li><b>Análisis de Repetición:</b> Algoritmo que detecta patrones de fallo en las mismas máquinas.</li>
                <li><b>Filtrado por Delegación:</b> Visualiza los datos según tu selección actual.</li>
                <li><b>Estado de Máquinas:</b> Información detallada sobre el historial reciente de avisos.</li>
            </ul>
        </div>
    );
};

export default RepetitivasHelp;
  