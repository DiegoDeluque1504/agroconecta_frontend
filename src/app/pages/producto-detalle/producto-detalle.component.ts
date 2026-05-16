import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// PrimeNG
import { GalleriaModule } from 'primeng/galleria';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { RatingModule } from 'primeng/rating';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';

import { ProductoService } from '../../core/services/producto.service';
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productoService = inject(ProductoService);
  private auth = inject(AuthService);
  private toast = inject(MessageService);

  producto = signal<ProductoDetalle | null>(null);
  cargando = signal(true);
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  // Opciones del carrusel de imágenes
  galleriaOpts = {
    showThumbnails: true,
    showIndicators: false,
    changeItemOnIndicatorHover: true,
  };

  ngOnInit(): void {
    // Obtiene el ID de la URL (/producto/:id)
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/catalogo']);
      return;
    }
    this.cargarProducto(id);
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
  }

  cargarProducto(id: number): void {
    this.cargando.set(true);
    this.productoService.getProducto(id).subscribe({
      next: (p) => {
        this.producto.set(p);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el producto',
        });
        this.redirectTimer = setTimeout(() => this.router.navigate(['/catalogo']), 2000);
      },
    });
  }

  // Devuelve la lista de imágenes para la galería de PrimeNG
  get imagenes() {
    const p = this.producto();
    if (!p) return [];
    if (p.fotos.length === 0) {
      // Si no hay fotos, usa un placeholder
      return [{ itemImageSrc: 'https://placehold.co/800x500/e8f5e9/2d9e5f?text=Sin+foto', alt: p.nombre }];
    }
    return p.fotos.map((f) => ({
      itemImageSrc: f.url_cloudinary,
      alt: p.nombre,
    }));
  }

  // Color del tag de estado
  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const mapa: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      activo: 'success',
      agotado: 'warn',
      inactivo: 'danger',
    };
    return mapa[estado] ?? 'secondary';
  }

  // True si el usuario autenticado es el productor dueño de este producto
  esElProductor(): boolean {
    const p = this.producto();
    const uid = this.auth.usuario()?.id;
    return !!p && !!uid && p.productor.id === uid;
  }

  // Navega al chat de negociación con este producto
  iniciarNegociacion(): void {
    const p = this.producto();
    if (!p) return;
    this.router.navigate(['/negociaciones'], { queryParams: { producto: p.id } });
  }

  volver(): void {
    this.router.navigate(['/catalogo']);
  }
}
