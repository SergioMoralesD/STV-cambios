// src/webs/Averias/TablaResumen.tsx
// Equivalente a resume.js

import type { ResumenList, ResumenGenExec } from "../../services/Types";

interface FilaResumenProps {
    familia: string;
    ejecucion: number | string;
    pausa: number | string;
    generadas?: ResumenGenExec;
    ejecutadas?: ResumenGenExec;
}

function FilaResumen({ familia, ejecucion, pausa, generadas, ejecutadas }: FilaResumenProps) {
    return (
        <tr>
            <td id="texttable" className="principal">{familia}</td>
            <td id="texttable" className="verdito">{ejecucion}</td>
            <td id="texttable" className="moradito">{pausa}</td>
            {generadas && (
                <td id="texttable" className="principal" rowSpan={5}>
                    <div>{Number(generadas.DIA).toFixed(0)}</div>
                    <div className="media">({Number(generadas.ENTRE_SEMANA).toFixed(2)})</div>
                </td>
            )}
            {ejecutadas && (
                <td id="texttable" className="blanco" rowSpan={5}>
                    <div>{Number(ejecutadas.DIA).toFixed(0)}</div>
                    <div className="media">({Number(ejecutadas.ENTRE_SEMANA).toFixed(2)})</div>
                </td>
            )}
        </tr>
    );
}

interface TablaResumenProps {
    list: ResumenList;
    generated: ResumenGenExec;
    executed: ResumenGenExec;
}

export default function TablaResumen({ list, generated, executed }: TablaResumenProps) {
    // Cálculos de totales y porcentajes (Logic from resume.js)
    const totalEjec =
        list.dispensing_ejec +
        list.vitrina_ejec +
        list.vending_ejec +
        list.botellero_ejec +
        list.sin_familia_ejec;

    const totalPausa =
        list.dispensing_pausa +
        list.vitrina_pausa +
        list.vending_pausa +
        list.botellero_pausa +
        list.sin_familia_pausa;

    const generadasHoy = Number(generated.DIA);
    const promedioGeneradas = Number(generated.ENTRE_SEMANA);
    const ejecutadasHoy = Number(executed.DIA);

    const faltanPorGenerarse = Math.max(0, Math.round(promedioGeneradas - generadasHoy));
    const totalAveriasHoy = totalEjec + totalPausa + faltanPorGenerarse + ejecutadasHoy;

    const pct = totalAveriasHoy > 0 ? (ejecutadasHoy / totalAveriasHoy) * 100 : 0;
    const pctClamped = Math.min(100, Math.max(0, pct));

    const getColors = (p: number) => {
        if (p > 90) return { bar: "#1ba100", text: "white" };
        if (p > 80) return { bar: "#ffcc00", text: "black" };
        if (p > 50) return { bar: "#cc0000", text: "white" };
        return { bar: "black", text: "#ffcc00" };
    };

    const { bar, text } = getColors(pctClamped);
    const barWidth = pctClamped < 1 ? "2px" : `${pctClamped.toFixed(0)}%`;

    return (
        <div id="tablaResumen" className="resumen-container-original">
            <table className="table-original" id="resume">
                <thead>
                    <tr>
                        <th className="th-empty"></th>
                        <th className="th-ejecucion" id="texttable">EN EJECUCIÓN</th>
                        <th className="th-pausa" id="texttable">EN PAUSA</th>
                        <th className="th-generadas" id="texttable">GENERADAS</th>
                        <th className="th-ejecutadas" id="texttable">EJECUTADAS</th>
                    </tr>
                </thead>
                <tbody>
                    <FilaResumen
                        familia="Dispensing"
                        ejecucion={list.dispensing_ejec}
                        pausa={list.dispensing_pausa}
                        generadas={generated}
                        ejecutadas={executed}
                    />
                    <FilaResumen familia="Vitrinas" ejecucion={list.vitrina_ejec} pausa={list.vitrina_pausa} />
                    <FilaResumen familia="Vending" ejecucion={list.vending_ejec} pausa={list.vending_pausa} />
                    <FilaResumen familia="Botellero" ejecucion={list.botellero_ejec} pausa={list.botellero_pausa} />
                    <FilaResumen familia="?" ejecucion={list.sin_familia_ejec} pausa={list.sin_familia_pausa} />
                    
                    {/* Fila de Totales */}
                    <tr>
                        <td className="th-empty"></td>
                        <td className="tdTotales verdito">{totalEjec}</td>
                        <td className="tdTotales moradito">{totalPausa}</td>
                        <td className="tdTotales principal">{faltanPorGenerarse}</td>
                        <td className="tdTotales tdPorcentajeEjecutado">
                            <div className="divPorcentajeEjecutado" style={{ color: text }}>
                                <div 
                                    className="barraPorcentajeEjecutado" 
                                    style={{ width: barWidth, background: bar }}
                                />
                                <div className="divTextoPorcentajeEjecutado">
                                    <span className="totalAveriasHoy">{totalAveriasHoy} - </span>
                                    <span className="porcentajeEjecutado">({pctClamped.toFixed(0)}%)</span>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}  