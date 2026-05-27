import React from "react";

const AveriasHelp: React.FC = () => {
  return (
    <div className="help-section">
      <h2 className="help-title">PÁGINA DE AYUDA</h2>
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
            <td className="colorDispensing">DI</td>
            <td className="colorDispensing">DISPENSING</td>
            <td className="colorVitrina">VI</td>
            <td className="colorVitrina">VITRINA</td>
            <td className="colorVending">VE</td>
            <td className="colorVending">VENDING</td>
            <td className="colorBotellero">BO</td>
            <td className="colorBotellero">BOTELLERO</td>
            <td className="colorDesconocido">?</td>
            <td className="colorDesconocido">DESCONOCIDO</td>
          </tr>
        </tbody>
      </table>

      <hr />

      <h2 className="help-title">CÓDIGO DE COLORES DE AVISOS</h2>

      <h3 className="help-subtitle">VERDE</h3>
      <p>
        Un aviso tendrá el fondo verde cuando queden más de 8 horas para que se
        cumpla el SLA límite.
      </p>
      <table className="help-table">
        <tbody>
          <tr>
            <td className="colorBotellero">BO</td>
            <td className="verde">THE IRISH BAILEY</td>
          </tr>
        </tbody>
      </table>

      <h3 className="help-subtitle">AMARILLO</h3>
      <p>
        Un aviso tendrá el fondo amarillo cuando queden entre 8 y 2 horas para
        que se cumpla el SLA límite.
      </p>
      <table className="help-table">
        <tbody>
          <tr>
            <td className="colorBotellero">BO</td>
            <td className="amarillo">TERRAZA HOUSE</td>
          </tr>
        </tbody>
      </table>

      <h3 className="help-subtitle">ROJO</h3>
      <p>
        Un aviso tendrá el fondo rojo cuando queden entre 2 horas y 30 minutos
        para que se cumpla el SLA límite.
      </p>
      <table className="help-table">
        <tbody>
          <tr>
            <td className="colorDispensing">DI</td>
            <td className="rojo">HOTEL MEDITERRANEAN BAY</td>
          </tr>
        </tbody>
      </table>

      <h3 className="help-subtitle">ROJO PARPADEANTE</h3>
      <p>
        Un aviso rojo empezará a parpadear cuando queden menos de 30 minutos
        para que se cumpla el SLA límite.
      </p>
      <table className="help-table">
        <tbody>
          <tr>
            <td className="colorVitrina">VI</td>
            <td className="rojo parpadea">SUPER ENTERPRISE</td>
          </tr>
        </tbody>
      </table>

      <h3 className="help-subtitle">NEGRO</h3>
      <p>Un aviso tendrá el fondo negro cuando se haya pasado el SLA límite.</p>
      <table className="help-table">
        <tbody>
          <tr>
            <td className="colorVending">VE</td>
            <td className="negro">GRUPOTEL ORIENT</td>
          </tr>
        </tbody>
      </table>

      <h3 className="help-subtitle">MORADO</h3>
      <p>
        Un aviso tendrá el fondo morado cuando esté pausado por un motivo que
        pause realmente el tiempo del SLA.
      </p>
      <table className="help-table">
        <tbody>
          <tr>
            <td className="colorDispensing">DI</td>
            <td className="morado">HOTEL OCCIDENTAL JANDIA MAR</td>
          </tr>
        </tbody>
      </table>

      <h3 className="help-subtitle">MORADO CON DEGRADADO</h3>
      <p>
        Un aviso tendrá el fondo con un degradado entre morado y otro color
        cuando esté pausado por un motivo que no pause realmente el tiempo del
        SLA.
      </p>
      <p>
        El color del degradado dependerá del tiempo que queda para que se
        cumpla el SLA límite, siguiendo el código de colores ya establecido.
      </p>
      <table className="help-table">
        <tbody>
          <tr>
            <td className="colorVitrina">VI</td>
            <td className="moradoverde">FORN LA MALLORQUINA</td>
          </tr>
        </tbody>
      </table>

      <hr />

      <h2 className="help-title">CÓDIGO DE COLORES DE TEXTOS</h2>

      <h3 className="help-subtitle">AMARILLO</h3>
      <p>
        El texto de un aviso será amarillo cuando haga más de 16 horas que se
        ha pasado su SLA límite.
      </p>
      <table className="help-table">
        <tbody>
          <tr>
            <td className="colorVitrina">VI</td>
            <td className="moradoverde" style={{ color: "#ffd400" }}>
              IES MAJADA MARCIAL
            </td>
          </tr>
        </tbody>
      </table>

      <h3 className="help-subtitle">PARPADEANTE</h3>
      <p>
        El texto de un aviso parpadeará en caso de que entre este aviso y la
        última avería de la máquina haya pasado menos de una semana, y por lo
        tanto la avería actual entre dentro de la garantía.
      </p>
      <p>
        Esto también se indicará mediante un marco amarillo alrededor del aviso
        (o negro en caso de que el aviso sea amarillo).
      </p>
      <table className="help-table">
        <tbody>
          <tr className="bordeAmarillo">
            <td className="colorVending">VE</td>
            <td className="morado">
              <span className="parpadea" style={{ color: "#ffd400" }}>
                CARTING CALA MILLOR
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <hr />

      <h2 className="help-title">ALGORITMO DE RECURSOS</h2>
      <p>
        Este algoritmo permite calcular el número de técnicos necesarios para
        completar todos los avisos en el tiempo objetivo.
      </p>
      <img
        src="/img/help/averias/sla_objetivo.jpg"
        alt="SLA objetivo"
        className="help-image"
      />
      <p>1.- Tiempo objetivo: Se introduce mediante un campo de texto.</p>
      <p>2.- Botón de ejecución: Ejecuta el algoritmo.</p>
      <p>3.- Número de técnicos necesarios: Resultado del cálculo.</p>

      <hr />

      <h2 className="help-title">CÓDIGO DE LA TABLA RESUMEN</h2>
      <img
        src="/img/help/averias/tabla_resumen.jpg"
        alt="Tabla resumen"
        className="help-image"
      />
      <p>La tabla muestra un resumen sobre la actividad diaria:</p>
      <p>
        1.- Las averías que se encuentran en ejecución, separadas por familia de
        equipo.
      </p>
      <p>
        2.- Las averías que se encuentran en pausa, separadas por familia de
        equipo.
      </p>
      <p>3.- Avisos generados en el día.</p>
      <p>
        4.- Promedio de avisos generados diariamente en la última semana.
      </p>
      <p>5.- Intervenciones ejecutadas en el día.</p>
      <p>
        6.- Promedio de intervenciones ejecutadas diariamente en la última
        semana.
      </p>

      <hr />

      <h2 className="help-title">CÓDIGO DE LOS MEDIDORES</h2>
      <img
        src="/img/help/averias/medidores.jpg"
        alt="Medidores"
        className="help-image"
      />
      <p>
        Los medidores muestran, de manera visual, el porcentaje de cumplimiento
        del SLA en la semana, el mes y el año.
      </p>
      <p>
        Además, por cada familia de equipo se muestran los tiempos promedio:
      </p>
      <p>1.- Tiempo de SLA.</p>
      <p>2.- Tiempo de ejecución total, sin contar las pausas.</p>

      <hr />

      <h2 className="help-title">CÓDIGO DE LA FUNCIONALIDADES</h2>
      <h3 className="help-subtitle">COPIA AL HACER CLICK</h3>
      <p>
        Al hacer click sobre uno de los avisos, se copiará su código de llamada
        de VEGA en el portapapeles.
      </p>
      <img
        src="/img/help/averias/copia_click.jpg"
        alt="Copia al hacer click"
        className="help-image"
      />
      <div className="help-inline-images">
        <img
          src="/img/help/averias/menu_contexto.jpg"
          alt="Menú contextual"
        />
        <img src="/img/help/averias/flecha.jpg" alt="Flecha" />
        <img
          src="/img/help/averias/campo_pegado.jpg"
          alt="Campo pegado"
        />
      </div>
      <img
        src="/img/help/averias/barra_filtro.jpg"
        alt="Barra de filtros"
        className="help-image"
      />
      <p>
        Esto permite buscar fácilmente el aviso en VEGA, donde sólo tendremos
        que copiar lo que tenemos en el portapapeles para hacer la búsqueda.
      </p>

      <hr />

      <h2 className="help-title">DESPLEGABLE INFORMATIVO</h2>
      <p>
        Al mantener el ratón sobre uno de los avisos, se generará un desplegable
        con información del mismo.
      </p>
      <img
        src="/img/help/averias/desplegable_info.jpg"
        alt="Desplegable informativo"
        className="help-image"
      />
    </div>
  );
};

export default AveriasHelp;
  