import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  Injector,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { GalleriaModule } from 'primeng/galleria';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { RatingModule } from 'primeng/rating';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';

import { ProductoService } from '../../core/services/producto.service';
import {
  crearMapaLeaflet,
  crearMarcador,
  cuandoContenedorMapaListo,
} from '../../core/utils/leaflet-map.util';
import { AuthService } from '../../core/services/auth.service';
import { ProductoDetalle } from '../../core/models/index';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GalleriaModule,
    TagModule,
    ButtonModule,
    SkeletonModule,
    RatingModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './producto-detalle.component.html',
  styleUrl: './producto-detalle.component.css',
})
export class ProductoDetalleComponent implements OnInit, OnDestroy {
  @ViewChild('mapaProductor') mapaProductor!: ElementRef;

  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private productoService = inject(ProductoService);
  auth                   = inject(AuthService);
  private toast          = inject(MessageService);
  private platformId     = inject(PLATFORM_ID);
  private injector       = inject(Injector);

  producto = signal<ProductoDetalle | null>(null);
  cargando = signal(true);
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;
  private mapa: any = null;
  private mapaProgramado = false;

  galleriaOpts = {
    showThumbnails: true,
    showIndicators: false,
    changeItemOnIndicatorHover: true,
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/catalogo']); return; }
    this.cargarProducto(id);
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
    if (this.mapa) { this.mapa.remove(); this.mapa = null; }
  }

  cargarProducto(id: number): void {
    this.cargando.set(true);
    this.productoService.getProducto(id).subscribe({
      next: (p) => {
        this.producto.set(p);
        this.cargando.set(false);
        if (p.productor.latitud && p.productor.longitud) {
          this.programarMapaProductor(
            Number(p.productor.latitud),
            Number(p.productor.longitud),
            p.productor.nombre,
          );
        }
      },
      error: () => {
        this.cargando.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el producto' });
        this.redirectTimer = setTimeout(() => this.router.navigate(['/catalogo']), 2000);
      },
    });
  }

  private obtenerContenedorMapa(): HTMLElement | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return (
      document.getElementById('mapa-producto-agroconecta') ??
      this.mapaProductor?.nativeElement ??
      null
    );
  }

  private programarMapaProductor(lat: number, lng: number, nombre: string): void {
    if (!isPlatformBrowser(this.platformId) || this.mapa || this.mapaProgramado) return;
    this.mapaProgramado = true;

    afterNextRender(
      () => {
        cuandoContenedorMapaListo(
          () => this.obtenerContenedorMapa(),
          () => this.iniciarMapaProductor(lat, lng, nombre),
        );
      },
      { injector: this.injector },
    );
  }

  private iniciarMapaProductor(lat: number, lng: number, nombre: string): void {
    if (!isPlatformBrowser(this.platformId) || this.mapa) return;
    const contenedor = this.obtenerContenedorMapa();
    if (!contenedor) return;

    try {
      const { L, mapa } = crearMapaLeaflet(contenedor, {
        lat,
        lng,
        zoom: 13,
        zoomControl: true,
        dragging: true,
      });
      this.mapa = mapa;
      crearMarcador(L, mapa, lat, lng, `📍 ${nombre}`);
    } catch (err) {
      console.error('Error al iniciar mapa del producto:', err);
    }
  }

  get imagenes() {
    const p = this.producto();
    if (!p) return [];
    if (p.fotos.length === 0) {
      return [{ itemImageSrc: 'https://placehold.co/800x500/e8f5e9/2d9e5f?text=Sin+foto', alt: p.nombre }];
    }
    return p.fotos.map((f) => ({
      itemImageSrc: f.url_cloudinary.replace('/upload/', '/upload/f_auto,q_auto,w_800,c_fill/'),
      alt: p.nombre
    }));
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const mapa: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      activo: 'success', agotado: 'warn', inactivo: 'danger',
    };
    return mapa[estado] ?? 'secondary';
  }

  esElProductor(): boolean {
    const p = this.producto();
    const uid = this.auth.usuario()?.id;
    return !!p && !!uid && p.productor.id === uid;
  }

  iniciarNegociacion(): void {
    const p = this.producto();
    if (!p) return;
    this.router.navigate(['/negociaciones'], { queryParams: { producto: p.id } });
  }

  volver(): void {
    this.router.navigate(['/catalogo']);
  }
}