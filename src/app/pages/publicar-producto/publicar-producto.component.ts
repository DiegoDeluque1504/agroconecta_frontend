import { Component, inject, OnInit, signal } from '@angular/core';
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
import { CategoriaProducto, Municipio } from '../../core/models/index';

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
export class PublicarProductoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(MessageService);

  categorias = signal<CategoriaProducto[]>([]);
  municipios = signal<Municipio[]>([]);
  cargando = signal(false);
  modoEdicion = signal(false);
  productoId: number | null = null;
  fotoSeleccionada: File | null = null;
  fotoPreviewUrl: string | null = null; // URL temporal para previsualizar la foto

  unidades = [
    { label: 'Kilogramo (kg)', value: 'kg' },
    { label: 'Libra (lb)', value: 'lb' },
    { label: 'Unidad (und)', value: 'und' },
    { label: 'Bulto', value: 'bulto' },
    { label: 'Litro (lt)', value: 'lt' },
    { label: 'Arroba', value: 'arroba' },
  ];

  estados = [
    { label: 'Activo', value: 'activo' },
    { label: 'Agotado', value: 'agotado' },
    { label: 'Inactivo', value: 'inactivo' },
  ];

  form: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: ['', Validators.required],
    precio: [null, [Validators.required, Validators.min(1)]],
    cantidad_disponible: [null, [Validators.required, Validators.min(0.01)]],
    unidad_medida: ['kg', Validators.required],
    categoria_id: [null, Validators.required],
    municipio_id: [null, Validators.required],
    estado: ['activo'],
  });

  ngOnInit(): void {
    if (!this.auth.esProductor()) {
      this.router.navigate(['/catalogo']);
      return;
    }

    this.productoService.getCategorias().subscribe({
      next: (c) => this.categorias.set(c),
    });
    this.productoService.getMunicipios().subscribe({
      next: (m) => this.municipios.set(m),
    });

    const id = Number(this.route.snapshot.queryParamMap.get('id'));
    if (id) {
      this.modoEdicion.set(true);
      this.productoId = id;
      this.cargarProducto(id);
    }
  }

  cargarProducto(id: number): void {
    this.productoService.getProducto(id).subscribe({
      next: (p) => {
        this.form.patchValue({
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: Number(p.precio),
          cantidad_disponible: Number(p.cantidad_disponible),
          unidad_medida: p.unidad_medida,
          categoria_id: p.categoria.id,
          municipio_id: p.municipio.id,
          estado: p.estado,
        });
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'Producto no encontrado' });
        this.router.navigate(['/mis-productos']);
      },
    });
  }

  onFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fotoSeleccionada = file;
    // Genera URL temporal para mostrar preview
    if (this.fotoPreviewUrl) URL.revokeObjectURL(this.fotoPreviewUrl);
    this.fotoPreviewUrl = file ? URL.createObjectURL(file) : null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    const v = this.form.value;

    if (this.modoEdicion() && this.productoId) {
      // Siempre usar FormData para que la foto nueva se incluya si el usuario la cambió
      const fd = new FormData();
      fd.append('nombre', v.nombre);
      fd.append('descripcion', v.descripcion);
      fd.append('precio', String(v.precio));
      fd.append('cantidad_disponible', String(v.cantidad_disponible));
      fd.append('unidad_medida', v.unidad_medida);
      fd.append('categoria_id', String(v.categoria_id));
      fd.append('municipio_id', String(v.municipio_id));
      fd.append('estado', v.estado);
      if (this.fotoSeleccionada) {
        fd.append('foto', this.fotoSeleccionada);
      }

      this.productoService
        .actualizarProducto(this.productoId, fd)
        .subscribe({
          next: () => {
            this.cargando.set(false);
            this.toast.add({ severity: 'success', summary: 'Listo', detail: 'Producto actualizado' });
            this.router.navigate(['/mis-productos']);
          },
          error: (err) => this.mostrarError(err),
        });
    } else {
      const fd = new FormData();
      fd.append('nombre', v.nombre);
      fd.append('descripcion', v.descripcion);
      fd.append('precio', String(v.precio));
      fd.append('cantidad_disponible', String(v.cantidad_disponible));
      fd.append('unidad_medida', v.unidad_medida);
      fd.append('categoria_id', String(v.categoria_id));
      fd.append('municipio_id', String(v.municipio_id));
      fd.append('estado', 'activo');
      if (this.fotoSeleccionada) {
        fd.append('foto', this.fotoSeleccionada);
      }

      this.productoService.crearProducto(fd).subscribe({
        next: () => {
          this.cargando.set(false);
          this.toast.add({ severity: 'success', summary: 'Listo', detail: 'Producto publicado' });
          this.router.navigate(['/mis-productos']);
        },
        error: (err) => this.mostrarError(err),
      });
    }
  }

  private mostrarError(err: { error?: Record<string, unknown> }): void {
    this.cargando.set(false);
    const e = err.error;
    let msg = 'Error al guardar el producto';
    if (e && typeof e === 'object') {
      const valores = Object.values(e).flat();
      if (valores.length > 0) {
        msg = String(valores[0]);
      }
    }
    this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
  }
}
