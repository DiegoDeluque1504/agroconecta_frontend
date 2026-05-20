import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { GuestExplorationService } from '../services/guest-exploration.service';


// Guard para rutas SEMI-PÚBLICAS: deja pasar siempre, pero el componente
// puede saber si hay sesión activa leyendo auth.estaAutenticado()
export const optionalAuthGuard: CanActivateFn = () => true;

// Guard para rutas PRIVADAS: solo deja pasar si el usuario está autenticado
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const guest = inject(GuestExplorationService);

  if (auth.estaAutenticado()) return true;

  const queryParams = guest.enModoRestringido() ? { reason: 'guest_limit' } : {};
  router.navigate(['/auth/login'], { queryParams });
  return false;
};

// Guard para rutas PÚBLICAS: solo deja pasar si NO está autenticado
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.estaAutenticado()) return true; // No tiene sesión, puede ver el login

  router.navigate(['/catalogo']);
  return false;
};

// Guard para rutas EXCLUSIVAS DE PRODUCTORES: redirige al catálogo si es comprador
// Uso: { path: 'mis-productos', canActivate: [authGuard, producerGuard], ... }
export const producerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.esProductor()) return true; // Es productor, puede entrar

  // Es comprador: no tiene acceso a estas secciones
  router.navigate(['/catalogo']);
  return false;
};

/**
 * Rutas públicas de exploración (catálogo, detalle de producto).
 * Si el visitante agotó su cuota anónima, redirige a login/registro.
 */
export const guestExplorationGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const guest = inject(GuestExplorationService);
  const router = inject(Router);

  if (auth.estaAutenticado()) return true;
  if (!guest.enModoRestringido()) return true;

  router.navigate(['/auth/login'], { queryParams: { reason: 'guest_limit' } });
  return false;
};
