import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AvatarModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  auth = inject(AuthService);
  notifService = inject(NotificacionService); // público para usarlo en el template
  private router = inject(Router);

  menuMovilAbierto = signal(false);
  menuPerfilAbierto = signal(false);

  ngOnInit(): void {
    // Carga el conteo de notificaciones no leídas al iniciar
    this.notifService.getConteo().subscribe();
  }

  get iniciales(): string {
    const u = this.auth.usuario();
    if (!u) return '?';
    return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
  }

  get nombreUsuario(): string {
    const u = this.auth.usuario();
    return u ? `${u.first_name} ${u.last_name}` : '';
  }

  toggleMenuMovil(): void {
    this.menuMovilAbierto.update((v) => !v);
    this.menuPerfilAbierto.set(false);
  }

  toggleMenuPerfil(event: Event): void {
    event.stopPropagation();
    this.menuPerfilAbierto.update((v) => !v);
    this.menuMovilAbierto.set(false);
  }

  cerrarMenus(): void {
    this.menuPerfilAbierto.set(false);
    this.menuMovilAbierto.set(false);
  }

  irA(ruta: string): void {
    this.cerrarMenus();
    this.router.navigate([ruta]);
  }

  cerrarSesion(): void {
    this.cerrarMenus();
    this.auth.logout();
  }

  @HostListener('document:click')
  onClickFuera(): void {
    this.menuPerfilAbierto.set(false);
  }
}
