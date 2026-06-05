# Documentación Técnica - Backend Portal B2B STV

Esta documentación detalla la arquitectura, el diseño de la base de datos, los flujos de seguridad y los módulos funcionales que componen el backend del Portal B2B.

---

## 1. Arquitectura del Sistema

El backend está construido sobre **NestJS**, un framework progresivo de Node.js, utilizando **Fastify** como motor HTTP para maximizar el rendimiento.

-   **Lenguaje**: TypeScript.
-   **Motor de Base de Datos**: SQLite (vía `better-sqlite3`).
-   **Seguridad**: HttpOnly Cookies, Argon2 (hashing), Helmet, Guardias de acceso.
-   **Logs**: Sistema dual de logs (actividad en DB + errores técnicos en archivos).

---

## 2. Modelo de Datos (Base de Datos)

La base de datos (`portalb2b.db`) sigue un esquema relacional diseñado para la flexibilidad de permisos y configuraciones dinámicas.

### Tablas Principales:
-   **`usuarios`**: Almacena credenciales, estados de cuenta y vinculación con roles.
-   **`roles`**: Define los niveles de acceso (Admin, Coordinador, Técnico, etc.) y tiempos de sesión.
-   **`sesiones`**: Controla los tokens activos, IPs de origen y expiración.
-   **`vistas`**: Catálogo de módulos funcionales del sistema (Averías, SLAs, etc.).
-   **`regiones`** y **`delegaciones`**: Estructura geográfica de la organización.
-   **`permisos_acceso`**: Tabla pivot que define exactamente qué combinación de **Rol + Región + Vista + Delegación** está permitida.

---

## 3. Seguridad y Autenticación

### Flujo de Inicio de Sesión
1.  **Protección Anti-Brute Force**: Antes de validar, se comprueba si el usuario o la IP están bloqueados por intentos fallidos recientes.
2.  **Validación**: Se verifica la contraseña usando **Argon2**.
3.  **Generación de Sesión**: Se crea un token aleatorio de 64 bytes persistido en la tabla `sesiones`.
4.  **Cookie HttpOnly**: El token se envía al cliente en una cookie `Set-Cookie` con los flags `HttpOnly`, `Secure` y `SameSite=Strict`.

### Validación de Peticiones (`AuthGuard`)
Todas las rutas protegidas pasan por el `AuthGuard`, que:
1.  Extrae el token de la cookie.
2.  Verifica que la sesión exista, esté activa y no haya expirado.
3.  Comprueba el **Session Hijacking**: Valida que la IP y el User-Agent coincidan con los que originaron la sesión.
4.  Inyecta los permisos del usuario en el objeto `request`.

---

## 4. Sistema RBAC (Role-Based Access Control)

El acceso no es binario; es multidimensional. Un usuario tiene acceso a una "Vista" (ej. Averías) solo si su rol tiene un permiso explícito para esa vista en una región y delegación específica.

-   **Standardización**: Se utiliza `codigo_usuario` como identificador único para vincular datos técnicos externos.
-   **Permisos Dinámicos**: Al validar la sesión, el backend calcula el mapa completo de permisos, lo que permite al frontend renderizar el menú y las acciones de forma dinámica.

---

## 5. Módulos Específicos

### 📦 Pedidos de Repuestos (`Orders` & `Mail`)
Gestiona el envío de solicitudes de materiales.
-   **Servicio de Mail**: Configurado para usar SMTP corporativo. Incluye una plantilla HTML profesional que replica el formato histórico de la empresa.
-   **Testing**: En modo desarrollo, los correos se capturan y previsualizan mediante enlaces de Ethereal.

### 📂 Gestión de Recursos (`Recursos`)
Este módulo es "Zero-Config". Escanea recursivamente el directorio `uploads/recursos` y:
-   Genera metadatos dinámicos (tipo de archivo, iconos de Lucide, colores).
-   Sirve archivos estáticos de forma segura.
-   Organiza los archivos por categorías basadas en la estructura de carpetas física.

### 🌐 Conectividad Externa (`External API`)
Actúa como un Proxy/Transformador para:
-   **VenCloud**: Obtención de averías en tiempo real.
-   **API SLAs**: Consulta de objetivos y métricas de rendimiento.
-   **AS400**: Integraciones heredadas para datos maestros.

---

## 6. Mantenimiento y Comandos

### Scripts de Utilidad
-   `node setup.js`: Inicializa la base de datos con el esquema base y datos maestros.
-   `node migrate_db.js`: Aplica cambios estructurales sin perder datos existentes.
-   `node check_db.js`: Herramienta de diagnóstico para verificar la integridad de las tablas de configuración.

### Variables de Entorno Clave
-   `COOKIE_SECRET`: Firma las cookies para evitar manipulaciones.
-   `DATABASE_PATH`: Ruta al archivo `.db` (por defecto `portalb2b.db`).
-   `CORS_ORIGIN`: Lista blanca de dominios permitidos para conectar al API.

---

## 7. Estándares de Código
-   **Controladores**: Solo gestionan la entrada/salida y validación (DTOs).
-   **Servicios**: Contienen la lógica de negocio pura y acceso a datos.
-   **Logger**: Todas las acciones críticas (Login, Errores, Envío de Mail) deben quedar registradas tanto en consola como en archivo mediante el `fileLog` de `/utils/logger`.

---
---  