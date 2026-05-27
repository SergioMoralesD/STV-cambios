import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import "./map.css";
import "./colorPick.min.css";
import { useEffect, useRef, useState, useCallback } from "react";
import * as L from "leaflet";

import type {
    PosicionTecnico as TechnicianMarker,
    Aviso as MachineMarker,
    PausaOrden as PausaCocaCola,
    AreaData,
} from "../../services/stvtracker";

import {
    TECHNICIAN_COLORS,
    getIslandCoordinates,
    checkReport,
    getIconUrl,
    getFontColorClass,
    familiaToTime,
    getMachineIconUrl,
    getDistanceKm,
    getCookie,
    setCookie,
    deleteCookie,
} from "../../services/helpers";

// ─── TIPOS ───────────────────────────────
interface DrawnLayerOptions extends L.PathOptions {
    cod_tecnico: string;
    area: number;
}
interface DrawnLayerMeta {
    layer: L.Layer;
    cod_tecnico: string;
    area: number;
}
interface TechnicianState {
    codigo: string;
    nombre: string;
    color: string;
    checked: boolean;
}
interface MapComponentProps {
    markers: TechnicianMarker[];
    aCocaCola: MachineMarker[];
    pausasCocaCola: PausaCocaCola[];
    prueba: AreaData[][];
    setPrueba: React.Dispatch<React.SetStateAction<AreaData[][]>>;
}

// ─── CONSTANTES ─────────────────────────

