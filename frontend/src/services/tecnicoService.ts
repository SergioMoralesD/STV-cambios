import axios from 'axios';

/**
 * Obtiene la información de un técnico (petición 79).
 * Devuelve un objeto con CODIGO_AREA (mainplant), NOMBRE_EMPLEADO, etc.
 */
export async function fetchTecnicoInfo(codTecnico: string) {
    const response = await axios.get(`/external-api/tecnico-info?codTecnico=${codTecnico}`, {
        withCredentials: true,
    });
    return response.data;
}

/**
 * Obtiene el listado de averías de un técnico específico en una delegación (petición 98).
 */
export async function fetchAveriasTecnico(mainplant: string, codTecnico: string) {
    const response = await axios.get(`/external-api/averias-tecnico?mainplant=${mainplant}&codTecnico=${codTecnico}`, {
        withCredentials: true,
    });
    return response.data;
}
  