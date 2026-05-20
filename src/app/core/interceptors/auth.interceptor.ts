import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import {
  GuestExplorationService,
  isGuestExplorationLimitError,
} from '../services/guest-exploration.service';

// Mensajes de error globales por código HTTP
const MENSAJES_ERROR: Record<number, string> = {
  400: 'Solicitud incorrecta. Verifica los datos enviados.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'El recurso solicitado no fue encontrado.',
  408: 'La solicitud tardó demasiado. Intenta de nuevo.',
  429: 'Demasiadas solicitudes. Espera un momento.',
  500: 'Error interno del servidor. Intenta más tarde.',
  502: 'El servidor no está disponible. Intenta más tarde.',
  503: 'Servicio temporalmente no disponible.',
};

function esRutaAuthFrontend(): boolean {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');
}

function esPeticiónAuthBackend(url: string): boolean {
  return (
    url.includes('/usuarios/login/') ||
    url.includes('/usuarios/registro/') ||
    url.includes('/usuarios/token/refresh/') ||
    url.includes('/usuarios/verificar-email/') ||
    url.includes('/usuarios/municipios/')
  );
}

// Interceptor funcional de Angular: se ejecuta en CADA petición HTTP automáticamente
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const guest = inject(GuestExplorationService);
  const router = inject(Router);
  const token = auth.token();

  const reqAutenticado = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(reqAutenticado).pipe(
    catchError((error: HttpErrorResponse) => {
      const esRutaAuth = esPeticiónAuthBackend(req.url);

      // ── Modo restringido: cuota de exploración anónima agotada ─────────
      if (
        !auth.estaAutenticado() &&
        (isGuestExplorationLimitError(error.error) ||
          error.headers.get('X-Guest-Restricted') === 'true')
      ) {
        guest.activarModoRestringido();
        if (!esRutaAuth && !esRutaAuthFrontend()) {
          router.navigate(['/auth/login'], { queryParams: { reason: 'guest_limit' } });
        }
        return throwError(() => error);
      }

      // ── 401: Token expirado → intentar refresh automático ─────────────
      if (error.status === 401 && localStorage.getItem('refresh_token') && !esRutaAuth) {
        return auth.refreshToken().pipe(
          switchMap((resp) => {
            const retry = req.clone({
              setHeaders: { Authorization: `Bearer ${resp.access}` },
            });
            return next(retry);
          }),
          catchError((err) => {
            auth.logout();
            return throwError(() => err);
          })
        );
      }

      // ── 0: Sin conexión con el servidor ────────────────────────────────
      if (error.status === 0) {
        const sinConexion = new HttpErrorResponse({
          error: { detail: 'No se pudo conectar con el servidor. Verifica tu conexión.' },
          status: 0,
          statusText: 'Unknown Error',
          url: error.url ?? undefined,
        });
        return throwError(() => sinConexion);
      }

      // ── Errores con cuerpo estructurado: no sobrescribir ───────────────
      if (
        error.error?.code === 'api_rate_limit' ||
        error.error?.code === 'axes_lockout' ||
        error.error?.code === 'guest_exploration_limit'
      ) {
        return throwError(() => error);
      }

      // ── Enriquece el error con un mensaje legible si no tiene detail ───
      if (error.status >= 400 && !error.error?.detail && !error.error?.error) {
        const mensajeGenerico = MENSAJES_ERROR[error.status] ?? `Error ${error.status}`;
        const enriquecido = new HttpErrorResponse({
          error: { ...error.error, _mensaje: mensajeGenerico },
          status: error.status,
          statusText: error.statusText,
          url: error.url ?? undefined,
        });
        return throwError(() => enriquecido);
      }

      return throwError(() => error);
    })
  );
};
