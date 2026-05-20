import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  afterNextRender,
  Injector,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
import { Municipio, Usuario } from '../../core/models/index';
import {
  crearMapaLeaflet,
  crearMarcador,
  cuandoContenedorMapaListo,
} from '../../core/utils/leaflet-map.util';

const MAPA_PERFIL_ID = 'mapa-perfil-agroconecta';

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
export class PerfilComponent implements OnInit, OnDestroy {
  @ViewChild('mapaContainer') mapaContainer!: ElementRef<HTMLElement>;

  private fb = inject(FormBuilder);
  auth = inject(AuthService);
  private perfilService = inject(PerfilService);
  private productoService = inject(ProductoService);
  private toast = inject(MessageService);
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);

  municipios = signal<Municipio[]>([]);
  guardando = signal(false);
  cambiandoPass = signal(false);
  cargandoPerfil = signal(true);
  guardandoUbic = signal(false);
  mapaError = signal('');

  latitudSel = signal<number | null>(null);
  longitudSel = signal<number | null>(null);

  private mapa: any = null;
  private marcador: any = null;
  private mapaProgramado = false;

  formPerfil: FormGroup = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    telefono: [''],
    municipio: [null],
  });

  formPass: FormGroup = this.fb.group({
    actual: ['', Validators.required],
    nueva: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.productoService.getMunicipios().subscribe({
      next: (m) => this.municipios.set(m),
    });

    this.perfilService.getMiPerfil().subscribe({
      next: (u) => this.aplicarPerfil(u),
      error: () => {
        const u = this.auth.usuario();
        if (u) {
          this.formPerfil.patchValue({
            first_name: u.first_name,
            last_name: u.last_name,
            telefono: u.telefono ?? '',
            municipio: u.municipio ?? null,
          });
          if (u.latitud && u.longitud) {
            this.latitudSel.set(Number(u.latitud));
            this.longitudSel.set(Number(u.longitud));
          }
        }
        this.cargandoPerfil.set(false);
        this.programarInicioMapa();
      },
    });
  }

  private aplicarPerfil(u: Usuario): void {
    this.auth.actualizarUsuario(u);
    this.formPerfil.patchValue({
      first_name: u.first_name,
      last_name: u.last_name,
      telefono: u.telefono ?? '',
      municipio: u.municipio ?? null,
    });
    if (u.latitud && u.longitud) {
      this.latitudSel.set(Number(u.latitud));
      this.longitudSel.set(Number(u.longitud));
    }
    this.cargandoPerfil.set(false);
    this.programarInicioMapa();
  }

  private obtenerContenedorMapa(): HTMLElement | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return (
      document.getElementById(MAPA_PERFIL_ID) ??
      this.mapaContainer?.nativeElement ??
      null
    );
  }

  private programarInicioMapa(): void {
    if (!isPlatformBrowser(this.platformId) || !this.auth.esProductor() || this.mapaProgramado) {
      return;
    }
    this.mapaProgramado = true;
    this.mapaError.set('');

    afterNextRender(
      () => {
        cuandoContenedorMapaListo(
          () => this.obtenerContenedorMapa(),
          () => void this.iniciarMapa(),
        );
      },
      { injector: this.injector },
    );
  }

  reintentarMapa(): void {
    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
      this.marcador = null;
    }
    this.mapaProgramado = false;
    this.programarInicioMapa();
  }

  ngOnDestroy(): void {
    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
    }
  }

  private iniciarMapa(): void {
    if (!isPlatformBrowser(this.platformId) || this.mapa) return;

    const contenedor = this.obtenerContenedorMapa();
    if (!contenedor) {
      this.mapaError.set('No se encontró el contenedor del mapa.');
      return;
    }

    try {
      const lat = this.latitudSel() ?? 11.5444;
      const lng = this.longitudSel() ?? -72.9072;

      const { L, mapa } = crearMapaLeaflet(contenedor, { lat, lng, zoom: 10 });
      this.mapa = mapa;
      this.mapaError.set('');

      if (this.latitudSel() && this.longitudSel()) {
        this.marcador = crearMarcador(L, mapa, lat, lng, 'Tu ubicación actual');
      }

      mapa.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        this.latitudSel.set(parseFloat(clickLat.toFixed(6)));
        this.longitudSel.set(parseFloat(clickLng.toFixed(6)));

        if (this.marcador) {
          this.marcador.setLatLng([clickLat, clickLng]);
        } else {
          this.marcador = crearMarcador(L, mapa, clickLat, clickLng);
        }
        this.marcador.bindPopup(`📍 ${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}`).openPopup();
      });
    } catch (err) {
      console.error('Error al iniciar mapa Leaflet:', err);
      this.mapaError.set('No se pudo cargar el mapa. Pulsa Reintentar.');
    }
  }

  guardarUbicacion(): void {
    const lat = this.latitudSel();
    const lng = this.longitudSel();
    if (!lat || !lng) return;

    const v = this.formPerfil.value;
    this.guardandoUbic.set(true);

    this.perfilService.actualizarPerfil({
      first_name: v.first_name,
      last_name: v.last_name,
      telefono: v.telefono || null,
      municipio: v.municipio ?? null,
      latitud: parseFloat(lat.toFixed(6)),
      longitud: parseFloat(lng.toFixed(6)),
    }).subscribe({
      next: (u) => {
        this.auth.actualizarUsuario(u);
        this.guardandoUbic.set(false);
        this.toast.add({
          severity: 'success',
          summary: 'Ubicación guardada',
          detail: 'Tu ubicación se actualizó correctamente',
        });
      },
      error: (err) => {
        this.guardandoUbic.set(false);
        const msg = err.error?.detail ?? err.error?._mensaje ?? 'No se pudo guardar la ubicación';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
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
    if (this.formPerfil.invalid) {
      this.formPerfil.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const v = this.formPerfil.value;

    this.perfilService.actualizarPerfil({
      first_name: v.first_name,
      last_name: v.last_name,
      telefono: v.telefono || null,
      municipio: v.municipio ?? null,
    }).subscribe({
      next: (usuario) => {
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
    if (this.formPass.invalid) {
      this.formPass.markAllAsTouched();
      return;
    }
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
        const msg =
          err.error?.password_actual?.[0] ??
          err.error?.password_nueva?.[0] ??
          err.error?.error ??
          err.error?.detail ??
          err.error?._mensaje ??
          'No se pudo cambiar la contraseña';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
