import Cabecera from '../Components/Cabecera/Header'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useMemo, useState } from 'react'
import { useAuth } from '../Context/AuthContext'
import { getLastRegion, inferRegionCodeFromSearch, logAcceso, setLastRegion } from '../utils/logAccesos'
import { buildMenuMaps } from '../config/menuConfig' // Importamos el constructor de mapas
import { useSelection } from '../Context/SelectionContext'

import './menuLayout.css'

const MenuLayout = () => {
  const { user } = useAuth();
  const { selectedRegion: regionFromCtx, setSelectedRegion } = useSelection();
  const lastLoggedRef = useRef<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Estado para el ojo (abierto/cerrado) levantado desde Cabecera para que el layout reaccione
  const [headerVisible, setHeaderVisible] = useState(() => {
    const saved = localStorage.getItem('header_visible');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleHeader = () => {
    const newValue = !headerVisible;
    setHeaderVisible(newValue);
    localStorage.setItem('header_visible', JSON.stringify(newValue));
  };

  // 1. Procesamos la configuración del menú de forma eficiente
  const menuMaps = useMemo(() => {
    return user?.menuConfig ? buildMenuMaps(user.menuConfig) : null;
  }, [user]);

  // 2. Identificamos en qué "Vista" estamos basándonos en la URL actual
  const currentVista = useMemo(() => {
    if (!menuMaps) return null;

    // Path actual (ej: "/averias/" -> "averias")
    const cleanPath = location.pathname.replace(/^\/|\/$/g, '').toLowerCase();

    // Buscamos en el mapa de URLs qué código de vista corresponde a esta ruta
    // Importante: la URL en BD puede tener parámetros (?mainplant=C), comparamos solo la base
    const entry = Object.entries(menuMaps.urlByRegionVista).find(
      ([, urlEnBD]) => {
        if (!urlEnBD) return false;
        // Normalizamos la URL de BD (quitamos / inicial/final si existe y pasamos a minusculas)
        const baseBD = urlEnBD.split('?')[0].toLowerCase();
        const cleanBD = baseBD.replace(/^\/|\/$/g, '');
        return cleanBD === cleanPath;
      }
    );

    if (!entry) return null;

    const vistaCode = entry[0].split('|')[1]; // El key es "REGION|CODIGO"
    return menuMaps.vistaByCode[vistaCode];
  }, [location.pathname, menuMaps]);

  /* --- Texto de cabecera 100% reactivo a la Base de Datos --- */
  const getTextoCabecera = () => {
    const cleanPath = location.pathname.replace(/^\/|\/$/g, '').toLowerCase();

    // Casos especiales fijos
    if (cleanPath === '' || cleanPath === 'hub') return 'Portal B2B';

    if (cleanPath === 'cordinacion') {
      const params = new URLSearchParams(location.search);
      const tr = params.get('TR');
      const region = tr === 'C' ? ' - Canarias' : tr === 'B' ? ' - Baleares' : '';
      return `Menú Coordinación${region}`;
    }

    // Si es logística, forzamos el nombre estándar solicitado por el usuario
    if (cleanPath.includes('logistica') || cleanPath.includes('logistics')) {
      return 'STV Servicio Técnico';
    }

    // Si la ruta existe en la base de datos, usamos el NOMBRE configurado allí
    if (currentVista) {
      return currentVista.nombre;
    }

    return 'Portal B2B';
  }

  const getLogoCabecera = () => {
    return '/img/menu-logo.png';
  }

  /* --- Lógica de Log de Acceso Automatizada --- */
  useEffect(() => {
    if (!user || !menuMaps) return;
    if (location.pathname === '/' || location.pathname === '/hub') return;

    // El código de vista ya no es un switch, es lo que diga la BD
    const vistaCode = currentVista?.codigo;
    const regionFromUrl = inferRegionCodeFromSearch(location.search);

    // Prioridad: URL > Contexto (selección actual)
    const regionCode = (regionFromUrl || regionFromCtx) as any;

    // Si la página no está en la base de datos (y no es Home), no registramos log
    if (!vistaCode || !regionCode) return;

    const logKey = `${user.id}|${vistaCode}|${regionCode}|${location.pathname}|${location.search}`;
    if (lastLoggedRef.current === logKey) return;
    lastLoggedRef.current = logKey;

    logAcceso({
      vistaCode,
      regionCode,
      ruta: location.pathname,
      query: location.search || '',
    });
  }, [location.pathname, location.search, currentVista, user, menuMaps, regionFromCtx]);

  /* --- Manejador de clics para enlaces con data-attributes --- */
  useEffect(() => {
    if (!user) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const vistaCode = anchor.getAttribute('data-log-vista') || '';
      if (!vistaCode) return;

      const explicitRegion = anchor.getAttribute('data-log-region') as any;
      const regionCode = (explicitRegion === 'C' || explicitRegion === 'B')
        ? explicitRegion
        : inferRegionCodeFromSearch(anchor.search || '') || getLastRegion();

      if (!regionCode) return;
      setLastRegion(regionCode);

      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      logAcceso({
        vistaCode,
        regionCode,
        ruta: anchor.pathname || anchor.getAttribute('href') || '',
        query: anchor.search || '',
      }).finally(() => {
        // Si el enlace es interno, usamos navigate para evitar recarga completa
        if (anchor.origin === window.location.origin) {
          navigate(anchor.pathname + anchor.search);
        } else {
          window.location.href = anchor.href;
        }
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [user]);

  /* --- Sincronizar el título de la pestaña del navegador --- */
  useEffect(() => {
    const titulo = getTextoCabecera();
    document.title = titulo;
  }, [location.pathname, currentVista]);

  return (
    <div className={`layout ${headerVisible ? 'header-visible' : 'header-hidden'}`}>
      <Cabecera 
        texto={getTextoCabecera()} 
        logo={getLogoCabecera()} 
        verDetalles={headerVisible}
        onToggle={toggleHeader}
      />
      <main className="layout-main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default MenuLayout;  