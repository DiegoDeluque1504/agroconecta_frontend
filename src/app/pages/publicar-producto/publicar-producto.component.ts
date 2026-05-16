import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ProductoService } from '../../core/services/producto.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoriaProducto, Municipio, FotoProducto } from '../../core/models/index';

@Component({
  selector: 'app-publicar-producto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './publicar-producto.component.html',
  styleUrl: './publicar-producto.component.css',
})
export class PublicarProductoComponent implements OnInit, OnDestroy {
  private fb              = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private auth            = inject(AuthService);
  private route           = inject(ActivatedRoute);
  private router          = inject(Router);
  private toast           = inject(MessageService);

  categorias       = signal<CategoriaProducto[]>([]);
  municipios       = signal<Municipio[]>([]);
  cargando         = signal(false);
  modoEdicion      = signal(false);
  productoId: number | null = null;

  // Foto única (modo crear)
  fotoSeleccionada: File | null  = null;
  fotoPreviewUrl:   string | null = null;

  // Galería (modo edición)
  fotosExistentes  = signal<FotoProducto[]>([]);
  subiendoFoto     = signal(false);
  eliminandoFotoId = signal<number | null>(null);

  unidades = [
    { label: 'Kilogramo (kg)', value: 'kg' },
    { label: 'Libra (lb)',     value: 'lb' },
    { label: 'Unidad (und)',   value: 'und' },
    { label: 'Bulto',          value: 'bulto' },
    { label: 'Litro (lt)',     value: 'lt' },
    { label: 'Arroba',         value: 'arroba' },
  ];

  estados = [
    { label: 'Activo',   value: 'activo' },
    { label: 'Agotado',  value: 'agotado' },
    { label: 'Inactivo', value: 'inactivo' },
  ];

  form: FormGroup = this.fb.group({
    nombre:              ['', Validators.required],
    descripcion:         ['', Validators.required],
    precio:              [null, [Validators.required, Validators.min(1)]],
    cantidad_disponible: [null, [Validators.required, Validators.min(0.01)]],
    unidad_medida:       ['kg', Validators.required],
    categoria_id:        [null, Validators.required],
    municipio_id:        [null, Validators.required],
    estado:              ['activo'],
  });

  ngOnInit(): void {
    if (!this.auth.esProductor()) {
      this.router.navigate(['/catalogo']);
      return;
    }

    this.productoService.getCategorias().subscribe({ next: (c) => this.categorias.set(c) });
    this.productoService.getMunicipios().subscribe({ next: (m) => this.municipios.set(m) });

    const id = Number(this.route.snapshot.queryParamMap.get('id'));
    if (id) {
      this.modoEdicion.set(true);
      this.productoId = id;
      this.cargarProducto(id);
    }
  }

  ngOnDestroy(): void {
    if (this.fotoPreviewUrl) URL.revokeObjectURL(this.fotoPreviewUrl);
  }

  cargarProducto(id: number): void {
    this.productoService.getProducto(id).subscribe({
      next: (p) => {
        this.form.patchValue({
          nombre:              p.nombre,
          descripcion:         p.descripcion,
          precio:              Number(p.precio),
          cantidad_disponible: Number(p.cantidad_disponible),
          unidad_medida:       p.unidad_medida,
          categoria_id:        p.categoria.id,
          municipio_id:        p.municipio.id,
          estado:              p.estado,
        });
        // Carga las fotos existentes del producto
        this.fotosExistentes.set(p.fotos ?? []);
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'Producto no encontrado' });
        this.router.navigate(['/mis-productos']);
      },
    });
  }

  // ── Foto única (modo crear) ──────────────────────────────────────────────
  onFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;

    if (file) {
      const tiposValidos = ['image/jpeg', 'image/png', 'image/webp'];
      if (!tiposValidos.includes(file.type)) {
        this.toast.add({ severity: 'warn', summary: 'Formato inválido', detail: 'Solo se permiten imágenes JPG, PNG o WEBP' });
        input.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.toast.add({ severity: 'warn', summary: 'Archivo muy grande', detail: 'La imagen no puede superar los 5 MB' });
        input.value = '';
        return;
      }
    }

    this.fotoSeleccionada = file;
    if (this.fotoPreviewUrl) URL.revokeObjectURL(this.fotoPreviewUrl);
    this.fotoPreviewUrl = file ? URL.createObjectURL(file) : null;
}

  // ── Galería (modo edición) ───────────────────────────────────────────────

  // Abre el selector de archivo para agregar foto adicional
  agregarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file || !this.productoId) return;

    this.subiendoFoto.set(true);
    this.productoService.agregarFoto(this.productoId, file).subscribe({
      next: (foto) => {
        this.fotosExistentes.update((fotos) => [...fotos, foto as FotoProducto]);
        this.subiendoFoto.set(false);
        this.toast.add({ severity: 'success', summary: 'Foto agregada', detail: 'La foto se subió correctamente' });
        // Limpia el input para permitir subir la misma foto de nuevo
        input.value = '';
      },
      error: () => {
        this.subiendoFoto.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir la foto' });
      },
    });
  }

  eliminarFoto(fotoId: number): void {
    this.eliminandoFotoId.set(fotoId);
    this.productoService.eliminarFoto(fotoId).subscribe({
      next: () => {
        this.fotosExistentes.update((fotos) => fotos.filter((f) => f.id !== fotoId));
        this.eliminandoFotoId.set(null);
        this.toast.add({ severity: 'success', summary: 'Foto eliminada', detail: 'La foto se eliminó correctamente' });
      },
      error: () => {
        this.eliminandoFotoId.set(null);
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la foto' });
      },
    });
  }

  // ── Guardar ─────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.cargando.set(true);
    const v  = this.form.value;
    const fd = new FormData();

    fd.append('nombre',              v.nombre);
    fd.append('descripcion',         v.descripcion);
    fd.append('precio',              String(v.precio));
    fd.append('cantidad_disponible', String(v.cantidad_disponible));
    fd.append('unidad_medida',       v.unidad_medida);
    fd.append('categoria_id',        String(v.categoria_id));
    fd.append('municipio_id',        String(v.municipio_id));
    fd.append('estado',              this.modoEdicion() ? v.estado : 'activo');

    if (!this.modoEdicion() && this.fotoSeleccionada) {
      fd.append('foto', this.fotoSeleccionada);
    }

    const peticion = this.modoEdicion() && this.productoId
      ? this.productoService.actualizarProducto(this.productoId, fd)
      : this.productoService.crearProducto(fd);

    peticion.subscribe({
      next: () => {
        this.cargando.set(false);
        this.toast.add({
          severity: 'success',
          summary: 'Listo',
          detail: this.modoEdicion() ? 'Producto actualizado' : 'Producto publicado',
        });
        this.router.navigate(['/mis-productos']);
      },
      error: (err) => this.mostrarError(err),
    });
  }

  private mostrarError(err: { error?: Record<string, unknown> }): void {
    this.cargando.set(false);
    const e = err.error;
    let msg = 'Error al guardar el producto';
    if (e && typeof e === 'object') {
      const valores = Object.values(e).flat();
      if (valores.length > 0) msg = String(valores[0]);
    }
    this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
  }
}