// src/components/MedidoresCocacola/MedidoresCocacola.tsx
import { useEffect, useRef, useState } from "react";
import type { AllMetricas, MetricaData } from "../../services/Types";
import cocacolaImg from "/img/cocacola.png";
import "./MedidoresCocacola.css";

// canvas-gauges se carga globalmente vía CDN (como en el PHP original)
declare const RadialGauge: any;

// ─── Colores por porcentaje ────────────────────────────────────────────────

function getColorPorcentaje(valor: number): { backgroundColor: string; color: string } {
    if (isNaN(valor)) {
        return { backgroundColor: "black", color: "#ffcc00" };
    }

    if (valor >= 96) return { backgroundColor: "#1ba100", color: "white" };
    if (valor >= 90) return { backgroundColor: "#ffcc00", color: "black" };
    if (valor >= 80) return { backgroundColor: "#cc0000", color: "white" };

    return { backgroundColor: "black", color: "#ffcc00" };
}

// ─── Reloj individual ─────────────────────────────────────────────────────

interface GaugeProps {
    id: string;
    value: number;
    isSLA?: boolean;
}

function Gauge({ id, value, isSLA = false }: GaugeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [sizePx, setSizePx] = useState(200);

    useEffect(() => {
        const recalculateSize = () => {
            const wrapperWidth = wrapperRef.current?.clientWidth ?? 0;
            if (wrapperWidth <= 0) return;

            // Escalar relojes según resolución de pantalla
            const is4K = window.innerWidth >= 2000;
            const maxSize = is4K ? 500 : 200;
            const minSize = is4K ? 350 : 130;
            const nextSize = Math.round(Math.min(maxSize, Math.max(minSize, wrapperWidth - 24)));
            setSizePx((prev) => (Math.abs(prev - nextSize) > 1 ? nextSize : prev));
        };

        recalculateSize();
        const timer = setTimeout(recalculateSize, 400);

        let observer: ResizeObserver | null = null;
        if (typeof ResizeObserver !== "undefined" && wrapperRef.current) {
            observer = new ResizeObserver(recalculateSize);
            observer.observe(wrapperRef.current);
        } else {
            window.addEventListener("resize", recalculateSize);
        }

        return () => {
            clearTimeout(timer);
            if (observer) observer.disconnect();
            window.removeEventListener("resize", recalculateSize);
        };
    }, []);

    useEffect(() => {
        let gauge: any = null;
        let timer: any = null;

        const initGauge = () => {
            if (!canvasRef.current || typeof (window as any).RadialGauge === "undefined") {
                timer = setTimeout(initGauge, 100);
                return;
            }

            const safeValue = isNaN(value) ? 0 : value;
            // Usar siempre la escala de colores y estilo premium
            gauge = new (window as any).RadialGauge({
                renderTo: id,
                width: sizePx,
                height: sizePx,
                minValue: 70, // Mantener 70 como base para estética compacta
                maxValue: 100,
                startAngle: 90,
                ticksAngle: 180,
                valueBox: false,
                majorTicks: ["70", "75", "80", "85", "90", "95", "100"],
                fontNumbersSize: 25,
                value: Math.max(70, safeValue), // Forzar aguja al mínimo si el valor es menor
                minorTicks: 5,
                strokeTicks: true,
                highlights: [
                    { from: 70, to: 80, color: "rgba(0,0,0,1)" },
                    { from: 80, to: 82, color: "rgba(62,27,27,1)" },
                    { from: 82, to: 84, color: "rgba(124,53,54,1)" },
                    { from: 84, to: 86, color: "rgba(186,79,81,1)" },
                    { from: 86, to: 88, color: "#F8696B" },
                    { from: 88, to: 90, color: "#FB9574" },
                    { from: 90, to: 92, color: "#FDC07C" },
                    { from: 92, to: 94, color: "#FFEB84" },
                    { from: 94, to: 96, color: "#CBDC81" },
                    { from: 96, to: 98, color: "#97CD7E" },
                    { from: 98, to: 100, color: "#63BE7B" },
                ],
                colorPlate: "transparent",
                colorNumbers: "white",
                borderShadowWidth: 0,
                borders: false,
                needleType: "line",
                needleWidth: 3,
                needleCircleSize: 7,
                needleCircleOuter: true,
                needleCircleInner: true,
                animationDuration: 1500,
                animationRule: "linear",
                animatedOnInit: true,
                animatedValue: true,
                highDpiSupport: true,
            });
            gauge.draw();
        };

        initGauge();

        return () => {
            if (timer) clearTimeout(timer);
            if (gauge && typeof gauge.destroy === "function") {
                gauge.destroy();
            }
        };
    }, [value, sizePx, id]);

    return (
        <div className="gauge-canvas-wrapper" ref={wrapperRef}>
            <canvas
                id={id}
                ref={canvasRef}
                className="gauge-canvas"
                width={sizePx}
                height={sizePx}
                style={{ marginBottom: `${-Math.round(sizePx * 0.28)}px` }}
            />
        </div>
    );
}

// ─── Fila de métricas por familia ─────────────────────────────────────────

interface MetricaFamiliaProps {
    label: string;
    exec: string | undefined;
    porcentaje: string | undefined;
    real: string | undefined;
    porcentajescon: string | undefined;
}

