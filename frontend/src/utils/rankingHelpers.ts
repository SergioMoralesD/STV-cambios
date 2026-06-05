import { getDuracionTarea } from "../utils/timeUtils";

export const DELEGACIONES_ALL = [
  "6S21",
  "6S21_MENORES",
  "6S23",
  "6S24",
  "6S25",
  "6E21",
  "6E22",
  "6E23",
  "6E41",
];

export const MAP_ABREV: Record<string, string> = {
  "6S21": "TF",
  "6S21_MENORES": "IM",
  "6S23": "GC",
  "6S24": "LZ",
  "6S25": "FV",
  "6E21": "PM",
  "6E22": "IB",
  "6E23": "ME",
  "6E41": "FT",
};

export interface TecData {
  codigo: string;
  nombre: string;
  delegacion: string;
  mostrar: boolean;
}

export interface TareaData {
  COD_TECNICO?: string;
  CODIGO_TECNICO?: string;
  DELEGACION?: string;
  FECHA_INI: string;
  FECHA_FIN?: string | null;
  TAREA?: string;
  TIPO?: string;
  DESCRIPCION?: string;
  ACTIVIDAD?: string;
  ESTADOTAREA?: string;
  AVERIA_ENCONTRADA?: string;
  MIEF_CHIA?: string;
  CLIENTE?: string;
  EQUIPO?: string;
  [key: string]: unknown;
}

export interface JornadaData {
  inicio: Date | null;
  fin: Date | null;
}

