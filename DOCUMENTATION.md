# Documentación Técnica - Portal B2B STV

Documentación de arquitectura, base de datos, seguridad y módulos del backend del Portal B2B.


## 1. Arquitectura del Sistema

El backend está construido con NestJS sobre Node.js y TypeScript, usando Fastify como motor HTTP para alto rendimiento.

- Lenguaje: TypeScript
- Motor de base de datos: SQLite (archivo local, sin servidor externo)
- Seguridad: Cookies HttpOnly, Argon2 para hash de contraseñas, Helmet para cabeceras HTTP seguras
- Logs: Sistema dual (actividad de usuarios en base de datos + errores técnicos en archivos)


## 2. Modelo de Datos

La base de datos (portalb2b.db) sigue un esquema relacional diseñado para permisos flexibles y configuración dinámica.

### Tablas principales:
- usuarios: Credenciales, estado de cuenta y vinculación con roles
- roles: Niveles de acceso (Admin, Coordinador, Técnico) y duración de sesión
- sesiones: Tokens activos, IP de origen y control de expiración
- vistas: Catálogo de módulos funcionales (Averías, SLAs, etc.)
- regiones y delegaciones: Estructura geográfica de la organización
- permisos_acceso: Tabla pivote que relaciona Rol + Región + Vista + Delegación


## 3. Seguridad y Autenticación

### Flujo de inicio de sesión
1. Protección anti-brute force: antes de validar, se comprueba si el usuario o IP están bloqueados por intentos fallidos
2. Validación de contraseña contra el hash almacenado en base de datos
3. Si es correcta, se genera un token aleatorio de 64 bytes y se persiste en la tabla sesiones
4. El token se envía al navegador como cookie HttpOnly con flags Secure y SameSite=Strict

### Validación de peticiones
Todas las rutas protegidas pasan por un guardián de acceso que:
1. Extrae el token de la cookie
2. Verifica que la sesión exista, esté activa y no haya expirado
3. Comprueba que la IP y el User-Agent coincidan con los originales (protección contra robo de sesión)
4. Inyecta los permisos del usuario en la petición


## 4. Sistema RBAC (Control de Acceso por Roles)

El acceso no es binario; es multidimensional. Un usuario accede a una vista (ej. Averías) solo si su rol tiene un permiso explícito para esa vista en una región y delegación concretas.

- Cada usuario se identifica con un código único que vincula datos con sistemas externos
- Al validar la sesión, el backend calcula el mapa completo de permisos y lo envía al frontend para renderizar el menú y las acciones disponibles


## 5. Módulos Funcionales

### Pedidos de Repuestos
Gestión de solicitudes de materiales con envío de correo SMTP y plantilla HTML profesional. En modo desarrollo, los correos se capturan y previsualizan sin enviarse.

### Gestión de Recursos
Módulo zero-config que escanea recursivamente la carpeta de archivos subidos y:
- Genera metadatos dinámicos (tipo de archivo, iconos, colores)
- Sirve archivos estáticos de forma segura
- Organiza por categorías según la estructura de carpetas

### Conectividad Externa
Proxy transformador para sistemas externos:
- API de averías en tiempo real
- API de objetivos y métricas de rendimiento (SLAs)
- Integraciones con sistemas heredados


## 6. Mantenimiento

### Scripts de utilidad
- node setup.js: Inicializa la base de datos con esquema base y datos maestros
- node migrate_db.js: Aplica cambios estructurales sin perder datos
- node check_db.js: Diagnóstico de integridad de tablas de configuración

### Variables de entorno clave
- COOKIE_SECRET: Firma las cookies para evitar manipulaciones
- DATABASE_PATH: Ruta al archivo de base de datos
- CORS_ORIGIN: Lista blanca de dominios permitidos para conectar con la API


## 7. Estándares de Código
- Controladores: Solo gestionan entrada/salida y validación con DTOs
- Servicios: Contienen la lógica de negocio pura y acceso a datos
- Logger: Todas las acciones críticas (login, errores, envío de mail) se registran en consola y archivo

