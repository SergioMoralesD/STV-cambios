import React, { useState } from 'react';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export interface LegendItem {
    /** Clase(s) de Tailwind para el cuadrado de color, p.ej. "bg-black border border-white" */
    colorClass: string;
    label: string;
}

export interface RepuestoItem {
    /** Clave única (CODIGO_REPUESTO) */
    key: string;
    /** Texto a mostrar en la pastilla */
    label: string;
    /** Clases Tailwind de color para la pastilla */
    colorClass: string;
    /** Contenido del tooltip al hacer hover */
    tooltip: React.ReactNode;
    /** Imagen en base64 (sin prefijo) o undefined para usar el placeholder */
    imagen?: string;
}

export interface RepuestosPanelProps {
    title: React.ReactNode;
    legend: LegendItem[];
    items: RepuestoItem[];
    loading: boolean;
    error: string | null;
    onDismissError: () => void;
    emptyMessage?: string;
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function RepuestosPanel({
    title,
    legend,
    items,
    loading,
    error,
    onDismissError,
    emptyMessage = 'No hay datos disponibles.',
}: RepuestosPanelProps) {
    const [hovered, setHovered] = useState<RepuestoItem | null>(null);
    const [mouseX, setMouseX] = useState(0);
    const [mouseY, setMouseY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        setMouseX(e.clientX);
        setMouseY(e.clientY);
    };

    return (
        <div className="pb-10" >
            {/* Título */}
            <div className="w-full text-center mt-6 pt-4 relative">
                <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
            </div>

            <hr className="w-full border-white/50 my-6" />

            {/* Estados de carga / error */}
            {loading && <div className="mt-8"><Loader /></div>}
            {error && <ErrorMessage message={error} onClear={onDismissError} />}

            {/* Contenido principal */}
            {!loading && !error && (
                <div className="w-full gap-3 flex flex-col pb-5">

                    {/* Leyenda */}
                    <div className="w-full flex justify-center items-center gap-6 min-h-[50px] shadow-lg mb-8 flex-wrap">
                        {legend.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`w-4 h-4 ${item.colorClass}`} />
                                <span className="text-white text-sm">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Grid de pastillas */}
                    <div className="flex flex-wrap gap-3 justify-center mb-">
                        {items.map(rep => (
                            <div
                                key={rep.key}
                                className={`flex items-center justify-center h-[40px] w-[350px] px-4 rounded-md border-1 text-center font-bold text-sm cursor-pointer hover:scale-110 hover:z-20 transition-transform overflow-hidden ${rep.colorClass}`}
                                onMouseEnter={() => setHovered(rep)}
                                onMouseLeave={() => setHovered(null)}
                                onMouseMove={handleMouseMove}
                            >
                                <span className="truncate w-full">{rep.label}</span>
                            </div>
                        ))}
                        {items.length === 0 && (
                            <span className="text-white/70 italic text-center w-full block py-4">
                                {emptyMessage}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Tooltip flotante */}
            {hovered && (
                <div
                    className="fixed pointer-events-none z-50 bg-white text-black p-4 rounded-lg shadow-2xl border border-gray-300 max-w-[400px] flex items-center gap-4 transition-opacity duration-150 break-words"
                    style={{ left: mouseX + 15, top: mouseY + 15 }}
                >
                    <img
                        src={hovered.imagen ? `data:image/png;base64,${hovered.imagen}` : '/img/ej_repuesto.png'}
                        alt="repuesto"
                        className="w-24 h-24 object-contain shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="flex flex-col text-sm text-left">
                        {hovered.tooltip}
                    </div>
                </div>
            )}
            {/* Espaciador final para evitar que el contenido quede pegado al fondo */}
            <div style={{ height: '100px' }} />
        </div>
    );
}
  