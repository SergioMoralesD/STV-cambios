import { useState } from "react";
import {
  DELEGACIONES_ALL,
  MAP_ABREV,
  type TecData,
} from "../../utils/rankingHelpers";

interface FiltroRegionesProps {
  tecnicos: TecData[];
  checkedCodes: Set<string>;
  toggleCheckDelegacion: (delegacion: string) => void;
  toggleCheckTecnico: (codigo: string) => void;
  handleEvaluar: () => void;
  cargando: boolean;
}

export default function FiltroRegiones({
  tecnicos,
  checkedCodes,
  toggleCheckDelegacion,
  toggleCheckTecnico,
  handleEvaluar,
  cargando,
}: FiltroRegionesProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="tabla" id="listaTecnicos">
      <div
        className="dropdown-header"
        onClick={() => {
          if (!cargando) setShowDropdown((prev) => !prev);
        }}
        style={{
          opacity: cargando ? 0.5 : 1,
          cursor: cargando ? "not-allowed" : "pointer",
        }}
      >
        <span id="labelTabla">Mostrar lista de Técnicos</span>
        <span
          id="dropdownIcon"
          style={{ transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ^
        </span>
      </div>

      {showDropdown && (
        <div id="dropdownContent">
          <table id="tablaTecnicosCheck">
            <tbody>
              {DELEGACIONES_ALL.map((del) => {
                const tecsDel = tecnicos.filter((t) => t.delegacion === del);
                if (tecsDel.length === 0) return null;

                return (
                  <tr key={del} className="trIsla">
                    <td className="botonIsla" onClick={() => toggleCheckDelegacion(del)}>
                      <div className="divDelegacionCheck">{MAP_ABREV[del] ?? del}</div>
                    </td>
                    {tecsDel.map((t) => (
                      <td key={t.codigo} className="columnaTecnicoCheck">
                        <input
                          type="checkbox"
                          id={`${t.codigo}_Check`}
                          checked={checkedCodes.has(t.codigo)}
                          onChange={() => toggleCheckTecnico(t.codigo)}
                        />
                        <label htmlFor={`${t.codigo}_Check`}>
                          {t.codigo} - {t.nombre}
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="tabla botones" id="tablaBotonesCheck">
            <button
              id="botonComparar"
              onClick={() => {
                handleEvaluar();
                setShowDropdown(false);
              }}
            >
              Evaluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
  