// ─── COMPONENTE ─────────────────────────
export default function MapComponent({
    markers,
    aCocaCola,
    pausasCocaCola,
    prueba,
    setPrueba,
}: MapComponentProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const drawnItems = useRef<L.FeatureGroup | null>(null);
    const drawControl = useRef<L.Control | null>(null);
    const pruebaRef = useRef(prueba);
    const numArea = useRef(0);
    const drawnLayers = useRef<DrawnLayerMeta[]>([]);
    const listLayers = useRef<L.Rectangle[]>([]);
    const activeMarkers = useRef<[string, number, number, L.Marker][]>([]);
    const activeMachineMarkers = useRef<[number, number, L.Marker][]>([]);
    const [legendOpen, setLegendOpen] = useState(false);
    const [technicians, setTechnicians] = useState<TechnicianState[]>(() => {
        const pool = [...TECHNICIAN_COLORS];
        return markers.map((m) => ({
            codigo: m.CODIGO_TECNICO,
            nombre: m.NOMBRE_TECNICO,
            color: pool.splice(0, 1)[0] ?? "#999",
            checked: getCookie(m.CODIGO_TECNICO) !== null,
        }));
    });

    const currentTecnicoRef = useRef("");
    const currentColorRef = useRef(TECHNICIAN_COLORS[0]);

    useEffect(() => {
        pruebaRef.current = prueba;
    }, [prueba]);

    useEffect(() => {
        const pool = [...TECHNICIAN_COLORS];
        setTechnicians(
            markers.map((m) => ({
                codigo: m.CODIGO_TECNICO,
                nombre: m.NOMBRE_TECNICO,
                color: pool.splice(0, 1)[0] ?? "#999",
                checked: getCookie(m.CODIGO_TECNICO) !== null,
            })),
        );
    }, [markers]);

    // ── Inicializar mapa
    useEffect(() => {
        if (!mapRef.current || leafletMap.current) return;
        const isla = new URLSearchParams(window.location.search).get("mainplant");
        const { coords, zoom } = getIslandCoordinates(isla);
        const map = L.map(mapRef.current, { attributionControl: false }).setView(coords, zoom);
        leafletMap.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const fg = new L.FeatureGroup();
        map.addLayer(fg);
        drawnItems.current = fg;

        const dc = new L.Control.Draw({
            draw: { circle: false },
            edit: { featureGroup: fg },
        });
        drawControl.current = dc;

        // ── draw:created
        map.on("draw:created", (e: any) => {
            const layer = e.layer as L.Polygon;
            const latLngs = (layer.getLatLngs()[0] as L.LatLng[]).map(
                (ll) => [ll.lat, ll.lng] as [number, number],
            );
            const tecnico = currentTecnicoRef.current;
            const color = currentColorRef.current;
            const area = numArea.current;
            const opts = layer.options as DrawnLayerOptions;
            Object.assign(opts, {
                cod_tecnico: tecnico,
                area,
                color,
                fill: true,
                fillOpacity: 0.2,
                opacity: 0.5,
                stroke: true,
                weight: 4,
            });
            fg.addLayer(layer);
            map.addLayer(layer);
            drawnLayers.current.push({ layer, cod_tecnico: tecnico, area });
            setPrueba((prev) => [
                ...prev,
                [{ cod_tecnico: tecnico, type: e.layerType, latLngs, area }],
            ]);
            numArea.current += 1;
        });

        // ── draw:edited
        map.on("draw:edited", (e: any) => {
            e.layers.eachLayer((editedLayer: L.Layer) => {
                const meta = drawnLayers.current.find((d) => d.layer === editedLayer);
                if (!meta) return;
                const lls = (
                    (editedLayer as L.Polygon).getLatLngs()[0] as L.LatLng[]
                ).map((ll) => [ll.lat, ll.lng] as [number, number]);
                setPrueba((prev) => {
                    const original = prev.find(
                        (el) =>
                            el[0].cod_tecnico === meta.cod_tecnico &&
                            el[0].area === meta.area,
                    );
                    if (!original) return prev;
                    const next = prev.filter(
                        (el) =>
                            !(
                                el[0].cod_tecnico === meta.cod_tecnico &&
                                el[0].area === meta.area
                            ),
                    );
                    return [
                        ...next,
                        [
                            {
                                cod_tecnico: meta.cod_tecnico,
                                type: original[0].type,
                                latLngs: lls,
                                area: meta.area,
                            },
                        ],
                    ];
                });
            });
        });

        map.on("draw:deleted", (e: any) => {
            e.layers.eachLayer((deletedLayer: L.Layer) => {
                const meta = drawnLayers.current.find((d) => d.layer === deletedLayer);
                if (!meta) return;
                drawnLayers.current = drawnLayers.current.filter(
                    (d) => d.layer !== deletedLayer,
                );
                setPrueba((prev) =>
                    prev.filter(
                        (el) =>
                            !(
                                el[0].cod_tecnico === meta.cod_tecnico &&
                                el[0].area === meta.area
                            ),
                    ),
                );
            });
        });

        return () => {
            map.remove();
            leafletMap.current = null;
        };
    }, []);

    // ── Actualizar marcadores
    const refreshMapMarkers = useCallback(
        (techs: TechnicianState[]) => {
            const map = leafletMap.current;
            if (!map) return;
            activeMarkers.current.forEach(([, , , m]) => m.remove());
            activeMachineMarkers.current.forEach(([, , m]) => m.remove());
            activeMarkers.current = [];
            activeMachineMarkers.current = [];
            listLayers.current.forEach((l) => map.removeLayer(l));
            listLayers.current = [];
            const checkedCount = techs.filter((t) => t.checked).length;

            techs.forEach((tech) => {
                if (!tech.checked) return;
                const marker = markers.find((m) => m.CODIGO_TECNICO === tech.codigo);
                if (!marker) return;
                currentTecnicoRef.current = tech.codigo;
                currentColorRef.current = tech.color;

                // ── Pin técnico
                const iconType = checkReport(marker);
                const pin = L.marker([marker.LATITUD, marker.LONGITUD], {
                    icon: L.icon({ iconUrl: getIconUrl(iconType), iconSize: [23, 22] }),
                }).addTo(map);
                const popup = new L.Popup()
                    .setLatLng([marker.LATITUD, marker.LONGITUD])
                    .setContent(
                        `<strong class="${getFontColorClass(iconType)}">${marker.CODIGO_TECNICO} - ${marker.NOMBRE_TECNICO}</strong>`,
                    );
                pin
                    .bindPopup(popup, { autoClose: false, autoPan: false, maxWidth: 500 })
                    .openPopup();
                pin.on("mouseover", () => {
                    pin.openPopup();
                });
                activeMarkers.current.push([
                    marker.CODIGO_TECNICO,
                    marker.LATITUD,
                    marker.LONGITUD,
                    pin,
                ]);

                // ── Marcadores máquinas
                aCocaCola
                    .filter((m) => m.CODIGO_TECNICO === tech.codigo)
                    .forEach((machine) => {
                        const lat = Number(machine.LATITUD);
                        const lng = Number(machine.LONGITUD);
                        if (isNaN(lat) || isNaN(lng)) return;
                        const delta = parseFloat(String(machine.DELTA_ORIGEN ?? 0));
                        const tiempo = familiaToTime(machine.FAMILIA, delta);
                        const imgUrl = getMachineIconUrl(
                            tiempo,
                            machine.AVISO,
                            pausasCocaCola,
                        );
                        const mPin = L.marker([lat, lng], {
                            icon: L.icon({ iconUrl: imgUrl, iconSize: [13, 13] }),
                        }).addTo(map);
                        const clientName =
                            machine.NOMBRE_CLIENTE2 ?? machine.NOMBRE_CLIENTE;
                        const mPopup = new L.Popup()
                            .setLatLng([lat, lng])
                            .setContent(
                                `<div id="popup"><img id="logo" src="./src/img/cocacola.png"/><strong>${clientName}</strong></div>`,
                            );
                        mPin.bindPopup(mPopup, {
                            autoClose: false,
                            autoPan: false,
                            maxWidth: 500,
                        });
                        mPin.on("mouseover", () => {
                            mPin.openPopup();
                        });
                        mPin.on("mouseout", () => {
                            mPin.closePopup();
                        });
                        activeMachineMarkers.current.push([lat, lng, mPin]);
                    });

                // ── Dibujar áreas guardadas
                pruebaRef.current.forEach((el) => {
                    if (el[0].cod_tecnico !== tech.codigo) return;
                    numArea.current = el[0].area + 1;
                    const latlngs = el[0].latLngs as [number, number][];
                    const rect = L.rectangle(
                        L.latLngBounds(latlngs.map((ll) => L.latLng(ll[0], ll[1]))),
                        {
                            color: tech.color,
                            fill: true,
                            fillOpacity: 0.2,
                            opacity: 0.5,
                            stroke: true,
                            weight: 4,
                        },
                    );
                    listLayers.current.push(rect);
                    drawnItems.current?.addLayer(rect);
                    map.addLayer(rect);
                    drawnLayers.current.push({
                        layer: rect,
                        cod_tecnico: el[0].cod_tecnico,
                        area: el[0].area,
                    });
                });
            });

            // Control draw
            if (drawControl.current) {
                if (checkedCount === 1) map.addControl(drawControl.current);
                else map.removeControl(drawControl.current);
            }

            activeMarkers.current.forEach((mar) => {
                const nearby: string[] = [],
                    contents: string[] = [];
                activeMarkers.current.forEach((other) => {
                    if (other[0] === mar[0]) return;
                    if (
                        getDistanceKm(mar[1], mar[2], other[1], other[2]) < 1 &&
                        !nearby.includes(other[0])
                    ) {
                        nearby.push(other[0]);
                        const c = other[3].getPopup()?.getContent();
                        if (c) contents.push(String(c));
                        other[3].closePopup();
                    }
                });
                if (contents.length) {
                    const merged = [
                        ...contents,
                        String(mar[3].getPopup()?.getContent() ?? ""),
                    ]
                        .map((html) => {
                            const div = document.createElement("div");
                            div.innerHTML = html;
                            const strong = div.querySelector("strong");
                            if (strong) {
                                if (strong.className === "red") strong.className = "redFont";
                                else if (strong.className === "green")
                                    strong.className = "greenFont";
                                else if (strong.className === "black")
                                    strong.className = "blackFont";
                            }
                            return div.innerHTML;
                        })
                        .join("");
                    mar[3].setPopupContent(merged);
                }
            });
        },
        [markers, aCocaCola, pausasCocaCola],
    );

    // ── Checkbox
    const handleCheck = useCallback(
        (codigo: string, checked: boolean) => {
            setTechnicians((prev) => {
                const updated = prev.map((t) =>
                    t.codigo === codigo ? { ...t, checked } : t,
                );
                checked ? setCookie(codigo, codigo) : deleteCookie(codigo);
                refreshMapMarkers(updated);
                return updated;
            });
        },
        [refreshMapMarkers],
    );

    const handleMarkAll = useCallback(
        (check: boolean) => {
            setTechnicians((prev) => {
                const updated = prev.map((t) => {
                    check ? setCookie(t.codigo, t.codigo) : deleteCookie(t.codigo);
                    return { ...t, checked: check };
                });
                refreshMapMarkers(updated);
                return updated;
            });
        },
        [refreshMapMarkers],
    );

    // ── Montaje inicial
    useEffect(() => {
        if (technicians.length) refreshMapMarkers(technicians);
    }, [technicians, refreshMapMarkers]);

    // ─── RENDER ─────────────────────────────
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                fontFamily: "sans-serif",
            }}
        >
            <div ref={mapRef} style={{ flex: 1 }} />
            <div
                id="titLeyend"
                onClick={() => setLegendOpen((o) => !o)}
                style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "#fff",
                    padding: "6px 10px",
                    borderRadius: 4,
                    cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(0,0,0,.3)",
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    userSelect: "none",
                }}
            >
                {legendOpen ? "Ocultar técnicos" : "Mostrar técnicos"}
                <span
                    style={{
                        display: "inline-block",
                        transition: "transform .2s",
                        transform: legendOpen ? "rotate(0deg)" : "rotate(180deg)",
                    }}
                >
                    ▲
                </span>
            </div>
            {legendOpen && (
                <div
                    id="leyenda"
                    style={{
                        position: "absolute",
                        top: 46,
                        right: 10,
                        background: "#fff",
                        padding: "8px 12px",
                        borderRadius: 4,
                        boxShadow: "0 1px 6px rgba(0,0,0,.3)",
                        zIndex: 1000,
                        minWidth: 220,
                        maxHeight: "60vh",
                        overflowY: "auto",
                    }}
                >
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <button
                            id="marcar"
                            onClick={() => handleMarkAll(true)}
                            style={btnStyle}
                        >
                            Marcar todos
                        </button>
                        <button
                            id="desmarcar"
                            onClick={() => handleMarkAll(false)}
                            style={btnStyle}
                        >
                            Desmarcar todos
                        </button>
                    </div>
                    {technicians.map((tech) => (
                        <label
                            key={tech.codigo}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 4,
                                cursor: "pointer",
                            }}
                        >
                            <input
                                type="checkbox"
                                className="checkboxChecker"
                                checked={tech.checked}
                                onChange={(e) => handleCheck(tech.codigo, e.target.checked)}
                            />
                            <span>{tech.nombre}</span>
                            <span
                                id={tech.codigo}
                                className="colores"
                                style={{
                                    display: "inline-block",
                                    width: 14,
                                    height: 14,
                                    borderRadius: 2,
                                    backgroundColor: tech.color,
                                    marginLeft: "auto",
                                }}
                            />
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── ESTILOS ─────────────────────────────
const btnStyle: React.CSSProperties = {
    fontSize: 12,
    padding: "3px 7px",
    borderRadius: 3,
    border: "1px solid #ccc",
    cursor: "pointer",
    background: "#f5f5f5",
};  