function toLowerSafe(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function toStringSafe(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function getCalcularPosicion(minutos: number, inicioMinutos = 6 * 60, finMinutos = 24 * 60): number {
  const posicion = ((minutos - inicioMinutos) / (finMinutos - inicioMinutos)) * 100;
  return Math.max(0, Math.min(100, posicion));
}

/**
 * Mapeo de nombres largos a códigos cortos según la leyenda oficial
 */
const MAP_NOMBRES_A_CODIGOS: Record<string, string> = {
  "AVERIA": "FA",
  "AVERÍA": "FA",
  "INSTALACION": "FI",
  "INSTALACIÓN": "FI",
  "MANTENIMIENTO PREVENTIVO": "FM",
  "ALTA DE TEMPORADA": "FL",
  "TRABAJO EN CLIENTE": "FT",
  "SUSTITUCION": "FC",
  "SUSTITUCIÓN": "FC",
  "SANITIZACION": "FF",
  "SANITIZACIÓN": "FF",
  "BAJA DE TEMPORADA": "FB",
  "RETIRADA": "FR",
  "INTERVENCION SIN LLAMADA": "IN",
  "INTERVENCIÓN SIN LLAMADA": "IN",
  "ACTIVIDAD DIARIA": "STV",
  "STV": "STV"
};

/**
 * Obtiene el código corto para mostrar en la bandera (etiqueta)
 */
export function getEtiquetaTarea(tarea: TareaData): string {
  const t = (tarea.TAREA || "").toUpperCase();
  const desc = (tarea.DESCRIPCION || "").toUpperCase();

  // 1. Buscar en el mapeo por el campo TAREA
  if (MAP_NOMBRES_A_CODIGOS[t]) return MAP_NOMBRES_A_CODIGOS[t];

  // 2. Buscar en el mapeo por el campo DESCRIPCION
  if (MAP_NOMBRES_A_CODIGOS[desc]) return MAP_NOMBRES_A_CODIGOS[desc];

  // 3. Casos especiales manuales
  if (desc.includes("DESPLAZAMIENTO")) return "STV";
  if (desc.includes("REUNION") || desc.includes("REUNIÓN")) return "STV";
  if (desc.includes("PAUSA") || desc.includes("COMER")) return "STV";

  // 4. Si el código ya es corto (2-3 letras), lo dejamos
  if (t && t.length <= 3) return t;

  // 5. Default
  return "STV";
}

export function getColorTipoTarea(tarea: TareaData): string {
  const estado = toLowerSafe(tarea.ESTADOTAREA);
  if (estado.includes("cancel")) return "cancelado";

  const t = (tarea.TAREA || "").toUpperCase();
  const desc = toLowerSafe(tarea.DESCRIPCION);

  // 1. PRIORIDAD: Descripciones especiales (Colores específicos)
  if (desc.includes("pausa") || desc.includes("comer") || desc.includes("almuerzo")) return "pausaComer"; // Rojo
  if (desc.includes("reunion") || desc.includes("reunión")) return "reunion"; // Naranja
  if (desc.includes("desplazamiento")) return "desplazamiento"; // Amarillo
  if (desc.includes("entregas") || desc.includes("retiradas") || desc.includes("evento")) return "trabajoEventos"; // Rosa

  // 2. Clasificación por código (Traducido si es necesario)
  const codigo = getEtiquetaTarea(tarea);

  if (codigo === "STV") return "actividadDiaria"; // Azul (Productiva Neta)

  // Lista de códigos que se consideran "Productiva Bruta" (Verde)
  const codigosProductivos = ["FA", "HA", "FI", "FM", "FL", "FT", "HT", "FC", "FF", "FB", "FR", "IN"];
  if (codigosProductivos.includes(codigo)) return "actividadProductiva"; // Verde

  if (desc) return "actividadDiaria"; // Azul por defecto si hay descripción
  return "actNoEsperada"; // Gris
}

export function getColorPorDuracion(duracion: number, tipo: string): string | null {
  let min = 0;
  let max = 0;
  const t = Math.round(duracion);
  if (t === 0) return null;

  // Normalizar el tipo usando el mapeo
  const tipoCod = MAP_NOMBRES_A_CODIGOS[tipo.toUpperCase()] || tipo.toUpperCase();

  switch (tipoCod) {
    case "FA":
    case "HA":
      min = 20;
      max = 45;
      break;
    case "FT":
    case "HT":
      min = 15;
      max = 30;
      break;
    case "FB":
      min = 60;
      max = 120;
      break;
    case "FL":
      min = 120;
      max = 180;
      break;
    case "FF":
    case "ZFF":
      min = 150;
      max = 210;
      break;
    case "FM":
    case "ZFM":
      min = 90;
      max = 150;
      break;
    default:
      break;
  }

  if (min > 0 && max > 0 && (t < min || t > max)) return "noPlazo"; // Blanco
  return null;
}

export function getTipoIntervencion(tipo: string): string {
  const t = tipo.toUpperCase();
  // Si ya es un nombre largo, devolverlo
  if (t.length > 3) return tipo;

  switch (t) {
    case "FF":
      return "Sanitizacion";
    case "FM":
      return "Mantenimiento";
    case "FA":
    case "HA":
      return "Averia";
    case "FT":
    case "HT":
      return "Trabajo en cliente";
    case "FL":
      return "Alta de temporada";
    case "FB":
      return "Baja de temporada";
    case "FR":
      return "Retirada";
    case "FI":
      return "Instalacion";
    case "FC":
      return "Sustitucion";
    case "FD":
    case "HD":
      return "Redisposicion";
    case "IN":
      return "Intervencion sin llamada";
    default:
      return tipo;
  }
}

export function construirHover(tarea: TareaData): string {
  const titulo = getTipoIntervencion(toStringSafe(tarea.TAREA)) || toStringSafe(tarea.DESCRIPCION);
  const aviso = tarea.MIEF_CHIA ? `<br>- Cod. llamada: ${tarea.MIEF_CHIA}` : "";

  let descTarea = "<br>";
  if (tarea.ACTIVIDAD && tarea.TAREA) {
    descTarea += `- Actividad realizada: ${tarea.TAREA} - ${tarea.ACTIVIDAD}`;
  } else if (tarea.TAREA) {
    const desc =
      tarea.TAREA === "FI" && tarea.TIPO === "T"
        ? "Preparar equipo"
        : toStringSafe(tarea.DESCRIPCION);
    descTarea += `- Actividad declarada: ${tarea.TAREA} - ${desc}`;
  } else {
    descTarea = "";
  }

  let averiaEstado = "";
  if (tarea.AVERIA_ENCONTRADA) averiaEstado = `<br>- Averia encontrada: ${tarea.AVERIA_ENCONTRADA}`;
  if (tarea.ESTADOTAREA) averiaEstado += `<br>- Estado: ${tarea.ESTADOTAREA}`;

  const fechaIni = new Date(tarea.FECHA_INI);
  const pad = (n: number) => String(n).padStart(2, "0");
  const horaIni = Number.isNaN(fechaIni.getTime())
    ? "--:--"
    : `${pad(fechaIni.getHours())}:${pad(fechaIni.getMinutes())}`;

  const fechaFin = tarea.FECHA_FIN ? new Date(tarea.FECHA_FIN) : null;
  const horaFin =
    fechaFin && !Number.isNaN(fechaFin.getTime())
      ? `${pad(fechaFin.getHours())}:${pad(fechaFin.getMinutes())}`
      : "En ejecucion";

  const duracion = Math.round(
    getDuracionTarea(tarea.FECHA_INI, tarea.FECHA_FIN, toStringSafe(tarea.DELEGACION)),
  );

  let clienteEquipo = "";
  const cliente = toStringSafe(tarea.CLIENTE);
  if (cliente) {
    const clienteNombre = cliente.includes("-") ? cliente.split("-")[1].trim() : cliente;
    clienteEquipo = `<br>- Cliente: ${clienteNombre}`;
  }
  if (tarea.EQUIPO) clienteEquipo += `<br>- Equipo: ${tarea.EQUIPO}<br>`;

  return `${titulo.toUpperCase()} ${aviso}${descTarea}${averiaEstado}${clienteEquipo}<br>- Horario: ${horaIni} ~ ${horaFin}<br>- Duracion: ${duracion} minutos`;
}  