# Documentación - Portal B2B STV

Esta documentación explica cómo funciona el servidor del Portal B2B, su estructura, seguridad y los módulos principales.


## 1. Cómo está construido el sistema

El servidor está hecho con Node.js y TypeScript, usando NestJS como organización del código y Fastify como motor para que sea rápido.

- Base de datos: SQLite (archivo local, no necesita instalación)
- Seguridad: Cookies seguras, contraseñas protegidas y validación de acceso
- Registros: Guarda toda la actividad y los errores en archivos y base de datos


## 2. Base de datos

La base de datos (portalb2b.db) guarda toda la información del sistema en tablas relacionadas entre sí.

### Tablas principales:
- usuarios: Guarda los datos de cada usuario, su contraseña y estado de la cuenta
- roles: Define los tipos de acceso (Admin, Coordinador, Técnico, etc.) y cuánto dura su sesión
- sesiones: Controla quién tiene sesión abierta, desde qué IP y hasta cuándo
- vistas: Catálogo de las pantallas del sistema (Averías, SLAs, etc.)
- regiones y delegaciones: Organización geográfica de la empresa
- permisos_acceso: Relaciona qué rol puede acceder a qué vista en cada región y delegación


## 3. Seguridad y acceso

### Cómo se inicia sesión
1. Antes de validar, el sistema comprueba que el usuario o su IP no estén bloqueados por muchos intentos fallidos
2. Verifica la contraseña contra la guardada en base de datos
3. Si es correcta, crea una sesión con un token único de 64 bytes
4. El token se guarda en una cookie segura que el navegador no puede leer con JavaScript

### Cómo se validan las peticiones
Todas las rutas protegidas pasan por un filtro que:
1. Extrae el token de la cookie
2. Verifica que la sesión siga activa y no haya expirado
3. Comprueba que la IP y el navegador sean los mismos que iniciaron sesión (antirrobo de sesión)
4. Carga los permisos del usuario en la petición


## 4. Control de permisos (RBAC)

El acceso no es simplemente "usuario normal o administrador". Es más detallado:

Un usuario puede acceder a una pantalla (por ejemplo, Averías) solo si su rol tiene permiso para esa pantalla en una región y delegación concreta.

- Cada usuario se identifica con un código único que lo vincula con los sistemas externos
- Al iniciar sesión, el servidor calcula todos los permisos del usuario y se los envía al navegador para que muestre solo lo que puede ver y hacer


## 5. Módulos del sistema

### Pedidos de Repuestos
Permite enviar solicitudes de materiales.
- Envía correos mediante SMTP con una plantilla HTML profesional
- En modo prueba, los correos se capturan y se pueden previsualizar sin enviarlos

### Gestión de Recursos (archivos)
Escanea automáticamente la carpeta de archivos subidos y:
- Clasifica los archivos por tipo (PDF, vídeo, documento)
- Asigna iconos y colores según el tipo
- Los sirve de forma segura al navegador

### Conectividad con sistemas externos
Actúa como puente entre el portal y sistemas externos:
- Averías en tiempo real
- Objetivos y métricas de rendimiento (SLAs)
- Integraciones con sistemas antiguos de la empresa


## 6. Mantenimiento

### Comandos útiles
- Inicializar la base de datos con datos básicos
- Aplicar cambios en la base de datos sin perder información
- Diagnosticar problemas en las tablas de configuración

### Variables de configuración principales
- COOKIE_SECRET: Clave para proteger las cookies
- DATABASE_PATH: Ruta donde está el archivo de base de datos
- CORS_ORIGIN: Lista de dominios permitidos para conectar con el servidor


## 7. Estándares de código
- Las partes que reciben peticiones solo gestionan la entrada y salida de datos
- La lógica del negocio está separada en servicios
- Todas las acciones importantes (inicios de sesión, errores, envíos de correo) quedan registradas tanto en consola como en archivos

