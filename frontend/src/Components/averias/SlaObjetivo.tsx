// src/webs/Averias/SlaObjetivo.tsx
// Equivalente a slaObjetivo.js

import { useState } from "react";
import { fetchTecnicosNecesarios, setSlaObjetivoAPI } from "../../services/averiaService";
import { mostrarNotificacion } from "./datosAviso";

interface SlaObjetivoProps {
    mainplant: string;
    numTecnicos: number | "Error";
    slaActual: number;
    onUpdate: (numTec: number | "Error", sla: number) => void;
}

export default function SlaObjetivo({
    mainplant,
    numTecnicos,
    slaActual,
    onUpdate,
}: SlaObjetivoProps) {
    const [inputValue, setInputValue] = useState("");

    async function handleSubmit() {
        const sla = inputValue.trim();
        if (!/^-?\d+(\.\d+)?$/.test(sla)) {
            mostrarNotificacion(
                "Por favor, introduce un número válido para el SLA objetivo.",
            );
            return;
        }

        const slaNumero = parseFloat(sla);
        try {
            const data = await setSlaObjetivoAPI(mainplant, slaNumero);
            if (data["nuevo_sla_objetivo"]) {
                const tecNecesarios = await fetchTecnicosNecesarios(
                    mainplant,
                    slaNumero,
                );
                onUpdate(tecNecesarios, slaNumero);
                setInputValue("");
            } else {
                mostrarNotificacion(
                    "No se pudo hallar el número de técnicos necesarios",
                );
            }
        } catch {
            mostrarNotificacion(
                "No se pudo hallar el número de técnicos necesarios",
            );
        }
    }

    return (
        <div id="numeroTecnicosNecesarios" className="sla-widget-original">
            <div className="sla-header-group">
                <div id="titulo" className="sla-title-original">SLA Objetivo (horas):</div>
                <div id="form" className="sla-form-original">
                    <input
                        id="texto"
                        className="sla-input-original"
                        type="text"
                        name="texto"
                        placeholder={String(slaActual)}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    />
                    <button id="Submit" className="sla-btn-original" type="button" onClick={handleSubmit}>
                        <img
                            src="/img/chevron-right.svg"
                            alt=">"
                        />
                    </button>
                </div>
            </div>

            <div id="SLA_Obj" className="sla-result-original">
                <img
                    className="logoTecnico-original"
                    src="/img/tecnico.jpg"
                    alt="técnico"
                />
                <div id="tecnicos" className="sla-number-original">
                    {typeof numTecnicos === "object" ? "..." : numTecnicos}
                </div>
            </div>
        </div>
    );
}  