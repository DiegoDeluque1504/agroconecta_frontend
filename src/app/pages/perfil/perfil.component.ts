import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { PasswordModule } from 'primeng/password';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../core/services/auth.service';
import { PerfilService } from '../../core/services/perfil.service';
import { ProductoService } from '../../core/services/producto.service';
import { Municipio } from '../../core/models/index';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    ToastModule,
    DividerModule,
    PasswordModule,
    AvatarModule,
    TagModule,
    SkeletonModule,
  ],
  providers: [MessageService],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  auth = inject(AuthService); // público para que el template pueda usarlo
  private perfilService = inject(PerfilService);
  private productoService = inject(ProductoService);
  private toast = inject(MessageService);

  municipios = signal<Municipio[]>([]);
  guardando = signal(false);
  cambiandoPass = signal(false);
  cargandoPerfil = signal(true); // Loading inicial del perfil

  // Formulario de datos personales
  formPerfil: FormGroup = this.fb.group({
    first_name: ['', Validators.required],
    last_name:  ['', Validators.required],
    telefono:   [''],
    municipio:  [null],
  });

  // Formulario de cambio de contraseña
  formPass: FormGroup = this.fb.group({
    actual: ['', Validators.required],
    nueva:  ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    // Carga municipios para el selector
    this.productoService.getMunicipios().subscribe({
      next: (m) => this.municipios.set(m),
    });

    // Carga perfil del servidor para tener datos frescos
    this.perfilService.getMiPerfil().subscribe({
      next: (u) => {
        this.auth.actualizarUsuario(u);
        this.formPerfil.patchValue({
          first_name: u.first_name,
          last_name:  u.last_name,
          telefono:   u.telefono ?? '',
          municipio:  u.municipio ?? null,
        });
        this.cargandoPerfil.set(false);
      },
      error: () => {
        // Si falla la carga remota, usa los datos en caché del signal
        const u = this.auth.usuario();
        if (u) {
          this.formPerfil.patchValue({
            first_name: u.first_name,
            last_name:  u.last_name,
            telefono:   u.telefono ?? '',
            municipio:  u.municipio ?? null,
          });
        }
        this.cargandoPerfil.set(false);
      },
    });
  }

  get iniciales(): string {
    const u = this.auth.usuario();
    if (!u) return '?';
    return `${u.first_name[0] ?? ''}${u.last_name[0] ?? ''}`.toUpperCase();
  }

  get nombreCompleto(): string {
    const u = this.auth.usuario();
    return u ? `${u.first_name} ${u.last_name}` : '';
  }

  guardarPerfil(): void {
    if (this.formPerfil.invalid) { this.formPerfil.markAllAsTouched(); return; }
    this.guardando.set(true);
    const v = this.formPerfil.value;

    this.perfilService.actualizarPerfil({
      first_name: v.first_name,
      last_name:  v.last_name,
      telefono:   v.telefono || null,
      municipio:  v.municipio ?? null,
    }).subscribe({
      next: (usuario) => {
        // Actualiza el signal global de AuthService con los nuevos datos
        this.auth.actualizarUsuario(usuario);
        this.guardando.set(false);
        this.toast.add({ severity: 'success', summary: 'Listo', detail: 'Perfil actualizado' });
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err.error?.detail ?? err.error?._mensaje ?? 'No se pudo actualizar el perfil';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  cambiarPassword(): void {
    if (this.formPass.invalid) { this.formPass.markAllAsTouched(); return; }
    this.cambiandoPass.set(true);
    const v = this.formPass.value;

    this.perfilService.cambiarPassword(v.actual, v.nueva).subscribe({
      next: () => {
        this.cambiandoPass.set(false);
        this.formPass.reset();
        this.toast.add({ severity: 'success', summary: 'Listo', detail: 'Contraseña cambiada correctamente' });
      },
      error: (err) => {
        this.cambiandoPass.set(false);
        const msg = err.error?.password_actual?.[0] ?? err.error?.detail ?? err.error?._mensaje ?? 'Contraseña actual incorrecta';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
