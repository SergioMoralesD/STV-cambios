# Backend Portal B2B - STV (NestJS)

Este es el núcleo del Portal B2B de STV, una API de alto rendimiento construida con **NestJS** y **Fastify**.

> [!NOTE]
> Para una guía detallada sobre la arquitectura, seguridad y módulos, consulta la [Documentación Técnica Completa](./DOCUMENTATION.md).

---

## 📂 Estructura del Proyecto

### Directorio Principal (`/backend`)
- **`.env`**: Configuración de variables de entorno (Puertos, SMTP, APIs, CORS).
- **`portalb2b.db`**: Base de datos SQLite local.
- **`src/`**: Código fuente principal estructurado por módulos.
- **`uploads/recursos/`**: Carpeta donde se almacenan manuales, vídeos y guías técnicas para los técnicos.

---

## 🛠️ Módulos Principales (`/src`)

1.  **Auth (`/auth`)**:
    - Seguridad basada en **HttpOnly Cookies** para mitigar ataques XSS.
    - Guardias globales y locales (`AuthGuard`) para proteger rutas sensibles.
    - Control de intentos fallidos (Anti-Brute Force).
2.  **Roles (`/roles`)**:
    - Sistema **RBAC (Role-Based Access Control)**.
    - Configuración granular de permisos por Región, Vista (Módulo) y Delegación.
    - Gestión de tiempos de expiración de sesión por rol.
3.  **Users (`/users`)**:
    - Gestión de perfiles de usuario.
    - Estandarización de identificación mediante `codigo_usuario` (anteriormente `cod_tecnico`).
4.  **Orders (`/orders`) & Mail (`/mail`)**:
    - Gestión del flujo de **Pedidos de Repuestos**.
    - Servicio de correo mediante SMTP con soporte para previsualización en Ethereal en entornos de test.
5.  **Recursos (`/recursos`)**:
    - Escaneo automático y dinámico de la carpeta `uploads/recursos`.
    - Clasificación inteligente de archivos (PDFs, Vídeos, Documentos) con metadatos para el frontend.
6.  **External API (`/external-api`)**:
    - Conector con sistemas externos (VenCloud / AS400).
    - Transformación y normalización de datos de averías y SLAs.
7.  **Database (`/database`)**:
    - Capa de abstracción sobre SQLite con soporte para transacciones y consultas preparadas.
8.  **Logging (`/system-logs` y `/log-accesos`)**:
    - `log-accesos`: Auditoría de inicios de sesión y actividad de usuario.
    - `system-logs`: Registro técnico de errores y eventos del servidor.

---

## 🛡️ Seguridad y Rendimiento

- **Fastify**: Motor de alto rendimiento, hasta 2 veces más rápido que Express.
- **Helmet**: Cabeceras de seguridad HTTP configuradas para proteger contra ataques comunes.
- **CORS**: Configuración dinámica mediante variables de entorno.
- **ValidationPipe**: Validación estricta de tipos y estructura de datos en todas las entradas (DTOs).

---

## 🚀 Comandos Útiles

- **`npm run dev`**: Inicia el servidor en modo desarrollo con recarga automática.
- **`npm run build`**: Compila el código TypeScript a JavaScript (dist).
- **`npm run start:prod`**: Ejecuta la aplicación compilada en producción.
- **`node migrate_db.js`**: Ejecuta migraciones estructurales de la base de datos.

---

## ⚙️ Configuración (.env)

Es necesario configurar los siguientes parámetros:

```env
PORT=3000
BACKEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173

# Base de Datos y Seguridad
COOKIE_SECRET=tu_secreto_aleatorio

# SMTP (Configuración de Correo)
MAIL_HOST=smtp.ejemplo.com
MAIL_PORT=465
MAIL_USER=usuario@ejemplo.com
MAIL_PASS=contraseña_segura
MAIL_FROM="Portal B2B" <no-reply@stv.es>

# APIs Externas
EXTERNAL_API_URL=https://api.externa.com
SLA_OBJETIVO_API_URL=https://api.sla.com
```

---
---  