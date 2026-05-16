import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

import { NotificacionService } from '../../core/services/notificacion.service';
import { Notificacion } from '../../core/models/index';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    SkeletonModule,
    ToastModule,
    TagModule,
  ],
  providers: [MessageService],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css',
})
export class NotificacionesComponent implements OnInit {
  private notifService = inject(NotificacionService);
  private router = inject(Router);
  private toast = inject(MessageService);

  notificaciones = signal<Notificacion[]>([]);
  cargando = signal(true);
  marcandoTodas = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.notifService.getMisNotificaciones().subscribe({
      next: (data) => {
        this.notificaciones.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las notificaciones' });
      },
    });
  }

  marcarLeida(notif: Notificacion): void {
    if (notif.leida) {
      // Si ya está leída y tiene URL destino, navega directamente
      if (notif.url_destino) this.router.navigateByUrl(notif.url_destino);
      return;
    }

    this.notifService.marcarLeida(notif.id).subscribe({
      next: (actualizada) => {
        // Actualiza esa notificación en la lista sin recargar todo
        this.notificaciones.update((lista) =>
          lista.map((n) => (n.id === actualizada.id ? actualizada : n))
        );
        // Navega si tiene URL destino
        if (actualizada.url_destino) this.router.navigateByUrl(actualizada.url_destino);
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo marcar como leída' });
      },
    });
  }

  marcarTodasLeidas(): void {
    this.marcandoTodas.set(true);
    this.notifService.marcarTodasLeidas().subscribe({
      next: () => {
        // Marca todas como leídas en la lista local
        this.notificaciones.update((lista) =>
          lista.map((n) => ({ ...n, leida: true }))
        );
        this.marcandoTodas.set(false);
        this.toast.add({ severity: 'success', summary: 'Listo', detail: 'Todas marcadas como leídas' });
      },
      error: () => {
        this.marcandoTodas.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo completar la acción' });
      },
    });
  }

  // Devuelve un ícono según el tipo de notificación del backend
  iconoTipo(tipo: string): string {
    const mapa: Record<string, string> = {
      nueva_negociacion:  'pi-comments',
      nuevo_mensaje:      'pi-envelope',
      nuevo_pedido:       'pi-shopping-cart',
      cambio_estado:      'pi-truck',
      calificacion:       'pi-star',
    };
    return mapa[tipo] ?? 'pi-bell';
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  get hayNoLeidas(): boolean {
    return this.notificaciones().some((n) => !n.leida);
  }
}
