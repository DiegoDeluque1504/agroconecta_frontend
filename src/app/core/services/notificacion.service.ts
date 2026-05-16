import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Notificacion, ConteoNotificaciones } from '../models/index';

const API = 'http://localhost:8000/api/v1';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private http = inject(HttpClient);

  // Signal global con el conteo de no leídas (lo usa el header para el badge)
  noLeidas = signal(0);

  // GET /notificaciones/ — lista completa del usuario
  getMisNotificaciones(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${API}/notificaciones/`);
  }

  // GET /notificaciones/no-leidas/ — solo el número de no leídas
  getConteo(): Observable<ConteoNotificaciones> {
    return this.http.get<ConteoNotificaciones>(`${API}/notificaciones/no-leidas/`).pipe(
      tap((r) => this.noLeidas.set(r.no_leidas))
    );
  }

  // POST /notificaciones/{id}/leer/ — marca una notificación como leída
  marcarLeida(id: number): Observable<Notificacion> {
    return this.http.post<Notificacion>(`${API}/notificaciones/${id}/leer/`, {}).pipe(
      tap(() => this.noLeidas.update((n) => Math.max(0, n - 1)))
    );
  }

  // POST /notificaciones/leer-todas/ — marca todas como leídas
  marcarTodasLeidas(): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${API}/notificaciones/leer-todas/`, {}).pipe(
      tap(() => this.noLeidas.set(0))
    );
  }
}
