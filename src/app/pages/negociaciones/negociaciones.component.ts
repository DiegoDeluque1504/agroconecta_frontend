import { Component, inject, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';

import { NegociacionService } from '../../core/services/negociacion.service';
import { AuthService } from '../../core/services/auth.service';
import { PedidoService } from '../../core/services/pedido.service';
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
    DialogModule,
    InputNumberModule,
  ],
  providers: [MessageService],
  templateUrl: './negociaciones.component.html',
  styleUrl: './negociaciones.component.css',
})
export class NegociacionesComponent implements OnInit, OnDestroy, AfterViewChecked {
  private negociacionService = inject(NegociacionService);
  private auth               = inject(AuthService);
  private pedidoService      = inject(PedidoService);
  private route              = inject(ActivatedRoute);
  private toast              = inject(MessageService);

  @ViewChild('chatContainer') chatContainer!: ElementRef;

  lista               = signal<NegociacionLista[]>([]);
  detalle             = signal<NegociacionDetalle | null>(null);
  cargandoLista       = signal(true);
  cargandoChat        = signal(false);
  enviando            = signal(false);
  creandoPedido       = signal(false);
  // Diálogo de crear pedido
  mostrarDialogoPedido = signal(false);
  cantidadAcordada: number | null = null;
  precioAcordado: number | null = null;
  direccionEntrega = '';
  notasEntrega = '';
  negociacionActivaId = signal<number | null>(null);
  nuevoMensaje        = '';

  // Audio
  grabando          = signal(false);
  segundosGrabacion = signal(0);
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private timerGrabacion: ReturnType<typeof setInterval> | null = null;
  private streamActivo: MediaStream | null = null;

  private debeScroll = false;

  ngOnInit(): void {
    this.cargarLista();
    const productoId = Number(this.route.snapshot.queryParamMap.get('producto'));
    if (productoId) this.iniciarDesdeProducto(productoId);
  }

  ngOnDestroy(): void {
    this.detenerGrabacion(false);
  }

  ngAfterViewChecked(): void {
    if (this.debeScroll) { this.scrollAlFinal(); this.debeScroll = false; }
  }

  // ── Lista ──────────────────────────────────────────────

  cargarLista(): void {
    this.cargandoLista.set(true);
    this.negociacionService.getMisNegociaciones().subscribe({
      next: (data) => { this.lista.set(data); this.cargandoLista.set(false); },
      error: (err) => {
        this.cargandoLista.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?._mensaje ?? 'No se pudo cargar los chats' });
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
        this.cargarLista();
      },
      error: (err) => {
        this.cargandoChat.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?._mensaje ?? 'No se pudo cargar el chat' });
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
        const idExistente = err.error?.negociacion_id;
        if (idExistente) { this.seleccionarChat(idExistente); return; }
        this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.error ?? 'No se pudo iniciar la negociación' });
      },
    });
  }

  // ── Texto ──────────────────────────────────────────────

  enviarMensaje(): void {
    const texto = this.nuevoMensaje.trim();
    const id    = this.negociacionActivaId();
    const d     = this.detalle();
    if (!texto || !id || !d || d.estado !== 'abierta') return;

    this.enviando.set(true);
    this.negociacionService.enviarTexto(id, texto).subscribe({
      next: (mensaje) => {
        this.detalle.update((prev) => prev ? { ...prev, mensajes: [...prev.mensajes, mensaje] } : prev);
        this.nuevoMensaje = '';
        this.enviando.set(false);
        this.debeScroll = true;
        this.cargarLista();
      },
      error: () => {
        this.enviando.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el mensaje' });
      },
    });
  }

  onEnter(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.enviarMensaje(); }
  }

  // ── Audio ──────────────────────────────────────────────

  async iniciarGrabacion(): Promise<void> {
    if (this.grabando()) return;

    try {
      this.streamActivo = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.toast.add({ severity: 'warn', summary: 'Micrófono', detail: 'No se pudo acceder al micrófono. Verifica los permisos.' });
      return;
    }

    this.chunks = [];
    this.segundosGrabacion.set(0);
    this.mediaRecorder = new MediaRecorder(this.streamActivo);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: 'audio/webm' });
      this.enviarAudio(blob);
      this.streamActivo?.getTracks().forEach((t) => t.stop());
      this.streamActivo = null;
    };

    this.mediaRecorder.start();
    this.grabando.set(true);

    this.timerGrabacion = setInterval(() => {
      this.segundosGrabacion.update((s) => {
        if (s >= 59) { this.detenerGrabacion(true); return 0; }
        return s + 1;
      });
    }, 1000);
  }

  detenerGrabacion(enviar: boolean): void {
    if (this.timerGrabacion) { clearInterval(this.timerGrabacion); this.timerGrabacion = null; }
    this.grabando.set(false);
    this.segundosGrabacion.set(0);

    if (!enviar) {
      // Cancela sin enviar
      this.streamActivo?.getTracks().forEach((t) => t.stop());
      this.streamActivo = null;
      this.chunks = [];
      return;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop(); // dispara onstop → enviarAudio()
    }
  }

  private enviarAudio(blob: Blob): void {
    const id = this.negociacionActivaId();
    if (!id || blob.size === 0) return;

    this.enviando.set(true);
    this.negociacionService.enviarAudio(id, blob).subscribe({
      next: (mensaje) => {
        this.detalle.update((prev) => prev ? { ...prev, mensajes: [...prev.mensajes, mensaje] } : prev);
        this.enviando.set(false);
        this.debeScroll = true;
        this.cargarLista();
      },
      error: () => {
        this.enviando.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el audio' });
      },
    });
  }

  // ── Estado ─────────────────────────────────────────────

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
        this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.error ?? 'No se pudo cambiar el estado' });
      },
    });
  }

abrirDialogoPedido(): void {
  const p = this.detalle()?.producto_nombre;
  if (!p) return;
  this.cantidadAcordada = null;
  this.precioAcordado = null;
  this.direccionEntrega = '';
  this.notasEntrega = '';
  this.mostrarDialogoPedido.set(true);
}

  crearPedido(): void {
    const id = this.negociacionActivaId();
    if (!id || !this.cantidadAcordada || !this.precioAcordado) {
      this.toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingresa cantidad y precio acordado' });
      return;
    }

    this.creandoPedido.set(true);
    this.pedidoService.crearDesdeNegociacion(
      id,
      this.cantidadAcordada,
      this.precioAcordado,
      this.direccionEntrega,
      this.notasEntrega
    ).subscribe({
      next: (pedido) => {
        this.creandoPedido.set(false);
        this.mostrarDialogoPedido.set(false);
        this.cargarDetalle(id);
        this.toast.add({ severity: 'success', summary: '¡Pedido creado!', detail: `Pedido #${pedido.id} generado correctamente` });
      },
      error: (err: { error?: Record<string, unknown> }) => {
        this.creandoPedido.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: err.error?.['_mensaje'] as string ?? 'No se pudo crear el pedido' });
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────

  esMio(mensaje: Mensaje): boolean {
    return mensaje.remitente === this.auth.usuario()?.id;
  }

  nombreCompleto(): string {
    const u = this.auth.usuario();
    return u ? `${u.first_name} ${u.last_name}` : '';
  }

  soyProductorEnChat(): boolean {
    const d   = this.detalle();
    const uid = this.auth.usuario()?.id;
    return !!d && !!uid && d.productor_id === uid;
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const mapa: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      abierta: 'success', cerrada: 'secondary', cancelada: 'danger',
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