import React from 'react';

const AdminHelp: React.FC = () => {
    return (
        <div className="help-section">
            <h3>Panel de Administración</h3>
            <p>Desde este panel puedes gestionar la configuración global del sistema:</p>
            <ul>
                <li><b>Actividad de Usuarios:</b> Monitoriza los accesos y acciones recientes.</li>
                <li><b>Usuarios Registrados:</b> Crea, edita o desactiva cuentas de usuario.</li>
                <li><b>Gestionar Roles:</b> Configura permisos y tiempos de sesión por rol.</li>
                <li><b>Gestionar Vistas:</b> Define qué módulos son visibles para cada perfil.</li>
            </ul>
            <p>Selecciona una opción en el menú de la izquierda para ver detalles específicos.</p>
        </div>
    );
};

export default AdminHelp;
  