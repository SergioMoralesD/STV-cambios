/**
 * Calcula la distancia en Km entre dos puntos geográficos
 */
export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const rad = (x: number) => (x * Math.PI) / 180;
  const R = 6378.137;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) *
    Math.cos(rad(lat2)) *
    Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return parseFloat(
    (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(3),
  );
}

/**
 * Obtiene coordenadas predefinidas por isla
 */
export function getIslandCoordinates(isla: string | null): {
  coords: [number, number];
  zoom: number;
} {
  switch (isla) {
    case "6S21":
      return { coords: [28.2322506, -16.5628937], zoom: 11.4 };
    case "6S23":
      return { coords: [27.9246, -15.573], zoom: 11.4 };
    case "6S24":
      return { coords: [29.01, -13.641], zoom: 11.4 };
    case "6S25":
      return { coords: [28.33333, -14.02], zoom: 10.4 };
    case "6E21":
      return { coords: [39.6014325, 2.9291915], zoom: 10.6 };
    case "6E22":
      return { coords: [38.8181828, 1.3905505], zoom: 11.19 };
    case "6E23":
      return { coords: [39.9493157, 3.9890744], zoom: 12 };
    default:
      return { coords: [27.839902, -17.947699], zoom: 11.4 };
  }
}
  