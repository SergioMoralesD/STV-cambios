# Documentación Técnica - Frontend Portal B2B STV

Esta documentación detalla la arquitectura frontend, la gestión de estados, el sistema de enrutamiento dinámico y los patrones de diseño utilizados en el Portal B2B.

---

## 1. Arquitectura y Patrones

La aplicación sigue un patrón de arquitectura modular basada en componentes de React.

-   **Componentes Funcionales**: Uso exclusivo de hooks para la lógica.
-   **Atomic Design (Simplificado)**: Separación entre componentes de página (`Pages`) y piezas reutilizables (`Components/common`).
-   **Inyección de Dependencias vía Props**: El `GenericModuleWrapper` actúa como un inyector de contexto hacia los módulos individuales.

---

## 2. Gestión de Estado Global (Contexts)

### AuthContext
Gestiona el ciclo de vida de la sesión del usuario.
-   **`user`**: Objeto que contiene los datos del perfil y, crucialmente, el `menuConfig` devuelto por el backend.
-   **`login`/`logout`**: Métodos para interactuar con la API de autenticación.

### SelectionContext
Gestiona lo que el usuario está "mirando" actualmente.
-   **`selectedRegion`**: El código de la región activa (ej: 'C' para Canarias).
-   **`selectedDelegations`**: El código o cadena de códigos de delegaciones (ej: '6S21').
-   **Sincronización**: Utiliza el componente `UrlSelectionSync` en la raíz para capturar parámetros de la URL y persistirlos en el estado sin que permanezcan visibles en la barra de direcciones.

---

## 3. Enrutamiento Dinámico y RBAC

El sistema de rutas no está prefijado, se construye en tiempo de ejecución.

### `moduleRegistry.ts`
Es el inventario central de todos los módulos del sistema. Cada entrada define:
-   **`Component`**: El componente React a renderizar.
-   **`propsMode`**: Cómo debe el wrapper inyectar los datos (ej: `mps`, `mainplant`, `usuario`).
-   **`delegacionesVista`**: La clave de permisos que debe consultar.

### `GenericModuleWrapper.tsx`
Es un componente de alto orden (HOC) que envuelve cada módulo dinámico. Su función es:
1.  Consultar el `SelectionContext`.
2.  Extraer las delegaciones/islas permitidas para el usuario en esa vista específica.
3.  Pasar la información necesaria al componente final mediante props estandarizadas.

---

## 4. Sistema de Permisos (`usePermissions`)

El hook `usePermissions` es el encargado de la lógica de seguridad en el cliente:
-   **`canAccessVista(codigo)`**: Verifica si el usuario tiene permiso para un módulo.
-   **`getDelegacionesForVista(codigo)`**: Devuelve la lista filtrada de islas/delegaciones a las que el usuario tiene acceso real.

---

## 5. Diseño y UX

### Layout Principal (`MenuLayout`)
Proporciona la estructura consistente:
-   **Header**: Contiene el logo, selectores de región/isla, búsqueda global y perfil de usuario.
-   **Main Content**: Área donde se renderizan las páginas.

### Estética Premium
-   **TailwindCSS**: Utilizado para layouts fluidos y componentes modernos.
-   **Glassmorphism**: Efectos de desenfoque y transparencias en modales y paneles.
-   **Animaciones**: Micro-interacciones sutiles para mejorar el feedback visual.

---

## 6. Guía: Añadir un Nuevo Módulo

Para añadir una nueva funcionalidad al Portal:
1.  **Crear la carpeta** en `src/Pages/menuB2B/NuevaFuncionalidad`.
2.  **Desarrollar el componente** principal.
3.  **Registrarlo** en `src/router/moduleRegistry.ts` con un código único (ej: `NUEVAMOD`).
4.  **Backend**: Asegurarse de que el código `NUEVAMOD` exista en la tabla `vistas` y tenga permisos asignados a los roles correspondientes.
5.  ¡Listo! El menú y la ruta se generarán automáticamente para los usuarios autorizados.

---
---

  