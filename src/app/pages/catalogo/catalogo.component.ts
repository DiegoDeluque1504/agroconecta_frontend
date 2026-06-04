import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ProductoService, FiltrosCatalogo } from '../../core/services/producto.service';
import { ProductoLista, CategoriaProducto } from '../../core/models/index';
import { MonedaPipe } from '../../shared/pipes/moneda.pipe';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    SelectModule,
    PaginatorModule,
    SkeletonModule,
    TagModule,
    ButtonModule,
    ToastModule,
    MonedaPipe,
  ],
  providers: [MessageService],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.css',
})
export class CatalogoComponent implements OnInit {
  private productoService = inject(ProductoService);
  private router = inject(Router);
  private toast = inject(MessageService);

  // Estado de la página
  productos = signal<ProductoLista[]>([]);
  categorias = signal<CategoriaProducto[]>([]);
  cargando = signal(true);
  errorCatalogo = signal<string | null>(null); // Mensaje de error para mostrar estado de error visual
  totalProductos = signal(0);

  // Filtros activos
  filtros: FiltrosCatalogo = { page: 1, ordering: '-created_at' };
  busqueda = '';
  categoriaSeleccionada: number | null = null;
  ordenSeleccionado = '-created_at';

  // Opciones para el selector de orden
  opcionesOrden = [
    { label: 'Más recientes', value: '-created_at' },
    { label: 'Más antiguos', value: 'created_at' },
    { label: 'Menor precio', value: 'precio' },
    { label: 'Mayor precio', value: '-precio' },
    { label: 'Nombre A-Z', value: 'nombre' },
  ];

  // Cantidad de productos por página
  readonly porPagina = 12;

  ngOnInit(): void {
    // Cargar categorías y productos al iniciar
    this.cargarCategorias();
    this.cargarProductos();
  }

  cargarCategorias(): void {
    this.productoService.getCategorias().subscribe({
      next: (cats) => this.categorias.set(cats),
      // Si falla las categorías, mostramos toast discreto pero seguimos cargando el catálogo
      error: () => this.toast.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se pudieron cargar las categorías para filtrar.',
        life: 4000,
      }),
    });
  }

  cargarProductos(): void {
    this.cargando.set(true);
    this.errorCatalogo.set(null); // Limpia error previo al reintentar

    this.productoService.getCatalogo(this.filtros).subscribe({
      next: (resp) => {
        this.productos.set(resp.results);
        this.totalProductos.set(resp.count);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        // Usa mensaje del interceptor si está disponible, si no usa uno genérico
        const msg =
          err.error?._mensaje ||
          err.error?.detail ||
          err.error?.error ||
          (err.status === 0 ? 'Sin conexión con el servidor.' : 'No se pudo cargar el catálogo.');
        this.errorCatalogo.set(msg);
      },
    });
  }

  // Aplica la búsqueda por texto (con debounce manual)
  private busquedaTimeout: any;
  onBusqueda(): void {
    clearTimeout(this.busquedaTimeout);
    this.busquedaTimeout = setTimeout(() => {
      this.filtros = { ...this.filtros, search: this.busqueda || undefined, page: 1 };
      this.cargarProductos();
    }, 400); // Espera 400ms antes de buscar
  }

  // Aplica el filtro de categoría
  onCategoria(): void {
    this.filtros = {
      ...this.filtros,
      categoria: this.categoriaSeleccionada ?? undefined,
      page: 1,
    };
    this.cargarProductos();
  }

  // Aplica el orden seleccionado
  onOrden(): void {
    this.filtros = { ...this.filtros, ordering: this.ordenSeleccionado, page: 1 };
    this.cargarProductos();
  }

  // Maneja el cambio de página del paginador
  onPagina(event: PaginatorState): void {
    const pagina = (event.page ?? 0) + 1; // PrimeNG usa base 0, el backend base 1
    this.filtros = { ...this.filtros, page: pagina };
    this.cargarProductos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Limpia todos los filtros
  limpiarFiltros(): void {
    this.busqueda = '';
    this.categoriaSeleccionada = null;
    this.ordenSeleccionado = '-created_at';
    this.filtros = { page: 1, ordering: '-created_at' };
    this.cargarProductos();
  }

  // Navega al detalle del producto
  verProducto(id: number): void {
    this.router.navigate(['/producto', id]);
  }

  // Devuelve la URL de la foto principal o un placeholder
  getFoto(producto: ProductoLista): string {
    const url = producto.foto_principal;
    if (!url) return 'https://placehold.co/400x300/e8f5e9/2d9e5f?text=Sin+foto';
    // Cloudinary: convierte a WebP, calidad automática, ancho 400px
    return url.replace('/upload/', '/upload/f_auto,q_auto,w_400,c_fill/');
  }

  // Devuelve color del tag según el estado del producto
  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const mapa: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      activo: 'success',
      agotado: 'warn',
      inactivo: 'danger',
    };
    return mapa[estado] ?? 'secondary';
  }

  // Array de 12 items para el skeleton loader
  get skeletons() {
    return Array(12).fill(null);
  }
}
