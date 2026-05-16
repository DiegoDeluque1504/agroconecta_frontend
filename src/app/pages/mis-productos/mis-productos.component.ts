import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { ProductoService } from '../../core/services/producto.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductoLista } from '../../core/models/index';

@Component({
  selector: 'app-mis-productos',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TagModule,
    SkeletonModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './mis-productos.component.html',
  styleUrl: './mis-productos.component.css',
})
export class MisProductosComponent implements OnInit {
  private productoService = inject(ProductoService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(MessageService);
  private confirm = inject(ConfirmationService);

  productos = signal<ProductoLista[]>([]);
  cargando = signal(true);

  ngOnInit(): void {
    if (!this.auth.esProductor()) {
      this.router.navigate(['/catalogo']);
      return;
    }
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.productoService.getMisProductos().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar tus productos',
        });
      },
    });
  }

  editar(id: number): void {
    this.router.navigate(['/publicar'], { queryParams: { id } });
  }

  confirmarEliminar(p: ProductoLista): void {
    this.confirm.confirm({
      message: `¿Eliminar "${p.nombre}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.productoService.eliminarProducto(p.id).subscribe({
          next: () => {
            this.toast.add({ severity: 'success', summary: 'Listo', detail: 'Producto eliminado' });
            this.cargar();
          },
          error: () => {
            this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
          },
        });
      },
    });
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const mapa: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      activo: 'success',
      agotado: 'warn',
      inactivo: 'danger',
    };
    return mapa[estado] ?? 'secondary';
  }
}
