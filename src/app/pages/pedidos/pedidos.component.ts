import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';


import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { RatingModule } from 'primeng/rating';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { TimelineModule } from 'primeng/timeline';

import { PedidoService } from '../../core/services/pedido.service';
import { AuthService } from '../../core/services/auth.service';
import { PedidoLista, PedidoDetalle, EstadoPedido } from '../../core/models/index';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    ButtonModule,
    TagModule,
    SkeletonModule,
    ToastModule,
    DialogModule,
    RatingModule,
    TextareaModule,
    SelectModule,
    TimelineModule,
  ],
  providers: [MessageService],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.css',
})
export class PedidosComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  auth = inject(AuthService);
  private toast = inject(MessageService);

  // Estado reactivo
  pedidos = signal<PedidoLista[]>([]);
  cargando = signal(true);
  detalle = signal<PedidoDetalle | null>(null);
  cargandoDetalle = signal(false);

  // Diálogo cambiar estado (productor)
  dialogEstado = false;
  nuevoEstado: EstadoPedido | null = null;
  observacion = '';
  cambiandoEstado = signal(false);

  // Diálogo calificar
  dialogCalificar = false;
  puntuacion = 0;
  comentarioCalif = '';
  calificando = signal(false);

  // Opciones de estado para el selector (productor)
  estadosSiguientes: { label: string; value: EstadoPedido }[] = [];

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.cargando.set(true);
    this.pedidoService.getMisPedidos().subscribe({
      next: (data) => {
        this.pedidos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        const msg = err.error?.detail ?? err.error?._mensaje ?? 'No se pudieron cargar los pedidos';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  verDetalle(id: number): void {
    this.cargandoDetalle.set(true);
    this.detalle.set(null);
    this.pedidoService.getDetalle(id).subscribe({
      next: (data) => {
        this.detalle.set(data);
        this.cargandoDetalle.set(false);
        this.calcularEstadosSiguientes(data.estado_actual);
      },
      error: (err) => {
        this.cargandoDetalle.set(false);
        const msg = err.error?.detail ?? err.error?._mensaje ?? 'No se pudo cargar el pedido';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  // Calcula qué estados puede asignar el productor según el estado actual
  calcularEstadosSiguientes(actual: EstadoPedido): void {
    const flujo: Record<EstadoPedido, EstadoPedido[]> = {
      confirmado:     ['en_preparacion', 'cancelado'],
      en_preparacion: ['en_camino', 'cancelado'],
      en_camino:      ['entregado'],
      entregado:      [],
      cancelado:      [],
    };
    const opciones = flujo[actual] ?? [];
    this.estadosSiguientes = opciones.map((e) => ({
      label: this.labelEstado(e),
      value: e,
    }));
  }

  abrirDialogEstado(): void {
    this.nuevoEstado = null;
    this.observacion = '';
    this.dialogEstado = true;
  }

  confirmarCambioEstado(): void {
    const id = this.detalle()?.id;
    if (!id || !this.nuevoEstado) return;

    this.cambiandoEstado.set(true);
    this.pedidoService.cambiarEstado(id, this.nuevoEstado, this.observacion).subscribe({
      next: (data) => {
        this.detalle.set(data);
        this.calcularEstadosSiguientes(data.estado_actual);
        this.cambiandoEstado.set(false);
        this.dialogEstado = false;
        this.cargarPedidos();
        this.toast.add({ severity: 'success', summary: 'Listo', detail: `Estado actualizado a: ${this.labelEstado(data.estado_actual)}` });
      },
      error: (err) => {
        this.cambiandoEstado.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.error ?? 'No se pudo cambiar el estado' });
      },
    });
  }

  abrirDialogCalificar(): void {
    this.puntuacion = 0;
    this.comentarioCalif = '';
    this.dialogCalificar = true;
  }

  confirmarCalificacion(): void {
    const id = this.detalle()?.id;
    if (!id || this.puntuacion === 0) return;

    this.calificando.set(true);
    this.pedidoService.calificar(id, this.puntuacion, this.comentarioCalif).subscribe({
      next: () => {
        this.calificando.set(false);
        this.dialogCalificar = false;
        // Recarga el detalle para reflejar ya_califique = true
        this.verDetalle(id);
        this.toast.add({ severity: 'success', summary: '¡Gracias!', detail: 'Calificación enviada' });
      },
      error: (err) => {
        this.calificando.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.error ?? 'No se pudo calificar' });
      },
    });
  }

  // ── Helpers UI ────────────────────────────────────────────

  getSeverity(estado: EstadoPedido): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const mapa: Record<EstadoPedido, 'success' | 'warn' | 'danger' | 'info' | 'secondary'> = {
      confirmado:     'info',
      en_preparacion: 'warn',
      en_camino:      'warn',
      entregado:      'success',
      cancelado:      'danger',
    };
    return mapa[estado] ?? 'secondary';
  }

  labelEstado(estado: EstadoPedido): string {
    const mapa: Record<EstadoPedido, string> = {
      confirmado:     'Confirmado',
      en_preparacion: 'En preparación',
      en_camino:      'En camino',
      entregado:      'Entregado',
      cancelado:      'Cancelado',
    };
    return mapa[estado] ?? estado;
  }

  iconoEstado(estado: EstadoPedido): string {
    const mapa: Record<EstadoPedido, string> = {
      confirmado:     'pi-check-circle',
      en_preparacion: 'pi-box',
      en_camino:      'pi-truck',
      entregado:      'pi-verified',
      cancelado:      'pi-times-circle',
    };
    return mapa[estado] ?? 'pi-circle';
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }
}
