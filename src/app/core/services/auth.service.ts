import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { RespuestaLogin, RespuestaRegistro, RespuestaVerificacion, Usuario } from '../models/index';
import { environment } from '../../../environments/environment';
import { GuestExplorationService } from './guest-exploration.service';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AuthService {

  // Signals reactivos: cuando cambian, los componentes se actualizan automáticamente
  private _usuario = signal<Usuario | null>(this.cargarUsuario());
  private _token = signal<string | null>(localStorage.getItem('access_token'));

  // Versiones públicas de solo lectura (los componentes pueden leer pero no modificar)
  usuario = this._usuario.asReadonly();
  token = this._token.asReadonly();

  // Computed: se recalculan automáticamente cuando cambia _token o _usuario
  estaAutenticado = computed(() => !!this._token());
  esProductor = computed(() => this._usuario()?.es_productor ?? false);
  esComprador = computed(() => this._usuario()?.es_comprador ?? false);

  // Actualiza los datos del usuario en el signal y en localStorage (usado por PerfilComponent)
  actualizarUsuario(usuario: Usuario): void {
    this._usuario.set(usuario);
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private guestExploration: GuestExplorationService,
  ) {}

  // Envía email y password al backend, guarda tokens y usuario en localStorage
  login(email: string, password: string): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${API}/usuarios/login/`, { email, password }).pipe(
      tap((resp) => {
        // Guardar tokens JWT en localStorage para persistir la sesión
        localStorage.setItem('access_token', resp.tokens.access);
        localStorage.setItem('refresh_token', resp.tokens.refresh);
        localStorage.setItem('usuario', JSON.stringify(resp.usuario));

        // Actualizar los signals para que la UI reaccione inmediatamente
        this._token.set(resp.tokens.access);
        this._usuario.set(resp.usuario);
        this.guestExploration.limpiarModoRestringido();
      })
    );
  }

  // Registra un nuevo usuario (productor o comprador)
  registro(datos: any): Observable<RespuestaRegistro> {
    return this.http.post<RespuestaRegistro>(`${API}/usuarios/registro/`, datos);
  }

  // Verifica el email con el token enviado al correo del usuario
  verificarEmail(token: string): Observable<RespuestaVerificacion> {
    return this.http.post<RespuestaVerificacion>(`${API}/usuarios/verificar-email/`, { token }).pipe(
      tap((resp) => {
        localStorage.setItem('access_token', resp.tokens.access);
        localStorage.setItem('refresh_token', resp.tokens.refresh);
        localStorage.setItem('usuario', JSON.stringify(resp.usuario));
        this._token.set(resp.tokens.access);
        this._usuario.set(resp.usuario);
        this.guestExploration.limpiarModoRestringido();
      })
    );
  }

  // Cierra sesión: limpia localStorage y redirige al login
  logout(): void {
    localStorage.clear();
    this._token.set(null);
    this._usuario.set(null);
    this.router.navigate(['/auth/login']);
  }

  // Solicita un nuevo access_token usando el refresh_token (cuando el access expira)
  refreshToken(): Observable<{ access: string; refresh?: string }> {
    const refresh = localStorage.getItem('refresh_token');
    return this.http.post<{ access: string; refresh?: string }>(
      `${API}/usuarios/token/refresh/`,
      { refresh }
    ).pipe(
      // Siempre guardar el nuevo access
      tap((resp) => {
        localStorage.setItem('access_token', resp.access);
        this._token.set(resp.access);

        // ROTATE_REFRESH_TOKENS=true → el backend manda refresh nuevo
        if (resp.refresh) {
          localStorage.setItem('refresh_token', resp.refresh);
        }
      })
    );
  }

  // Carga el usuario desde localStorage al iniciar la app (para mantener sesión activa)
  private cargarUsuario(): Usuario | null {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  }
}
