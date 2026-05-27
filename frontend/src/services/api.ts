const requestCache = new Map<string, { promise: Promise<any>, timestamp: number }>();
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL_PROD || '';

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BACKEND_URL}${cleanEndpoint}`;
  const cacheKey = `${options.method || 'GET'}:${cleanEndpoint}`;

  // Solo cacheamos peticiones GET para evitar duplicados en el ciclo de vida de React
  if (!options.method || options.method === 'GET') {
    const cached = requestCache.get(cacheKey);
    const now = Date.now();
    // Si la misma peticion se hizo hace menos de 1 segundo, retornamos la misma promesa
    if (cached && (now - cached.timestamp < 1000)) {
      return cached.promise;
    }
  }

  const fetchPromise = (async () => {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status} en API ${url}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    return {} as T;
  })();

  if (!options.method || options.method === 'GET') {
    requestCache.set(cacheKey, { promise: fetchPromise, timestamp: Date.now() });
  }

  return fetchPromise;
}
  