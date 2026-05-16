import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PedidoLista, PedidoDetalle, EstadoPedido, Calificacion } from '../models/index';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);

  // GET /pedidos/mis-pedidos/ — lista de pedidos del usuario (comprador o productor)
  getMisPedidos(): Observable<PedidoLista[]> {
    return this.http.get<PedidoLista[]>(`${API}/pedidos/mis-pedidos/`);
  }

  // GET /pedidos/{id}/ — detalle con historial y calificaciones
  getDetalle(id: number): Observable<PedidoDetalle> {
    return this.http.get<PedidoDetalle>(`${API}/pedidos/${id}/`);
  }

  // POST /pedidos/{id}/estado/ — cambia el estado (solo el productor)
  cambiarEstado(
    id: number,
    estado: EstadoPedido,
    observacion?: string
  ): Observable<PedidoDetalle> {
    return this.http.post<PedidoDetalle>(`${API}/pedidos/${id}/estado/`, {
      estado,
      observacion: observacion ?? null,
    });
  }

  // POST /pedidos/{id}/calificar/ — calificación mutua al entregar
  calificar(
    id: number,
    puntuacion: number,
    comentario?: string
  ): Observable<Calificacion> {
    return this.http.post<Calificacion>(`${API}/pedidos/${id}/calificar/`, {
      puntuacion,
      comentario: comentario ?? null,
    });
  }

  // POST /pedidos/crear/{negociacion_id}/ — crea un pedido a partir de una negociación cerrada
  crearDesdeNegociacion(negociacionId: number): Observable<PedidoDetalle> {
    return this.http.post<PedidoDetalle>(`${API}/pedidos/crear/${negociacionId}/`, {});
  }
}
