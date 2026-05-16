import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/index';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

// Datos que el usuario puede editar en su perfil
export interface ActualizarPerfil {
  first_name?: string;
  last_name?: string;
  telefono?: string | null;
  municipio?: number | null;
  latitud?: number | null;
  longitud?: number | null;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private http = inject(HttpClient);

  // GET /usuarios/perfil/ — obtiene el perfil del usuario autenticado
  getMiPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(`${API}/usuarios/perfil/`);
  }

  // PATCH /usuarios/perfil/ — actualiza solo los campos enviados
  actualizarPerfil(datos: ActualizarPerfil): Observable<Usuario> {
    return this.http.patch<Usuario>(`${API}/usuarios/perfil/`, datos);
  }

  // POST /usuarios/cambiar-password/ — cambia la contraseña (endpoint pendiente en backend)
  cambiarPassword(actual: string, nueva: string): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${API}/usuarios/cambiar-password/`, {
      password_actual: actual,
      password_nueva: nueva,
    });
  }
}
