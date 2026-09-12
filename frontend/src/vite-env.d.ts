declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
declare module '*.scss';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';

declare module 'react-leaflet' {
  export const MapContainer: any;
  export const TileLayer: any;
  export const Marker: any;
  export const Popup: any;
  export const Polyline: any;
  export const CircleMarker: any;
  export const Tooltip: any;
  export const useMap: any;
  export const useMapEvents: any;
}

interface ImportMeta {
  env: Record<string, string | undefined>;
}
