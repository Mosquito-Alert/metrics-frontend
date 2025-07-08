import { useMapStore } from '../stores/mapStore';
import { adjustSaturation } from '../utils/colorConversor';

export const ANOMALY_COLORS = {
  USUAL_LIGHT: '#EEF4EF',
  USUAL: '#5BBA6F',
  LOW: '#85b0d5BE',
  HIGH: '#ff795b',
};

// HIGHLIGHT ALL VALUES
export const VALUE_COLOR_ALL_STOPS = [
  { min: 0.0, max: 0.15, start: '#A9DFBF', end: '#7DCEA0' },
  { min: 0.15, max: 0.3, start: '#7DCEA0', end: '#D5E87A' },
  { min: 0.3, max: 0.45, start: '#D5E87A', end: '#E7D47A' },
  { min: 0.45, max: 0.6, start: '#E7D47A', end: '#E5B93F' },
  { min: 0.6, max: 0.75, start: '#E5B93F', end: '#E74C3C' },
  { min: 0.75, max: 0.9, start: '#E74C3C', end: '#8a2a0a' },
  { min: 0.9, max: 1.0, start: '#8a2a0a', end: '#6d250d' },
];

// HIGHLIGHT HIGH VALUES
export const VALUE_COLOR_HIGH_STOPS = [
  { min: 0.0, max: 0.15, start: '#ffffff', end: '#fef0d9' },
  { min: 0.15, max: 0.3, start: '#fef0d9', end: '#fdd49e' },
  { min: 0.3, max: 0.45, start: '#fdd49e', end: '#fdbb84' },
  { min: 0.45, max: 0.6, start: '#fdbb84', end: '#fc8d59' },
  { min: 0.6, max: 0.75, start: '#fc8d59', end: '#e34a33' },
  { min: 0.75, max: 1.0, start: '#e34a33', end: '#b30000' },
];

// HIGHLIGHT CONTRAST VALUES
export const VALUE_COLOR_CONTRAST_STOPS = [
  { min: 0.0, max: 0.2, start: '#08306b', end: '#2171b5' },
  { min: 0.2, max: 0.4, start: '#2171b5', end: '#deebf7' },
  { min: 0.4, max: 0.5, start: '#deebf7', end: '#ffffff' },
  { min: 0.5, max: 0.6, start: '#ffffff', end: '#fee0d2' },
  { min: 0.6, max: 0.8, start: '#fee0d2', end: '#fb6a4a' },
  { min: 0.8, max: 1.0, start: '#fb6a4a', end: '#67000d' },
];

export enum LayerStyleEnum {
  ALL = 'all',
  HIGH = 'high',
  CONTRAST = 'contrast',
  GRAY = 'gray',
}

export const LayerStyleNames: Record<LayerStyleEnum, string> = {
  [LayerStyleEnum.ALL]: 'mosquitoalert:metricstyle-green-red',
  [LayerStyleEnum.HIGH]: 'mosquitoalert:metricstyle',
  [LayerStyleEnum.CONTRAST]: 'mosquitoalert:metricstyle-blue-red',
  [LayerStyleEnum.GRAY]: 'mosquitoalert:metricstyle-gray',
};

export const LayerStyleLabels: Record<LayerStyleEnum, string> = {
  [LayerStyleEnum.ALL]: 'Balance',
  [LayerStyleEnum.HIGH]: 'Rise',
  [LayerStyleEnum.CONTRAST]: 'Binary',
  [LayerStyleEnum.GRAY]: 'Gray',
};

export const gradientStops = (layerStyle: LayerStyleEnum = LayerStyleEnum.HIGH): string => {
  const mapStore = useMapStore();
  let stops;
  switch (layerStyle) {
    case LayerStyleEnum.ALL:
      stops = VALUE_COLOR_ALL_STOPS;
      break;
    case LayerStyleEnum.HIGH:
      stops = VALUE_COLOR_HIGH_STOPS;
      break;
    case LayerStyleEnum.CONTRAST:
      stops = VALUE_COLOR_CONTRAST_STOPS;
      break;
    case LayerStyleEnum.GRAY:
      stops = VALUE_COLOR_ALL_STOPS; // Assuming gray uses the same stops as ALL
      break;
    default:
      stops = VALUE_COLOR_ALL_STOPS; // Fallback to ALL
  }
  if (mapStore.showAnomalies) {
    return VALUE_COLOR_HIGH_STOPS.map((range) => {
      const start = adjustSaturation(range.start, 0.0);
      const end = adjustSaturation(range.end, 0.0);
      return `${start} ${(range.min * 100).toFixed(0)}%, ${end} ${(range.max * 100).toFixed(0)}%`;
    }).join(', ');
  }
  return stops
    .map((range) => {
      const start = range.start;
      const end = range.end;
      return `${start} ${(range.min * 100).toFixed(0)}%, ${end} ${(range.max * 100).toFixed(0)}%`;
    })
    .join(', ');
};
