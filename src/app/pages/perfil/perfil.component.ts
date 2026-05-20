import { Component, inject, OnInit, OnDestroy, signal, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID } from '@angular/core';
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
export class PerfilComponent implements OnInit, OnDestroy {
  @ViewChild('mapaContainer') mapaContainer!: ElementRef;

  private fb             = inject(FormBuilder);
  auth                   = inject(AuthService);
  private perfilService  = inject(PerfilService);
  private productoService = inject(ProductoService);
  private toast          = inject(MessageService);
  private platformId     = inject(PLATFORM_ID);

  municipios      = signal<Municipio[]>([]);
  guardando       = signal(false);
  cambiandoPass   = signal(false);
  cargandoPerfil  = signal(true);
  guardandoUbic   = signal(false);

  // Coordenadas seleccionadas en el mapa
  latitudSel  = signal<number | null>(null);
  longitudSel = signal<number | null>(null);

  // Instancia del mapa Leaflet (any para evitar imports en SSR)
  private mapa: any = null;
  private marcador: any = null;

  formPerfil: FormGroup = this.fb.group({
    first_name: ['', Validators.required],
    last_name:  ['', Validators.required],
    telefono:   [''],
    municipio:  [null],
  });

  formPass: FormGroup = this.fb.group({
    actual: ['', Validators.required],
    nueva:  ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.productoService.getMunicipios().subscribe({
      next: (m) => this.municipios.set(m),
    });

    this.perfilService.getMiPerfil().subscribe({
      next: (u) => {
        this.auth.actualizarUsuario(u);
        this.formPerfil.patchValue({
          first_name: u.first_name,
          last_name:  u.last_name,
          telefono:   u.telefono ?? '',
          municipio:  u.municipio ?? null,
        });
        // Carga coordenadas existentes si las tiene
        if (u.latitud && u.longitud) {
          this.latitudSel.set(Number(u.latitud));
          this.longitudSel.set(Number(u.longitud));
        }
        this.cargandoPerfil.set(false);
        // Inicializa el mapa después de que Angular renderice el div
        if (this.auth.esProductor()) {
          setTimeout(() => this.iniciarMapa(), 100);
        }
      },
      error: () => {
        const u = this.auth.usuario();
        if (u) {
          this.formPerfil.patchValue({
            first_name: u.first_name,
            last_name:  u.last_name,
            telefono:   u.telefono ?? '',
            municipio:  u.municipio ?? null,
          });
          if (u.latitud && u.longitud) {
            this.latitudSel.set(Number(u.latitud));
            this.longitudSel.set(Number(u.longitud));
          }
        }
        this.cargandoPerfil.set(false);
        if (this.auth.esProductor()) {
          setTimeout(() => this.iniciarMapa(), 100);
        }
      },
    });
  }

  ngOnDestroy(): void {
    if (this.mapa) {
      this.mapa.remove();
      this.mapa = null;
    }
  }

  private async iniciarMapa(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.mapaContainer?.nativeElement) return;

    // Importación dinámica para evitar errores en SSR
    const L = await import('leaflet');

    // Corrige el ícono del marcador (problema conocido de Leaflet + bundlers)
    const iconDefault = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;

    // Centro inicial: La Guajira, Colombia
    const lat = this.latitudSel() ?? 11.5444;
    const lng = this.longitudSel() ?? -72.9072;

    this.mapa = L.map(this.mapaContainer.nativeElement).setView([lat, lng], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.mapa);

    // Si ya tiene ubicación, coloca el marcador
    if (this.latitudSel() && this.longitudSel()) {
      this.marcador = L.marker([lat, lng]).addTo(this.mapa)
        .bindPopup('Tu ubicación actual').openPopup();
    }

    // Clic en el mapa → mueve el marcador y actualiza las coordenadas
    this.mapa.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.latitudSel.set(parseFloat(lat.toFixed(6)));
      this.longitudSel.set(parseFloat(lng.toFixed(6)));

      if (this.marcador) {
        this.marcador.setLatLng([lat, lng]);
      } else {
        this.marcador = L.marker([lat, lng]).addTo(this.mapa)
          .bindPopup('Tu ubicación seleccionada').openPopup();
      }
      this.marcador.bindPopup(`📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`).openPopup();
    });
  }

  guardarUbicacion(): void {
    const lat = this.latitudSel();
    const lng = this.longitudSel();
    if (!lat || !lng) return;

    const v = this.formPerfil.value;
    this.guardandoUbic.set(true);

    // PUT requiere todos los campos — combinamos perfil + coordenadas
    this.perfilService.actualizarPerfil({
      first_name: v.first_name,
      last_name:  v.last_name,
      telefono:   v.telefono || null,
      municipio:  v.municipio ?? null,
      latitud:    parseFloat(lat.toFixed(6)),
      longitud:   parseFloat(lng.toFixed(6)),
    }).subscribe({
      next: (u) => {
        this.auth.actualizarUsuario(u);
        this.guardandoUbic.set(false);
        this.toast.add({ severity: 'success', summary: 'Ubicación guardada', detail: 'Tu ubicación se actualizó correctamente' });
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