function formatTime(val: any): string {
    if (!val || val === "-" || val === "0" || val === "00:00") return "00:00";
    if (typeof val === "string") {
        if (val.includes(":")) {
            const parts = val.split(":");
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
    }
    return String(val);
}

function MetricaFamilia({
    label,
    exec,
    porcentaje,
    real,
    porcentajescon,
    isSLA = false,
}: MetricaFamiliaProps & { isSLA?: boolean }) {
    const fExec = formatTime(exec);

    if (isSLA) {
        const fReal = formatTime(real);
        const valorP = parseFloat(porcentaje ?? "0") || 0;
        const valorPT = parseFloat(porcentajescon ?? "0") || 0;
        
        return (
            <div className="metric-row-sla-exact">
                <span className="label-sla">{label} :</span>
                <span className="time-sla">{fExec}</span>
                <span className="percent-box-sla" style={getColorPorcentaje(valorP)}>{valorP}%</span>
                <span className="time-real-sla">({fReal})</span>
                <span className="percent-box-sla" style={getColorPorcentaje(valorPT)}>{valorPT}%</span>
            </div>
        );
    }

    // Para Averías/Logística: Etiqueta, Tiempo y Porcentaje
    const valorP = parseFloat(porcentaje ?? "0") || 0;
    return (
        <div className="metric-row-original-aligned">
            <span className="label-original">{label} :</span>
            <span className="value-original">{fExec}</span>
            <span className="percent-box-original" style={getColorPorcentaje(valorP)}>
                {valorP}%
            </span>
        </div>
    );
}

// ─── Columna de periodo (Año/Semana/Mes) ──────────────────────────────────

interface PeriodColumnProps {
    id: string;
    titulo: string;
    gaugeId: string;
    gaugeValue: number;
    ejecucion: MetricaData;
    resolucion: MetricaData;
    porcentaje: MetricaData;
    porcentajeTiempo: MetricaData;
    className?: string;
    isSLA?: boolean;
}

function PeriodColumn({
    id,
    titulo,
    gaugeId,
    gaugeValue,
    ejecucion,
    resolucion,
    porcentaje,
    porcentajeTiempo,
    className = "",
    isSLA = false,
}: PeriodColumnProps) {
    const familias = [
        { key: "DI", exec: ejecucion?.DISPENSING, real: resolucion?.DISPENSING },
        { key: "VI", exec: ejecucion?.VITRINA, real: resolucion?.VITRINA },
        { key: "VE", exec: ejecucion?.VENDING, real: resolucion?.VENDING },
        { key: "BO", exec: ejecucion?.BOTELLERO, real: resolucion?.BOTELLERO },
    ];

    return (
        <div className={`gauge-card ${className}`} id={id}>
            <Gauge id={gaugeId} value={gaugeValue} isSLA={isSLA} />
            <div className="tituloTiempo">{titulo}</div>
            <div className="metrics-container">
                {familias.map((f) => (
                    <MetricaFamilia
                        key={f.key}
                        label={f.key}
                        exec={f.exec}
                        porcentaje={porcentaje?.[f.key as keyof MetricaData]}
                        real={f.real}
                        porcentajescon={porcentajeTiempo?.[f.key as keyof MetricaData]}
                        isSLA={isSLA}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────

interface MedidoresCocacolaProps {
    metricas: AllMetricas;
    loading: boolean;
    isSLA?: boolean;
    isLogistics?: boolean;
}

export default function MedidoresCocacola({
    metricas,
    loading,
    isSLA = false,
    isLogistics = false,
}: MedidoresCocacolaProps) {
    if (loading) return null;

    return (
        <div className={`medidoresEImagen ${isSLA ? "is-sla" : ""}`}>
            <div id="medidores">
                <div className="gauge-period-group">
                    <PeriodColumn
                        id="anio"
                        titulo="AÑO"
                        gaugeId="year-reusable"
                        gaugeValue={parseFloat(metricas.relojes.anio)}
                        ejecucion={metricas.ejecucion.anio}
                        resolucion={metricas.resolucion.anio}
                        porcentaje={metricas.porcentaje.anio}
                        porcentajeTiempo={metricas.porcentajeTiempo.anio}
                        isSLA={isSLA}
                        className={isSLA ? "arriba" : ""}
                    />
                </div>

                <div className="gauge-period-group central-group">
                    <img
                        src={isSLA ? "/img/cocacolaSLA.png" : cocacolaImg}
                        alt="CocaCola"
                        className="imgCocaCola-central"
                    />
                    <PeriodColumn
                        id="semana"
                        titulo="SEMANA"
                        gaugeId="week-reusable"
                        gaugeValue={parseFloat(metricas.relojes.semana)}
                        ejecucion={metricas.ejecucion.semana}
                        resolucion={metricas.resolucion.semana}
                        porcentaje={metricas.porcentaje.semana}
                        porcentajeTiempo={metricas.porcentajeTiempo.semana}
                        isSLA={isSLA}
                    />
                </div>

                <div className="gauge-period-group">
                    <PeriodColumn
                        id="mes"
                        titulo="MES"
                        gaugeId="month-reusable"
                        gaugeValue={parseFloat(metricas.relojes.mes)}
                        ejecucion={metricas.ejecucion.mes}
                        resolucion={metricas.resolucion.mes}
                        porcentaje={metricas.porcentaje.mes}
                        porcentajeTiempo={metricas.porcentajeTiempo.mes}
                        isSLA={isSLA}
                        className={isSLA ? "arriba" : ""}
                    />
                </div>
            </div>
        </div>
    );
}
  