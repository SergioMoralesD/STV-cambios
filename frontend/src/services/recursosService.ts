import axios from 'axios';

export interface DynamicResource {
    id: string;
    title: string;
    subtitle: string;
    category: string;
    url: string;
    type: 'view' | 'download' | 'link';
    iconKey: string;
    color: string;
}

/**
 * Obtiene la lista de recursos escaneados automáticamente por el backend
 */
export async function fetchDynamicResources(): Promise<DynamicResource[]> {
    try {
        const response = await axios.get('/recursos-api', {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching dynamic resources:", error);
        return [];
    }
}
  