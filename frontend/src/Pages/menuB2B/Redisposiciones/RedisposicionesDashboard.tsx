import { useState, useEffect, useMemo } from "react";
import { fetchRedisposiciones } from "../../../services/redisposicionesService";
import type { Redisposiciones } from "../../../services/Types";
import { HelpButton, HelpMenu } from "../../../Components/Help/helpmenu";
import Loader from "../../../Components/common/Loader";
import useBackgroundImage from "../../../Hooks/useBackgroundImage";
import "./RedisposicionesDashboard.css";
import "../../../App.css";

// ─── HELPERS ───────────────────────────────────────────────────────────────

function getNivel(nivel?: number | null): { text: string; cls: string; order: number } {
    const n = nivel ?? 0; // Por defecto a básico o lo que desees
    switch (n) {
        case 0:
            return { text: "Básico", cls: "verde", order: 1 };
        case 1:
            return { text: "Medio", cls: "amarillo", order: 2 };
        case 2:
            return { text: "Máximo", cls: "rojo", order: 3 };
        case 3:
            return { text: "Extra+", cls: "negro", order: 4 };
        default:
            return { text: "Básico", cls: "verde", order: 1 };
    }
}

interface Equipo {
    matricula: string;
    modelo: string;
    familia: string;
    nivel: number;
}

function formatearDatos(datos: Redisposiciones[]): {
    equipos: Equipo[];
    familias: string[];
} {
    const acumulado: Record<string, Equipo> = {};
    const familiasSet = new Set<string>();

    datos.forEach((item: Redisposiciones) => {
        const matricula = item.MATRICULA || item.matricula || "—";
        const modelo = item.NOMBRE_MODELO || item.MODELO || "—";
        const familia = item.TIPO_FRIO === "CABEZAL" ? "Cabezal" : (item.NOMBRE_FAMILIA || item.TIPO_FAMILIA || "—");
        const nivel = item.NIVEL ?? 0;

        familiasSet.add(familia);
        acumulado[matricula] = { matricula, modelo, familia, nivel };
    });

    return {
        equipos: Object.values(acumulado),
        familias: Array.from(familiasSet),
    };
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────

interface RedisposicionesDashboardProps {
    mainplant: string;
}

export default function RedisposicionesDashboard({
    mainplant,
}: RedisposicionesDashboardProps) {
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [familias, setFamilias] = useState<string[]>([]);
    const [loading, setLoading] = useState(!!mainplant);
    const [error, setError] = useState<string | null>(null);

    const [familiaFilter, setFamiliaFilter] = useState("");
    const [nivelFilter, setNivelFilter] = useState("");
    const [searchText, setSearchText] = useState("");
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    useBackgroundImage('/img/Fondo_Escritorio_2.jpg', 'Redisposiciones');

    useEffect(() => {
        if (!mainplant) {
            return;
        }

        const loadData = (silent = false) => {
            if (!silent) setLoading(true);
            setError(null);
            fetchRedisposiciones(mainplant)
                .then((data) => {
                    if (data.length === 0) {
                        setError("No hay datos disponibles en este momento");
                    } else {
                        const { equipos: eq, familias: fam } = formatearDatos(data);
                        setEquipos(eq);
                        setFamilias(fam);
                    }
                    setLoading(false);
                })
                .catch(() => {
                    setError("Error interno del servidor");
                    setLoading(false);
                });
        };

        loadData();
        const interval = setInterval(() => loadData(true), 60000);

        return () => clearInterval(interval);
    }, [mainplant]);

    const filtered = useMemo(() => {
        const txt = searchText.trim().toLowerCase();
        return equipos
            .filter((eq) => {
                const matchFamilia = !familiaFilter || eq.familia === familiaFilter;
                const matchSearch =
                    !txt ||
                    eq.matricula.toLowerCase().includes(txt) ||
                    eq.modelo.toLowerCase().includes(txt);
                const matchNivel =
                    !nivelFilter || getNivel(eq.nivel).text === nivelFilter;
                return matchFamilia && matchSearch && matchNivel;
            })
            .sort((a, b) => getNivel(a.nivel).order - getNivel(b.nivel).order);
    }, [equipos, familiaFilter, nivelFilter, searchText]);

    return (

        <div className="rd-dashboard fondo-escritorio">
            <HelpButton
                onClick={() => setIsHelpOpen(true)}
                className="rd-help-btn"
            />
            {/* Filters */}
            <div className="rd-filters">
                <select
                    className="rd-select"
                    value={familiaFilter}
                    onChange={(e) => setFamiliaFilter(e.target.value)}
                    disabled={loading || !!error}
                >
                    <option value="">-- Familia --</option>
                    {familias.map((f) => (
                        <option key={f} value={f}>
                            {f}
                        </option>
                    ))}
                </select>

                <select
                    className="rd-select"
                    value={nivelFilter}
                    onChange={(e) => setNivelFilter(e.target.value)}
                    disabled={loading || !!error}
                >
                    <option value="">-- Nivel --</option>
                    <option value="Básico">Básico</option>
                    <option value="Medio">Medio</option>
                    <option value="Máximo">Máximo</option>
                    <option value="Extra+">Extra+</option>
                </select>

                <div className="rd-search-wrap">
                    <input
                        className="rd-search"
                        type="text"
                        placeholder="Buscar por matrícula o modelo..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        disabled={loading || !!error}
                    />
                </div>


            </div>

            {/* Content */}
            {loading ? (
                <Loader />
            ) : error ? (
                <div className="error-banner">
                    <span>{error}</span>
                </div>
            ) : (
                <div className="rd-table-wrap">
                    <table className="rd-table">
                        <thead>
                            <tr>
                                <th>Matrícula</th>
                                <th>Familia</th>
                                <th>Modelo</th>
                                <th>Nivel</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="rd-no-data">
                                        No hay coincidencias para los filtros aplicados
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((eq) => {
                                    const dataNivel = getNivel(eq.nivel);
                                    return (
                                        <tr key={eq.matricula} className={dataNivel.cls}>
                                            <td>{eq.matricula}</td>
                                            <td>{eq.familia}</td>
                                            <td>{eq.modelo}</td>
                                            <td>{dataNivel.text}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            <HelpMenu
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                subView="redisposiciones"
            />
        </div>
    );
}
  