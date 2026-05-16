import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { NegociacionService } from '../../core/services/negociacion.service';
import { AuthService } from '../../core/services/auth.service';
import { NegociacionLista, NegociacionDetalle, Mensaje } from '../../core/models/index';

@Component({
  selector: 'app-negociaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './negociaciones.component.html',
  styleUrl: './negociaciones.component.css',
})
export class NegociacionesComponent implements OnInit, AfterViewChecked {
  private negociacionService = inject(NegociacionService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private toast = inject(MessageService);

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  // Estado reactivo
  lista = signal<NegociacionLista[]>([]);
  detalle = signal<NegociacionDetalle | null>(null);
  cargandoLista = signal(true);
  cargandoChat = signal(false);
  enviando = signal(false);
  negociacionActivaId = signal<number | null>(null);
  nuevoMensaje = '';

  private debeScroll = false;

  ngOnInit(): void {
    this.cargarLista();

    // Si viene de detalle producto: /negociaciones?producto=5
    const productoId = Number(this.route.snapshot.queryParamMap.get('producto'));
    if (productoId) this.iniciarDesdeProducto(productoId);
  }

  ngAfterViewChecked(): void {
    if (this.debeScroll) {
      this.scrollAlFinal();
      this.debeScroll = false;
    }
  }

  // ── Lista lateral ──────────────────────────────────────

  cargarLista(): void {
    this.cargandoLista.set(true);
    this.negociacionService.getMisNegociaciones().subscribe({
      next: (data) => {
        this.lista.set(data);
        this.cargandoLista.set(false);
      },
      error: (err) => {
        this.cargandoLista.set(false);
        const msg = err.error?.detail ?? err.error?._mensaje ?? 'No se pudo cargar los chats';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  seleccionarChat(id: number): void {
    this.negociacionActivaId.set(id);
    this.cargarDetalle(id);
  }

  cargarDetalle(id: number): void {
    this.cargandoChat.set(true);
    this.negociacionService.getDetalle(id).subscribe({
      next: (data) => {
        this.detalle.set(data);
        this.cargandoChat.set(false);
        this.debeScroll = true;
        this.cargarLista(); // refresca badge de no leídos
      },
      error: (err) => {
        this.cargandoChat.set(false);
        const msg = err.error?.detail ?? err.error?._mensaje ?? 'No se pudo cargar el chat';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  // ── Iniciar desde producto ─────────────────────────────

  iniciarDesdeProducto(productoId: number): void {
    this.cargandoChat.set(true);
    this.negociacionService.iniciar(productoId).subscribe({
      next: (data) => {
        this.detalle.set(data);
        this.negociacionActivaId.set(data.id);
        this.cargandoChat.set(false);
        this.cargarLista();
        this.debeScroll = true;
      },
      error: (err) => {
        this.cargandoChat.set(false);
        // Backend devuelve negociacion_id si ya existe una abierta
        const idExistente = err.error?.negociacion_id;
        if (idExistente) {
          this.seleccionarChat(idExistente);
          return;
        }
        this.toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.error ?? 'No se pudo iniciar la negociación',
        });
      },
    });
  }

  // ── Mensajes ───────────────────────────────────────────

  enviarMensaje(): void {
    const texto = this.nuevoMensaje.trim();
    const id = this.negociacionActivaId();
    const d = this.detalle();
    if (!texto || !id || !d || d.estado !== 'abierta') return;

    this.enviando.set(true);
    this.negociacionService.enviarTexto(id, texto).subscribe({
      next: (mensaje) => {
        this.detalle.update((prev) =>
          prev ? { ...prev, mensajes: [...prev.mensajes, mensaje] } : prev
        );
        this.nuevoMensaje = '';
        this.enviando.set(false);
        this.debeScroll = true;
        this.cargarLista();
      },
      error: () => {
        this.enviando.set(false);
        const msg = 'No se pudo enviar el mensaje. Intenta de nuevo.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  onEnter(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.enviarMensaje();
    }
  }

  // ── Estado (cerrar / cancelar) ───────────────────────────

  cambiarEstado(estado: 'cerrada' | 'cancelada'): void {
    const id = this.negociacionActivaId();
    if (!id) return;

    this.negociacionService.cambiarEstado(id, estado).subscribe({
      next: (data) => {
        this.detalle.set(data);
        this.cargarLista();
        this.toast.add({ severity: 'success', summary: 'Listo', detail: `Negociación ${estado}` });
      },
      error: (err) => {
        this.toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.error ?? 'No se pudo cambiar el estado',
        });
      },
    });
  }

  // ── Helpers UI ───────────────────────────────────────────

  esMio(mensaje: Mensaje): boolean {
    return mensaje.remitente === this.auth.usuario()?.id;
  }

  nombreCompleto(): string {
    const u = this.auth.usuario();
    return u ? `${u.first_name} ${u.last_name}` : '';
  }

  // Productor puede cerrar; comprador solo cancelar — comparamos por ID, no por nombre
  soyProductorEnChat(): boolean {
    const d = this.detalle();
    const uid = this.auth.usuario()?.id;
    return !!d && !!uid && d.productor_id === uid;
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const mapa: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      abierta: 'success',
      cerrada: 'secondary',
      cancelada: 'danger',
    };
    return mapa[estado] ?? 'secondary';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  private scrollAlFinal(): void {
    if (!this.chatContainer) return;
    const el = this.chatContainer.nativeElement;
    el.scrollTop = el.scrollHeight;
  }
}