import axios from 'axios';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogOptions {
    level?: LogLevel;
    context?: string;
}

/**
 * URL base del backend. 
 * En desarrollo se usa el proxy de Vite (ruta relativa).
 * En producción se puede configurar a través de variables de entorno.
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL_PROD || ''; // Vacío para usar la ruta relativa del proxy/mismo dominio

/**
 * Envía un log al backend para ser guardado en el archivo centralizado
 */
export async function remoteLog(message: unknown, options: LogOptions = {}): Promise<void> {
    const { level = 'INFO', context = 'FRONTEND' } = options;
    const url = `${BACKEND_URL}/system-logs/client`;

    // Solo enviar al backend (limpiamos la consola del navegador)
    try {
        await axios.post(url, {
            level,
            message: typeof message === 'object' ? JSON.stringify(message) : String(message),
            context,
            stack: message instanceof Error ? message.stack : undefined
        }, { withCredentials: true });
    } catch (error) {
        // Fallar silenciosamente si no se puede enviar el log para no interrumpir el flujo del usuario
        console.warn('No se pudo enviar el log al servidor', error);
    }
}
  