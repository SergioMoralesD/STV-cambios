import React from 'react';

const TrabajoClienteHelp: React.FC = () => {
    return (
        <div className="help-section">
            <h3>Trabajo en Cliente</h3>
            <p>
                Este panel muestra los informes de trabajos realizados directamente en las instalaciones del cliente (Reporte 60).
            </p>
            
            <h4>Estructura del Panel</h4>
            <ul>
                <li><strong>Islas/Delegaciones:</strong> Los datos se agrupan por islas o delegaciones configuradas para la región seleccionada.</li>
                <li><strong>Conteo:</strong> Junto al nombre de la isla se muestra el número total de servicios activos.</li>
                <li><strong>Tarjetas de Servicio:</strong> Cada tarjeta representa un trabajo específico, mostrando detalles como el código, la prioridad y el cliente.</li>
            </ul>

            <h4>Leyenda de Familias</h4>
            <p>
                Los servicios están categorizados por colores según la familia de la máquina:
            </p>
            <ul className="family-legend-help">
                <li><span className="dot botellero">B</span> <strong>Botellero:</strong> Equipos de refrigeración estándar.</li>
                <li><span className="dot vitrina">V</span> <strong>Vitrina:</strong> Expositores refrigerados.</li>
                <li><span className="dot vending">VE</span> <strong>Vending:</strong> Máquinas de venta automática.</li>
                <li><span className="dot dispensing">D</span> <strong>Dispensing:</strong> Equipos de dispensado de bebidas.</li>
            </ul>

            <h4>Actualización de Datos</h4>
            <p>
                El panel se actualiza automáticamente cada minuto para mostrar la información más reciente del sistema.
            </p>
        </div>
    );
};

export default TrabajoClienteHelp;
  