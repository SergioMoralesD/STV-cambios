// src/webs/Averias/datosAviso.ts
// Equivalente a datosAviso.js

import type { Averia } from "../../services/Types";
import { parseIntervencionesCompletas, parseAveriaAnteriorCompleta } from "./textParse";
import { formatearFechaVisual } from "../../config/regionConfig";

// ─── Hover ─────────────────────────────────────────────────────────────────

export function construirHover(averia: Averia): string {
    const intervenciones = parseIntervencionesCompletas(averia.intervenciones_text);
    const averiaAnterior = parseAveriaAnteriorCompleta(averia.averiaanterior_text);

    const msjPhonefix =
        "NOTAS PHONEFIX: " +
        (!averia.notas_phonefix || averia.notas_phonefix.toString().trim().length < 1
            ? ""
            : "\n· " + averia.notas_phonefix);

    let msjIntervenciones = "\n\nINTERVENCIONES AVERÍA ACTUAL:";
    if (Array.isArray(intervenciones) && intervenciones.length > 0) {
        intervenciones.forEach((intervencion) => {
            msjIntervenciones += `\n· (${formatearFechaVisual(intervencion.fecha ?? "")}) ${intervencion.notas ? "- " + intervencion.notas : ""}`;
            const operaciones = intervencion.operaciones || [];
            if (operaciones.length > 0) {
                operaciones.forEach((op) => { msjIntervenciones += `\n  * ${op.desc}`; });
            } else {
                msjIntervenciones += "\n  * Sin operaciones";
            }
            const actividades = intervencion.actividades || [];
            if (actividades.length > 0) {
                actividades.forEach((act) => {
                    msjIntervenciones += `\n   - ${act.desc}${act.nota ? " (" + act.nota + ")" : ""}`;
                });
            } else {
                msjIntervenciones += "\n   - Sin actividades";
            }
        });
    } else {
        msjIntervenciones = "";
    }

    let msjAveriaAnterior = "\n\nAVERÍA ANTERIOR:";
    if (averiaAnterior) {
        msjAveriaAnterior += `\n· (${formatearFechaVisual(averiaAnterior.fecha ?? "")})${" - " + (averiaAnterior.descripcion || "")}`;
        const actividades = averiaAnterior.actividades || [];
        actividades.forEach((act) => {
            msjAveriaAnterior += `\n  - ${act.desc}${act.nota ? " (" + act.nota + ")" : ""}`;
        });
    } else {
        msjAveriaAnterior = "";
    }

    return `AVISO:
· ${averia.aviso} (${formatearFechaVisual(averia.fecha_aviso)})
· Lleva abierta desde hace ${tiempoDesdeFecha(averia.tiempo_total)}
· ${averia.nombre_estado}
  
CONTACTO CLIENTE:
· ${averia.direccion} (${averia.cod_post} - ${averia.cli_cit})
· ${averia.tfn_cliente} - ${averia.nombre_contacto}

AVERÍA DECLARADA:
· ${averia.cod_indicado}

${msjPhonefix}${msjIntervenciones}${msjAveriaAnterior}`;
}

// ─── Tiempo transcurrido ───────────────────────────────────────────────────

export function tiempoDesdeFecha(fechaStr: string): string {
    if (!fechaStr) return "sin tiempo.";
    const fechaInicio = new Date(fechaStr);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fechaInicio.getTime();
    if (diffMs < 0) return "0 minutos.";

    const totalMinutos = Math.floor(diffMs / (1000 * 60));
    const dias = Math.floor(totalMinutos / (24 * 60));
    const horas = Math.floor((totalMinutos % (24 * 60)) / 60);
    const minutos = totalMinutos % 60;

    if (dias > 0) return `${dias} días, ${horas} horas y ${minutos} minutos.`;
    if (horas > 0) return `${horas} horas y ${minutos} minutos.`;
    return `${minutos} minutos.`;
}

// ─── Clipboard ─────────────────────────────────────────────────────────────

export async function copyToClipboard(textToCopy: string): Promise<void> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(textToCopy);
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = textToCopy;
            textArea.style.position = "absolute";
            textArea.style.left = "-999999px";
            document.body.prepend(textArea);
            textArea.select();
            try { document.execCommand("copy"); } catch (e) { console.error(e); }
            finally { textArea.remove(); }
        }
        mostrarNotificacion(textToCopy + " copiado al portapapeles");
    } catch (err) {
        console.error("Error al copiar: ", err);
        mostrarNotificacion("No se ha podido copiar al portapapeles");
    }
}

// ─── Notificación ─────────────────────────────────────────────────────────

export function mostrarNotificacion(texto: string,): void {
    const existente = document.querySelector(".notificacion");
    if (existente) existente.remove();

    const notif = document.createElement("div");
    notif.classList.add("notificacion", "mostrar");
    notif.textContent = texto;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.classList.remove("mostrar");
        setTimeout(() => notif.remove(), 300);
    }, 2500);
}  