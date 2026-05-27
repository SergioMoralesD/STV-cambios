import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { fetchMapSnapshot } from "../../../services/stvtracker";
import { getClaseFamilia } from "../../../config/regionConfig";
import { remoteLog } from "../../../utils/logger";
import type {
    PosicionTecnico as TechnicianMarker,
    Aviso as MachineMarker,
} from "../../../services/stvtracker";
import STVTrackerLegend, { type TechState } from "../../../Components/STVTracker/STVTrackerLegend";
import Loader from "../../../Components/common/Loader";
import "./STBTracker.css";

// Eliminamos dependencias directas de iconos remotos png para SVG locales
delete (L.Icon.Default.prototype as L.IconOptions & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const COLORS = [
    "#63b598", "#ce7d78", "#ea9e70", "#a48a9e", "#0d5ac1", "#f205e6", "#14a9ad",
    "#4ca2f9", "#a4e43f", "#d298e2", "#6119d0", "#c0a43c", "#f2510e", "#651be6",
    "#61da5e", "#9348af", "#01ac53", "#b11573", "#4bb473", "#2f3f94", "#ca4751",
    "#c4d647", "#11dec1", "#566ca0", "#935b6d", "#4b5bdc", "#fa06ec", "#1bb699",
    "#6b2e5f", "#64820f",
];

interface STVTrackerDashboardProps {
    mps: string;
}

// ── LÓGICA DE ICONOS SVG ──
function getTechStatusColor(marker: TechnicianMarker): string {
    const reportTime = marker.DESCONEXION ? parseInt(marker.DESCONEXION) : 0;
    if (reportTime <= 10) return "#1bb699"; // Verde (<=10 mins)
    if (reportTime <= 60) return "#fbcc26"; // Amarillo (11m-60m)
    if (reportTime <= 120) return "#ca4751"; // Rojo (1h-2h)
    return "#333333"; // Negro (>2h)
}

function getAveriaColor(family: string, tipo: string): string {
    const [, clase] = getClaseFamilia(family, tipo);
    switch (clase) {
        case "colorDispensing": return "#979a9a";
        case "colorVitrina": return "#e67e22";
        case "colorVending": return "#7b5103";
        case "colorBotellero": return "#288ba8";
        default: return "#000000";
    }
}

const getStopHandIconUrl = (color: string): string =>
    color === "#ca4751" ? "/img/carMarkerRED.png" : "/img/carMarker.png";

const createStopHandIcon = (color: string) =>
    L.icon({
        iconUrl: getStopHandIconUrl(color),
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
    });

const createTechMachineIcon = (fillColor: string, borderColor: string) => {
    const svg = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${fillColor}" stroke="${borderColor}" stroke-width="1"/>
    </svg>`;
    return L.divIcon({ html: svg, className: "custom-svg-icon", iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12] });
}

const centerMapOnPoints = (map: L.Map, points: L.Marker[]) => {
    if (points.length === 0) return;

    const bounds = L.latLngBounds(points.map((point) => point.getLatLng()));
    if (!bounds.isValid()) return;

    if (points.length === 1) {
        map.setView(bounds.getCenter(), 16, { animate: true });
        return;
    }

    map.fitBounds(bounds.pad(0.2), {
        animate: true,
        maxZoom: 16,
    });
};


export default function STVTrackerDashboard({ mps }: STVTrackerDashboardProps) {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

    // Guardamos los datos puros para filtrar dependiendo de los checks
    const dataRef = useRef<{
        markers: TechnicianMarker[],
        aCocaCola: MachineMarker[],
        pausas: string[]
    }>({ markers: [], aCocaCola: [], pausas: [] });

    const [techStates, setTechStates] = useState<TechState[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mps || !mapRef.current) return;

        if (!mapInstanceRef.current) {
            const map = L.map(mapRef.current, { attributionControl: false }).setView([28.2916, -16.6291], 7);
            mapInstanceRef.current = map;

            L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
                maxZoom: 19,
                minZoom: 7,
                attribution: "© Google"
            }).addTo(map);

            const clusterGroup = L.markerClusterGroup({
                disableClusteringAtZoom: 21,
                maxClusterRadius: 40,
                spiderfyOnMaxZoom: true,

                // Puedes personalizar el clusterPolygon aquí si es necesario
            });
            map.addLayer(clusterGroup);
            clusterRef.current = clusterGroup;
        }

        let cancelled = false;
        const loadData = (silent = false) => {
            if (!silent) setLoading(true);
            fetchMapSnapshot(mps)
                .then((data) => {
                    if (cancelled) return;

                    const validMarkers = data.markers.filter((t) => t.LATITUD && t.LONGITUD);
                    const listPausas = (data.pausasCocaCola || []).map(p => String(p.CHIA_VOSTROORDINE));

                    dataRef.current = {
                        markers: validMarkers,
                        aCocaCola: data.aCocaCola,
                        pausas: listPausas
                    };

                    setTechStates(prevStates => {
                        return validMarkers.map((t, i) => {
                            const prevState = prevStates.find(ps => ps.codigo === t.CODIGO_TECNICO);
                            return {
                                codigo: t.CODIGO_TECNICO,
                                nombre: t.NOMBRE_TECNICO,
                                color: COLORS[i % COLORS.length],
                                checked: prevState ? prevState.checked : true,
                            };
                        });
                    });

                    setLoading(false);
                })
                .catch((err: Error) => {
                    if (cancelled) return;
                    setError(err.message || "Error cargando mapa");
                    setLoading(false);
                });
        };

        loadData();
        const UNMINUTO = 60 * 1000;
        const intervalId = setInterval(() => loadData(true), UNMINUTO); // 1 minuto
        remoteLog(`STVTrackerDashboard: ${mps}`, { level: 'INFO', context: 'STVTrackerDashboard' });

        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [mps]);

    // Efecto para repintar marcadores basándonos en los checks
    useEffect(() => {
        if (!clusterRef.current || !mapInstanceRef.current) return;
        const clusterGroup = clusterRef.current;

        clusterGroup.clearLayers();
        const newMarkers: L.Marker[] = [];

        // 1. Añadir Marcadores de Técnicos chequeados
        const checkedTechs = techStates.filter(t => t.checked);
        const checkedCodigos = checkedTechs.map(t => t.codigo);

        checkedTechs.forEach(tech => {
            const techData = dataRef.current.markers.find(m => m.CODIGO_TECNICO === tech.codigo);
            if (!techData) return;

            const statusColor = getTechStatusColor(techData);
            const icon = createStopHandIcon(statusColor);

            const mk = L.marker([Number(techData.LATITUD), Number(techData.LONGITUD)], { icon })
                .bindPopup(`<b>${techData.NOMBRE_TECNICO}</b><br/>Código: ${techData.CODIGO_TECNICO}`);

            newMarkers.push(mk);
        });

        // 2. Añadir Marcadores de Máquinas (solo de técnicos chequeados o sin técnico asignado)
        dataRef.current.aCocaCola.forEach(machine => {
            const lat = Number(machine.LATITUD);
            const lng = Number(machine.LONGITUD);
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

            let renderIcon = false;
            const isPaused = dataRef.current.pausas.includes(String(machine.AVISO));

            // Relleno: Verde si activo, Morado si pausado
            const fillColor = isPaused ? "#8b428bff" : "#008000";
            // Borde: Color de la familia
            const borderColor = getAveriaColor(machine.FAMILIA, machine.TIPO_AVISO);

            if (machine.CODIGO_TECNICO && checkedCodigos.includes(machine.CODIGO_TECNICO)) {
                // Avería de técnico activo
                renderIcon = true;
            } else if (!machine.CODIGO_TECNICO) {
                // Avería no asignada a nadie, se dibuja siempre
                renderIcon = true;
            }

            if (renderIcon) {
                const clientName = machine.NOMBRE_CLIENTE || machine.NOMBRE_CLIENTE2 || "Sin cliente";
                const popupContent = `
                    <div style="display:flex;align-items:flex-start;gap:8px;min-width:220px;">
                        <img
                            src="/img/cocacola.jpg"
                            alt="Coca-Cola"
                            style="width:48px;height:48px;object-fit:cover;border-radius:4px;flex-shrink:0;"
                        />
                        <div>
                            <b>${clientName}</b><br/>Aviso: ${machine.AVISO}
                            <br/><span style="color:${fillColor};font-weight:bold;">${isPaused ? 'Pausada' : 'Activa'}</span>
                        </div>
                    </div>
                `;
                const mk = L.marker([lat, lng], { icon: createTechMachineIcon(fillColor, borderColor) })
                    .bindPopup(popupContent);
                newMarkers.push(mk);
            }
        });

        clusterGroup.addLayers(newMarkers);
        centerMapOnPoints(mapInstanceRef.current, newMarkers);

    }, [techStates]); // Re-ejecuta cada vez que cambian los checks


    return (
        <div className="stv-container">
            <div ref={mapRef} className="stv-map" />

            <div className="stv-header-logo">
                <img src="/img/stv.png" alt="STV" className="stv-logo-thumb" />
                <span className="stv-logo-text">tracker</span>
            </div>

            <button className="stv-btn-historico">
                Histórico
            </button>

            {!loading && !error && (
                <STVTrackerLegend
                    techStates={techStates}
                    setTechStates={setTechStates}
                />
            )}

            {loading && !error && (
                <Loader />
            )}

            {error && (
                <div className="stv-overlay">
                    <span className="stv-error">{error}</span>
                </div>
            )}
        </div>
    );
}
  