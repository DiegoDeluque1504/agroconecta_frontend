import { Routes } from '@angular/router';
import { authGuard, guestGuard, producerGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  // ─── RUTAS PÚBLICAS ───────────────────────────────────────────────
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'registro',
        loadComponent: () =>
          import('./pages/auth/registro/registro.component').then((m) => m.RegistroComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // ─── RUTAS PRIVADAS (envueltas en el layout con header) ───────────
  {
    path: '',
    canActivate: [authGuard],
    // El layout principal actúa como "envoltorio" con header
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./pages/catalogo/catalogo.component').then((m) => m.CatalogoComponent),
      },
      {
        path: 'producto/:id',
        loadComponent: () =>
          import('./pages/producto-detalle/producto-detalle.component').then(
            (m) => m.ProductoDetalleComponent
          ),
      },
      {
        path: 'mis-productos',
        canActivate: [producerGuard], // Solo productores
        loadComponent: () =>
          import('./pages/mis-productos/mis-productos.component').then(
            (m) => m.MisProductosComponent
          ),
      },
      {
        path: 'publicar',
        canActivate: [producerGuard], // Solo productores
        loadComponent: () =>
          import('./pages/publicar-producto/publicar-producto.component').then(
            (m) => m.PublicarProductoComponent
          ),
      },
      {
        path: 'negociaciones',
        loadComponent: () =>
          import('./pages/negociaciones/negociaciones.component').then(
            (m) => m.NegociacionesComponent
          ),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./pages/pedidos/pedidos.component').then((m) => m.PedidosComponent),
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./pages/notificaciones/notificaciones.component').then(
            (m) => m.NotificacionesComponent
          ),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./pages/perfil/perfil.component').then((m) => m.PerfilComponent),
      },
    ],
  },

  { path: '**', redirectTo: 'catalogo' },
];
