import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { STVLogisticsTexto } from "../../../Components/STVLogistics/TecnicoCard";
import { fetchLogisticsFull } from "../../../services/stvlogistics";
import { useAuth } from "../../../Context/AuthContext";
import { useSelection } from "../../../Context/SelectionContext";
import { remoteLog } from "../../../utils/logger";
import type { AllMetricas, AveriaActividad, IslaData, RecuentoEstado } from "../../../services/Types";
import { HelpButton, HelpMenu } from "../../../Components/Help/helpmenu";
import {
  obtenerDelegacionesVista,
  obtenerRegionActual,
  resolverMainplant,
} from "../../../config/regionConfig";

// Estilos globales de logística
import "../../../Components/STVLogistics/STVLogistics.css";
import Loader from "../../../Components/common/Loader";

export default function STVLogisticsPage() {
  const { user } = useAuth();
  const { selectedRegion, selectedDelegations } = useSelection();
  const navigate = useNavigate();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const regionCode = useMemo(
    () => obtenerRegionActual(selectedRegion, user?.regiones),
    [selectedRegion, user?.regiones]
  );

  const allowed = useMemo(
    () => obtenerDelegacionesVista(user?.delegaciones, regionCode, "STVLOG"),
    [user?.delegaciones, regionCode]
  );

  const mainplantParam = useMemo(() => {
    const resolved = resolverMainplant({
      seleccion: selectedDelegations,
      permitidas: allowed,
      modo: "filtrado",
      devolverNullSinPermitidas: true,
    });

    if (
      resolved === null &&
      selectedDelegations &&
      selectedDelegations !== "C" &&
      selectedDelegations !== "B"
    ) {
      remoteLog(
        `ACCESO DENEGADO (STVLOG): Intento de acceso no autorizado por ${user?.usuario} a ${selectedDelegations}`,
        { level: "WARN", context: "LogisticsDashboardPage" },
      );
    }

    return resolved;
  }, [selectedDelegations, allowed, user?.usuario, user?.codigo_usuario]);

  const mainplants = useMemo(() => {
    if (mainplantParam === null) return null;
    const finalSelection = (mainplantParam ? mainplantParam.split("-") : []).filter(Boolean);

    if (regionCode === "C" && finalSelection.includes("6S21") && !finalSelection.includes("6S21_MENORES")) {
      finalSelection.push("6S21_MENORES");
    }

    return finalSelection;
  }, [mainplantParam, regionCode]);

  // 4. Redirección si no hay permiso
  useEffect(() => {
    if (mainplants === null) {
      navigate("/hub");
    }
  }, [mainplants, navigate]);

  const mainplantStr = mainplants?.join("-") || "";
  const hasAccess = mainplants !== null;

  const [data, setData] = useState<{
    averias: AveriaActividad[];
    recuentos: RecuentoEstado[];
  }>({ averias: [], recuentos: [] });
  const [metricas, setMetricas] = useState<AllMetricas | null>(null);
  const [tiemposAnio, setTiemposAnio] = useState<Record<string, IslaData>>({});
  const [tiemposMes, setTiemposMes] = useState<Record<string, IslaData>>({});
  const [loading, setLoading] = useState(true);

  // ── Scale automático ────────────────────────────────────────────────────────
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const calcScale = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;

    // Reset styles to measure correctly
    el.style.transform = "none";
    void el.offsetHeight;

    const child = el.firstElementChild as HTMLElement | null;
    if (!child) return;

    const contentWidth = child.offsetWidth;
    const contentHeight = child.offsetHeight;

    if (contentWidth === 0 || contentHeight === 0) return;

    const scaleX = window.innerWidth / contentWidth;
    const scaleY = window.innerHeight / contentHeight;
    
    // Fill the screen but maintain aspect ratio
    let newScale = Math.min(scaleX, scaleY);

    // En monitores más pequeños que 1080p, hacemos el contenido un poco más grande
    // para que se aproveche mejor el espacio (se puede hacer scroll si se necesita)
    if (window.innerHeight < 1080 && window.innerWidth > 768) {
      newScale = newScale * 1.1;
    }

    setScale(newScale);
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(calcScale, 150);
    }
  }, [loading, calcScale]);

  useEffect(() => {
    window.addEventListener("resize", calcScale);
    return () => window.removeEventListener("resize", calcScale);
  }, [calcScale]);

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const res = await fetchLogisticsFull(mainplantStr);
      setData(res.logistics);
      setMetricas(res.metricas);
      setTiemposAnio(res.metricas.tiemposAnio || {});
      setTiemposMes(res.metricas.tiemposMes || {});
    } catch (error: unknown) {
      console.error("Error cargando dashboard logística:", error);
    } finally {
      setLoading(false);
    }
  }, [mainplantStr]);

  useEffect(() => {
    if (!hasAccess) return;
    loadData();
    const i = setInterval(() => {
      loadData(true);
    }, 60_000);
    remoteLog(`STVLogisticsPage: ${mainplantStr}`, { level: 'INFO', context: 'LogisticsDashboardPage' });
    return () => clearInterval(i);
  }, [loadData, hasAccess, mainplantStr]);

  if (!hasAccess) return null;

  if (!loading && !metricas) {
    return (
      <div className="error-container">
        <p>Error cargando los datos del dashboard. Por favor, intente de nuevo.</p>
        <button onClick={() => { setLoading(true); loadData(); }}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="logistics-scale-wrapper">
      <HelpButton onClick={() => setIsHelpOpen(true)} />
      <HelpMenu
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        subView="logistica"
      />
      {loading ? (
        <Loader />
      ) : (
        <div
          ref={innerRef}
          className="logistics-scale-inner"
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            width: "100%",
            position: "absolute",
            top: 0,
            left: 0
          }}
        >
          <STVLogisticsTexto
            mainplants={mainplants || []}
            averias={data.averias}
            recuentos={data.recuentos}
            metricas={metricas!}
            tiemposAnio={tiemposAnio}
            tiemposMes={tiemposMes}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}

  