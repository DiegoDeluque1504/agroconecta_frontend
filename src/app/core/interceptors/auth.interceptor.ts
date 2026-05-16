import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

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

// Interceptor funcional de Angular: se ejecuta en CADA petición HTTP automáticamente
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  // Si hay token, clona la petición y agrega el header Authorization
  // Si no hay token, deja pasar la petición sin modificar (ej: login, registro)
  const reqAutenticado = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(reqAutenticado).pipe(
    catchError((error: HttpErrorResponse) => {

      // No intentar refresh en rutas de autenticación (evita bucle en login/registro)
      const esRutaAuth =
        req.url.includes('/usuarios/login/') ||
        req.url.includes('/usuarios/registro/') ||
        req.url.includes('/usuarios/token/refresh/') ||
        req.url.includes('/usuarios/verificar-email/');

      // ── 401: Token expirado → intentar refresh automático ─────────────
      if (error.status === 401 && localStorage.getItem('refresh_token') && !esRutaAuth) {
        return auth.refreshToken().pipe(
          switchMap((resp) => {
            // Reintenta la petición original con el nuevo access_token
            const retry = req.clone({
              setHeaders: { Authorization: `Bearer ${resp.access}` },
            });
            return next(retry);
          }),
          catchError((err) => {
            // Si el refresh también falla (refresh expirado), cerrar sesión
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

      // ── Enriquece el error con un mensaje legible si no tiene detail ───
      if (error.status >= 400 && !error.error?.detail && !error.error?.error) {
        const mensajeGenerico = MENSAJES_ERROR[error.status] ?? `Error ${error.status}`;
        // Agrega campo _mensaje para que los componentes puedan usarlo
        const enriquecido = new HttpErrorResponse({
          error: { ...error.error, _mensaje: mensajeGenerico },
          status: error.status,
          statusText: error.statusText,
          url: error.url ?? undefined,
        });
        return throwError(() => enriquecido);
      }

      // Para cualquier otro error, propagarlo normalmente
      return throwError(() => error);
    })
  );
};
