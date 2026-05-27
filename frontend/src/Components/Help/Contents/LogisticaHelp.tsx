import React from "react";

const LogisticaHelp: React.FC = () => {
  return (
    <div className="help-section">
      <h2 className="help-title">AYUDA LOGÍSTICA</h2>
      <div className="help-center">
        <img
          src="/img/logo.png"
          alt="STV Servicio Técnico"
          className="help-logo-inline"
        />
      </div>

      <hr />

      <h2 className="help-title">CÓDIGOS DE FAMILIA</h2>
      <table className="help-table">
        <tbody>
          <tr>
            <td style={{ backgroundColor: "#828282", color: "white" }}>DI</td>
            <td>DISPENSING / POST-MIX</td>
            <td style={{ backgroundColor: "#c4732c", color: "white" }}>VI</td>
            <td>VITRINA / COOLER</td>
          </tr>
          <tr>
            <td style={{ backgroundColor: "#6e4d19", color: "white" }}>VE</td>
            <td>VENDING</td>
            <td style={{ backgroundColor: "#0079a9", color: "white" }}>BO</td>
            <td>BOTELLERO</td>
          </tr>
        </tbody>
      </table>

      <hr />

      <h2 className="help-title">INDICADORES DE ISLAS</h2>
      <p>
        En las tablas superiores se muestran las máquinas pendientes por cada isla/planta.
      </p>
      
      <h3 className="help-subtitle">Diferencia de Días (SLA)</h3>
      <p>Indica la urgencia del aviso basada en la fecha de planificación:</p>
      <table className="help-table">
        <tbody>
          <tr>
            <td className="rojo">1 - 4 días</td>
            <td>Urgente (Rojo)</td>
          </tr>
          <tr>
            <td className="amarillo">5 - 7 días</td>
            <td>Atención Necesaria (Amarillo)</td>
          </tr>
          <tr>
            <td className="verde">8+ días</td>
            <td>Dentro de tiempo (Verde)</td>
          </tr>
        </tbody>
      </table>

      <hr />

      <h2 className="help-title">TABLA RESUMEN</h2>
      <p>Muestra el desempeño histórico (Año/Mes) y el estado actual de los avisos.</p>
      
      <h3 className="help-subtitle">Tiempos Promedio (Año/Mes)</h3>
      <p>Expresados en "Xd Yh" (Días y Horas). El color varía según la duración total:</p>
      <ul>
        <li>Verde: Menos de 12 horas.</li>
        <li>Amarillo/Naranja: Entre 1 y 4 días.</li>
        <li>Rojo: Más de 4 días.</li>
      </ul>

      <h3 className="help-subtitle">Tipos de Recuentos</h3>
      <table className="help-table">
        <thead>
          <tr>
            <th>Grupo</th>
            <th>Códigos Incluidos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>FI / HI</b></td>
            <td>Instalaciones, Higienizaciones</td>
          </tr>
          <tr>
            <td><b>FC / HC</b></td>
            <td>Cambios, Retiradas Temporales</td>
          </tr>
          <tr>
            <td><b>FR / HR</b></td>
            <td>Retiradas Definitivas</td>
          </tr>
        </tbody>
      </table>

      <h3 className="help-subtitle">Estados</h3>
      <ul>
        <li><b>Total:</b> Suma de todas las máquinas del tipo en la delegación.</li>
        <li><b>Activo:</b> En curso o por iniciar (Estado &lt; 20).</li>
        <li><b>Pausa:</b> Retenido o pendiente (Estado entre 20 y 89).</li>
      </ul>
    </div>
  );
};

export default LogisticaHelp;
  