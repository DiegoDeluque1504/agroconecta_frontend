import { Injectable } from '@angular/core';

const STORAGE_KEY = 'guest_exploration_restricted';

export const GUEST_EXPLORATION_MESSAGE =
  'Has alcanzado el límite de exploración para usuarios invitados. ' +
  'Para continuar usando la plataforma, inicia sesión o crea una cuenta.';

@Injectable({ providedIn: 'root' })
export class GuestExplorationService {
  /** Marca al visitante como en modo restringido (cuota de exploración agotada). */
  activarModoRestringido(): void {
    sessionStorage.setItem(STORAGE_KEY, '1');
  }

  /** Quita el modo restringido (p. ej. tras iniciar sesión). */
  limpiarModoRestringido(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  /** True si el visitante anónimo agotó su cuota de exploración. */
  enModoRestringido(): boolean {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  }
}

export function isGuestExplorationLimitError(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { code?: string }).code === 'guest_exploration_limit'
  );
}
