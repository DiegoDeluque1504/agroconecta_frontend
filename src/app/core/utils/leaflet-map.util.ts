import type { Map, Marker } from 'leaflet';

export type LeafletModule = typeof import('leaflet');

const LEAFLET_IMAGES = '/leaflet';

/** Carga Leaflet solo en el navegador. */
export async function cargarLeaflet(): Promise<LeafletModule> {
  return import('leaflet');
}

/** Íconos servidos desde el build (evita CDN bloqueados en producción). */
export function configurarIconosLeaflet(L: LeafletModule): void {
  const iconDefault = L.icon({
    iconUrl: `${LEAFLET_IMAGES}/marker-icon.png`,
    iconRetinaUrl: `${LEAFLET_IMAGES}/marker-icon-2x.png`,
    shadowUrl: `${LEAFLET_IMAGES}/marker-shadow.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  L.Marker.prototype.options.icon = iconDefault;
}

/** Capa base (CARTO + OSM; HTTPS y buen soporte en móvil). */
export function agregarCapaMapa(L: LeafletModule, mapa: Map): void {
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(mapa);
}

export interface CrearMapaOpciones {
  lat: number;
  lng: number;
  zoom?: number;
  zoomControl?: boolean;
  dragging?: boolean;
}

/** Crea el mapa en un contenedor DOM ya visible. */
export async function crearMapaLeaflet(
  contenedor: HTMLElement,
  opciones: CrearMapaOpciones,
): Promise<{ L: LeafletModule; mapa: Map }> {
  const L = await cargarLeaflet();
  configurarIconosLeaflet(L);

  const mapa = L.map(contenedor, {
    zoomControl: opciones.zoomControl ?? true,
    dragging: opciones.dragging ?? true,
  }).setView([opciones.lat, opciones.lng], opciones.zoom ?? 10);

  agregarCapaMapa(L, mapa);

  // Tras layout / @if de Angular, Leaflet a veces queda en gris hasta invalidateSize
  requestAnimationFrame(() => {
    mapa.invalidateSize();
    requestAnimationFrame(() => mapa.invalidateSize());
  });

  return { L, mapa };
}

/**
 * Espera a que el contenedor exista en el DOM (p. ej. dentro de @if).
 * Reintenta con rAF para producción y móvil.
 */
export function cuandoContenedorMapaListo(
  obtenerContenedor: () => HTMLElement | null | undefined,
  callback: (el: HTMLElement) => void,
  maxIntentos = 30,
): void {
  let intentos = 0;

  const intentar = (): void => {
    const el = obtenerContenedor();
    if (el) {
      callback(el);
      return;
    }
    if (intentos >= maxIntentos) return;
    intentos += 1;
    requestAnimationFrame(intentar);
  };

  requestAnimationFrame(intentar);
}

export function crearMarcador(
  L: LeafletModule,
  mapa: Map,
  lat: number,
  lng: number,
  popup?: string,
): Marker {
  const marcador = L.marker([lat, lng]).addTo(mapa);
  if (popup) {
    marcador.bindPopup(popup).openPopup();
  }
  return marcador;
}
