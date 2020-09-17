const maybeValueOrError = <T>(value: T, errorMessage?: string): T => {
  if (value) {
    return value;
  } else {
    throw new Error(errorMessage);
  }
}

export const MAPBOX_API_KEY = maybeValueOrError(process.env.MAPBOX_API_KEY, 'Missing Mapbox API key!');
export const MAPBOX_SOURCE_DATASET = maybeValueOrError(process.env.MAPBOX_SOURCE_DATASET, 'Missing source Mapbox dataset!');

export const SALE_START_YEAR = 2015;
export const CURRENT_YEAR = new Date().getFullYear();

export const MAP_ICON_SIZE = 3;
