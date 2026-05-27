# Frontend Portal B2B - STV (React + Vite)

Esta es la interfaz de usuario del Portal B2B de STV, una aplicación web moderna.

> [!NOTE]
> Para una guía detallada sobre la arquitectura, gestión de estados y el sistema de enrutamiento dinámico, consulta la [Documentación Técnica Completa](./DOCUMENTATION.md).

---

## 🚀 Tecnologías Principales

- **React 18** + **TypeScript**: Tipado estricto y componentes funcionales.
- **Vite**: Herramienta de construcción ultra-rápida.
- **TailwindCSS**: Diseño responsive y moderno sin CSS personalizado excesivo.
- **React Router Dom 6**: Gestión de navegación dinámica y protegida.
- **Lucide React**: Set de iconos premium y consistentes.
- **Context API**: Gestión de estado global (Autenticación y Selecciones).

---

## 🛠️ Características Clave

1.  **Enrutamiento Dinámico**: Las rutas se generan automáticamente basándose en los permisos que el backend devuelve al iniciar sesión.
2.  **Sistema de Permisos (RBAC)**: Control granular de qué módulos, regiones y delegaciones puede ver cada usuario.
3.  **Selection Context**: Sincronización inteligente de la región e isla seleccionada en toda la aplicación.
4.  **UrlSelectionSync**: Permite compartir enlaces o abrir en nuevas pestañas manteniendo el estado de selección sin ensuciar la URL permanentemente.
5.  **Componentes Reutilizables**: Gran biblioteca de componentes "common" para tablas, modales, cargadores y selectores.

---

## 📂 Estructura del Proyecto

- **`src/Components`**: Componentes visuales organizados por módulos y componentes comunes.
- **`src/Context`**: Proveedores de estado global (Auth y Selección).
- **`src/Hooks`**: Lógica reutilizable (permisos, fetch de datos, etc.).
- **`src/Pages`**: Páginas de la aplicación, incluyendo el `Hub` (Menú Principal) y el `Login`.
- **`src/router`**: El corazón del enrutamiento dinámico (`moduleRegistry` y `GenericModuleWrapper`).

---

## 🔧 Comandos Útiles

- **`npm run dev`**: Inicia el servidor de desarrollo (por defecto en `http://localhost:5173`).
- **`npm run build`**: Genera el bundle optimizado para producción en la carpeta `/dist`.
- **`npm run preview`**: Previsualiza la build de producción localmente.
- **`npm run lint`**: Ejecuta el linter para asegurar la calidad del código.

---

## ⚙️ Configuración (.env)

Asegúrate de configurar el archivo `.env` en la raíz:

```env
VITE_BACKEND_URL=http://localhost:3000
```

---

> [!TIP]
> Para una explicación profunda sobre cómo añadir nuevos módulos o cómo funciona la inyección de permisos, consulta la [Documentación Técnica Detallada](./DOCUMENTATION.md).

---
---  