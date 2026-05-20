import * as L from 'leaflet';
import type { Map, Marker } from 'leaflet';

export type LeafletModule = typeof L;

const LEAFLET_IMAGES = '/leaflet';

/** Íconos servidos desde el build (evita CDN bloqueados en producción). */
export function configurarIconosLeaflet(leaflet: LeafletModule = L): void {
  const iconDefault = leaflet.icon({
    iconUrl: `${LEAFLET_IMAGES}/marker-icon.png`,
    iconRetinaUrl: `${LEAFLET_IMAGES}/marker-icon-2x.png`,
    shadowUrl: `${LEAFLET_IMAGES}/marker-shadow.png`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  leaflet.Marker.prototype.options.icon = iconDefault;
}

/** Capa base (CARTO + OSM; HTTPS y buen soporte en móvil). */
export function agregarCapaMapa(leaflet: LeafletModule, mapa: Map): void {
  leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
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
export function crearMapaLeaflet(
  contenedor: HTMLElement,
  opciones: CrearMapaOpciones,
): { L: LeafletModule; mapa: Map } {
  configurarIconosLeaflet();

  const mapa = L.map(contenedor, {
    zoomControl: opciones.zoomControl ?? true,
    dragging: opciones.dragging ?? true,
  }).setView([opciones.lat, opciones.lng], opciones.zoom ?? 10);

  agregarCapaMapa(L, mapa);

  const refrescarTamano = (): void => {
    mapa.invalidateSize({ animate: false });
  };

  requestAnimationFrame(refrescarTamano);
  setTimeout(refrescarTamano, 100);
  setTimeout(refrescarTamano, 400);

  return { L, mapa };
}

/**
 * Espera a que el contenedor exista (p. ej. dentro de @if de Angular).
 * Usa id DOM porque ViewChild a menudo llega tarde en producción.
 */
export function cuandoContenedorMapaListo(
  obtenerContenedor: () => HTMLElement | null | undefined,
  callback: (el: HTMLElement) => void,
  maxIntentos = 60,
): void {
  let intentos = 0;

  const intentar = (): void => {
    const el = obtenerContenedor();
    if (el) {
      const tieneAltura = el.getBoundingClientRect().height > 0;
      if (tieneAltura || intentos >= 15) {
        callback(el);
        return;
      }
    }

    if (intentos >= maxIntentos) return;
    intentos += 1;
    requestAnimationFrame(intentar);
  };

  requestAnimationFrame(intentar);
  // Respaldo por si rAF no alcanza tras el @if de Angular
  setTimeout(() => {
    const el = obtenerContenedor();
    if (el) callback(el);
  }, 500);
}

export function crearMarcador(
  leaflet: LeafletModule,
  mapa: Map,
  lat: number,
  lng: number,
  popup?: string,
): Marker {
  const marcador = leaflet.marker([lat, lng]).addTo(mapa);
  if (popup) {
    marcador.bindPopup(popup).openPopup();
  }
  return marcador;
}
