import './App.css'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { useAuth } from './Context/AuthContext'
import { SelectionProvider, useSelection } from './Context/SelectionContext'

import MenuLayout from './Layouts/MenuLayout'
import Login from './Pages/Login/Login'
import ProtectedRoute from './Components/Rutas/ProtectedRoute'
import Hub from './Pages/Hub/Hub'
import Cordinacion from './Pages/menuB2B/Cordinacion/Cordinacion'
import DetalleTecnico from './Pages/menuB2B/ProductividadTecnicos/DetalleTecnico'
import EstadisticasProductividad from './Pages/menuB2B/RankProductividadTecnicos/EstadisticasProductividad'
import NotFound from './Pages/NotFound/NotFound'

import GenericModuleWrapper from './router/GenericModuleWrapper'
import { MODULE_REGISTRY } from './router/moduleRegistry'
import { usePermissions } from './Hooks/usePermissions'
import { Role } from './config/roles'
import Loader from './Components/common/Loader'

// ─── UrlSelectionSync ─────────────────────────────────────────────────────────
/**
 * Componente funcional sin renderizado visual que sincroniza parámetros de la URL 
 * hacia el contexto global (SelectionContext).
 * 
 * Uso principal: Si un usuario hace clic en "Abrir en nueva pestaña" sobre un enlace
 * que incluye la región o delegación por query params (`?TR=...&mainplant=...`), 
 * este componente captura esos datos, los guarda en el contexto de la nueva pestaña, 
 * y luego limpia la URL para mantenerla limpia y amigable.
 */
function UrlSelectionSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRegion, selectedDelegations, setSelectedRegion, setSelectedDelegations } = useSelection();

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    let changed = false

    const tr = params.get('TR') || params.get('f');
    if (tr && tr !== selectedRegion) {
      setSelectedRegion(tr);
      params.delete('TR');
      params.delete('f');
      changed = true;
    }

    const mps = params.get('mainplant') || params.get('mps');
    if (mps && mps !== selectedDelegations) {
      setSelectedDelegations(mps);
      params.delete('mainplant');
      params.delete('mps');
      changed = true;
    }

    if (changed) {
      const newSearch = params.toString()
      navigate(location.pathname + (newSearch ? `?${newSearch}` : ''), { replace: true })
    }
  }, [location.search, navigate, setSelectedRegion, setSelectedDelegations, selectedRegion, selectedDelegations]);

  return null
}

/**
 * Componente principal de enrutamiento. 
 * Se encarga de mapear tanto las rutas fijas como de generar dinámicamente las rutas 
 * a las que tiene acceso el usuario, basándose en la configuración enviada por el backend.
 */
function AppRoutes() {
  const { user, loading } = useAuth()
  const { canAccessVista } = usePermissions()

  /**
   * Generamos las rutas dinámicas filtrando por los permisos reales del usuario.
   * Por cada vista que el usuario tiene permitida (user.menuConfig.vistaUrls),
   * se busca su configuración equivalente en el MODULE_REGISTRY.
   */
  const dynamicRoutes = useMemo(() => {
    if (!user?.menuConfig?.vistaUrls) return []

    const allUrls = user.menuConfig.vistaUrls || []

    return allUrls
      .map(({ url, vista_codigo }) => {
        // Verificar doblemente que tenga permisos para esta vista
        if (!canAccessVista(vista_codigo)) return null

        // Extraer la configuración del componente desde el registro local de React
        const config = MODULE_REGISTRY[vista_codigo]
        if (!config) return null

        // Asegurarse de que el path de la ruta inicie con "/" y no tenga query params
        const rawPath = url.split('?')[0]
        const routePath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`

        return { routePath, config }
      })
      // Filtrar elementos nulos para tener un array limpio de configuraciones
      .filter((r): r is { routePath: string; config: (typeof MODULE_REGISTRY)[string] } => r !== null)
  }, [user, canAccessVista])

  if (loading) {
      return <Loader />;
  }

  return (
    <Routes>
      <Route element={<MenuLayout />}>
        {/* Rutas Públicas */}
        <Route path='/' element={<Login />} />

        {/* Rutas Protegidas (requieren autenticación) */}
        <Route element={<ProtectedRoute />}>
          {/* El hub principal a donde los usuarios son redirigidos tras el login */}
          <Route path='/hub' element={<Hub />} />

          {/* Rutas fijas (aquellas que no se generan automáticamente desde la configuración del menú del backend) */}
          <Route path='/cordinacion' element={<Cordinacion />} />

          {/* Rutas Protegidas por Rol Específico — Restringidas a Admins o Coordinadores */}
          <Route element={<ProtectedRoute requiredRole={[Role.ADMIN, Role.COORDINADOR]} />}>
            <Route path='/RegistroTecnico/:codigo' element={<DetalleTecnico />} />
            <Route path='/estadisticas-productividad' element={<EstadisticasProductividad />} />
          </Route>

          {/* Renderizado de Rutas Dinámicas generadas desde menuConfig del usuario */}
          {dynamicRoutes.map(({ routePath, config }) => (
            <Route
              key={routePath}
              path={routePath}
              // El GenericModuleWrapper se encarga de instanciar el componente real (ej. VistaAverias, Productividad, etc.) 
              // pasándole las props por defecto según el registro.
              element={<GenericModuleWrapper {...config} />}
            />
          ))}
        </Route>

        {/* Ruta comodín (Catch-all) para páginas no encontradas (404) */}
        <Route path='*' element={<NotFound />} />
      </Route>
    </Routes>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
/**
 * Raíz de la aplicación React.
 * Contiene los proveedores de contexto globales y establece listeners genéricos de interacción.
 */
function App() {
  /* 
   * Listener global de utilidad visual: Quita el foco (blur) de los botones al hacer clic 
   * para evitar el contorno (anillo) de focus persistente que algunos navegadores aplican
   * tras la interacción con ratón.
   */
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest('button')
      if (button) button.blur()
    }
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [])

  return (
    // SelectionProvider provee el estado global sobre regiones y delegaciones a toda la app
    <SelectionProvider>
      <UrlSelectionSync />
      <AppRoutes />
    </SelectionProvider>
  )
}

export default App
  