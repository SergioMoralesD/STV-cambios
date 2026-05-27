import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

export interface TechState {
    codigo: string;
    nombre: string;
    color: string;
    checked: boolean;
}

interface STVTrackerLegendProps {
    techStates: TechState[];
    setTechStates: Dispatch<SetStateAction<TechState[]>>;
}

export default function STVTrackerLegend({
    techStates,
    setTechStates,
}: STVTrackerLegendProps) {
    const [legendOpen, setLegendOpen] = useState(true);

    const handleCheck = useCallback((codigo: string, checked: boolean) => {
        setTechStates((prev) =>
            prev.map((ts) => (ts.codigo === codigo ? { ...ts, checked } : ts)),
        );
    }, [setTechStates]);

    const handleMarkAll = useCallback((check: boolean) => {
        setTechStates((prev) =>
            prev.map((ts) => ({ ...ts, checked: check })),
        );
    }, [setTechStates]);

    return (
        <div className="stv-legend">
            <div
                className="stv-legend-header"
                onClick={() => setLegendOpen((open) => !open)}
            >
                <span>
                    {legendOpen ? "\u25BC" : "\u25B2"}{" "}
                    {legendOpen ? "Ocultar t\u00E9cnicos" : "Mostrar t\u00E9cnicos"}
                </span>
            </div>

            {legendOpen && (
                <div className="stv-legend-body">
                    <div className="stv-legend-buttons">
                        <button
                            className="stv-btn-mark"
                            onClick={() => handleMarkAll(true)}
                        >
                            Marcar
                        </button>
                        <button
                            className="stv-btn-unmark"
                            onClick={() => handleMarkAll(false)}
                        >
                            Desmarcar
                        </button>
                    </div>

                    {techStates.map((ts) => (
                        <label
                            key={ts.codigo}
                            className="stv-legend-row"
                        >
                            <input
                                type="checkbox"
                                checked={ts.checked}
                                onChange={(event) =>
                                    handleCheck(ts.codigo, event.target.checked)
                                }
                            />
                            <span className="stv-legend-name">
                                {ts.nombre}
                            </span>
                            <span
                                className="stv-legend-color"
                                style={{ backgroundColor: ts.color }}
                            />
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
  