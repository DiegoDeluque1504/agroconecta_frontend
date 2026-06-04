import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NegociacionLista, NegociacionDetalle, Mensaje } from '../models/index';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class NegociacionService {
  private http = inject(HttpClient);

  // GET /negociaciones/mis-negociaciones/
  getMisNegociaciones(): Observable<NegociacionLista[]> {
    return this.http.get<NegociacionLista[]>(`${API}/negociaciones/mis-negociaciones/`);
  }

  // GET /negociaciones/{id}/ — incluye mensajes y marca leídos
  getDetalle(id: number): Observable<NegociacionDetalle> {
    return this.http.get<NegociacionDetalle>(`${API}/negociaciones/${id}/`);
  }

  // POST /negociaciones/iniciar/{productoId}/ — comprador inicia chat
  iniciar(productoId: number): Observable<NegociacionDetalle> {
    return this.http.post<NegociacionDetalle>(
      `${API}/negociaciones/iniciar/${productoId}/`,
      {}
    );
  }

  // POST /negociaciones/{id}/mensajes/ — enviar texto
  enviarTexto(negociacionId: number, contenido: string): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${API}/negociaciones/${negociacionId}/mensajes/`, {
      tipo: 'texto',
      contenido,
    });
  }

  // POST /negociaciones/{id}/mensajes/ — enviar audio
  enviarAudio(negociacionId: number, audio: Blob): Observable<Mensaje> {
    const fd = new FormData();
    fd.append('tipo', 'audio');
    fd.append('audio', audio, 'mensaje.webm');
    return this.http.post<Mensaje>(`${API}/negociaciones/${negociacionId}/mensajes/`, fd);
  }

  // POST /negociaciones/{id}/estado/ — cerrar o cancelar
  cambiarEstado(
    negociacionId: number,
    estado: 'finalizada' | 'cancelada'
  ): Observable<NegociacionDetalle> {
    return this.http.post<NegociacionDetalle>(
      `${API}/negociaciones/${negociacionId}/estado/`,
      { estado }
    );
  }
}