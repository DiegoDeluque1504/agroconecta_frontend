# AgroConecta — Frontend

Marketplace agrícola digital que conecta **productores rurales** con **compradores** de manera directa, transparente y eficiente.

[![Angular](https://img.shields.io/badge/Angular-20-DD0031?logo=angular)](https://angular.dev)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-20-10B981?logo=primeng)](https://primeng.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)

**Repositorio backend:** [agroconecta_backend](https://github.com/DiegoDeluque1504/agroconecta_backend)

---

## 🚀 Mejoras Recientes (Mayo 2026)

- **Mensajería en tiempo real (Polling Inteligente):** Implementación de polling silencioso y reactivo cada 15 segundos. La vista del chat se actualiza de forma transparente en segundo plano únicamente al recibir nuevos mensajes, evitando parpadeos de skeletons o interrupciones en la lectura del usuario.
- **Diseño Móvil tipo WhatsApp/Telegram:** Rediseño responsivo del módulo de negociaciones. Los paneles de lista de chat y conversación se alternan a pantalla completa de forma responsiva en móviles mediante lógica de Angular Signals. Se integró un botón de retorno táctil ("Volver") y se garantizó la correcta fijación del input de envío sobre los teclados táctiles de smartphones.
- **Notas de Voz Premium:** Nueva burbuja de audio `.audio-message-bubble` con ícono de volumen corporativo y filtros CSS WebKit inteligentes (`filter: invert(1)`) para mimetizar perfectamente la interfaz de controles multimedia nativos en burbujas verdes propias.
- **Corrección de Cancelación de Audio:** Remoción del callback asíncrono `onstop` en el `MediaRecorder` al presionar "X" de cancelación, erradicando por completo el bug de transmisión de grabaciones incompletas.

---

## Descripción del proyecto

SPA en **Angular 20** (standalone components + Signals) que consume la API Django REST con autenticación **JWT**.

- **Productores:** publicar productos, negociar, crear pedidos, actualizar estados, marcar ubicación en mapa.
- **Compradores:** explorar catálogo, iniciar negociaciones, seguir pedidos, calificar.
- **Roles duales:** un usuario puede ser productor y comprador a la vez; el rol activo depende del contexto (dueño del producto vs. quien inició la negociación).

---

## Stack tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| Angular | 20.x | Framework SPA |
| TypeScript | 5.x | Lenguaje |
| PrimeNG | 20.x | Componentes UI |
| RxJS | 7.x | HTTP reactivo |
| Leaflet | 1.9.x | Mapa de ubicación (perfil productor) |
| Angular Service Worker | 20.x | PWA |

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18.x+ (recomendado 20.x) |
| npm | 9.x+ |
| Angular CLI | 20.x |
| Backend AgroConecta | `http://localhost:8000` |

---

## Instalación

```bash
git clone https://github.com/DiegoDeluque1504/agroconecta_frontend.git
cd agroconecta_frontend
npm install
npm start
```

App en **http://localhost:4200**

### Variables de entorno

La URL del API está centralizada en `src/environments/`:

```typescript
// src/environments/environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
};

// src/environments/environment.prod.ts (producción)
export const environment = {
  production: true,
  apiUrl: 'https://agroconecta-backend-sjmy.onrender.com/api/v1',
};
```

Todos los servicios usan `environment.apiUrl`. En build de producción, `angular.json` debe incluir `fileReplacements` para sustituir `environment.ts` por `environment.prod.ts`.

```bash
npm run build   # ng build --configuration production
```

---

## Estructura del proyecto

```
src/app/
├── core/
│   ├── guards/auth.guard.ts           # authGuard, guestGuard, producerGuard, guestExplorationGuard
│   ├── interceptors/auth.interceptor.ts
│   ├── services/                      # auth, producto, negociacion, pedido, perfil, notificacion
│   ├── services/guest-exploration.service.ts
│   ├── utils/login-error.util.ts
│   └── models/index.ts
├── layout/                            # header, main-layout
└── pages/
    ├── auth/login, auth/registro, auth/verificar-email
    ├── catalogo, producto-detalle
    ├── publicar-producto, mis-productos
    ├── negociaciones, pedidos, perfil, notificaciones
```

---

## Rutas principales

| Ruta | Acceso | Descripción |
|---|---|---|
| `/auth/login` | Invitado | Login con detección de bloqueo Axes |
| `/auth/registro` | Invitado | Registro + verificación (token manual o correo) |
| `/auth/verificar-email` | Invitado | Activación por enlace `?token=` del correo |
| `/verificar-email` | Invitado | Redirige a `/auth/verificar-email` (compatibilidad) |
| `/catalogo` | Autenticado | Catálogo con búsqueda, filtros y paginación |
| `/producto/:id` | Autenticado | Detalle; botón negociar (no para el dueño) |
| `/publicar` | Productor | Crear/editar producto + galería de fotos |
| `/mis-productos` | Productor | Gestión de productos propios |
| `/negociaciones` | Autenticado | Chat, audio, crear pedido, cerrar sin acuerdo |
| `/pedidos` | Autenticado | Timeline de estados y calificación |
| `/perfil` | Autenticado | Datos, contraseña, mapa Leaflet (productor) |
| `/notificaciones` | Autenticado | Centro de notificaciones |

---

## Servicios y endpoints (alineados con el backend)

### AuthService

| Método | Endpoint |
|---|---|
| `login()` | `POST /usuarios/login/` |
| `registro()` | `POST /usuarios/registro/` |
| `verificarEmail()` | `POST /usuarios/verificar-email/` |
| `refreshToken()` | `POST /usuarios/token/refresh/` |

### ProductoService

| Método | Endpoint |
|---|---|
| `getCatalogo()` | `GET /productos/catalogo/` |
| `getDetalle()` | `GET /productos/:id/` |
| `getCategorias()` | `GET /productos/categorias/` |
| `getMunicipios()` | `GET /usuarios/municipios/` |
| `getMisProductos()` | `GET /productos/mis-productos/` |
| `publicar()` | `POST /productos/crear/` |
| `actualizar()` | `PATCH /productos/:id/gestionar/` |
| `eliminar()` | `DELETE /productos/:id/gestionar/` |
| `agregarFoto()` | `POST /productos/:id/fotos/agregar/` |
| `eliminarFoto()` | `DELETE /productos/fotos/:id/eliminar/` |

### NegociacionService

| Método | Endpoint |
|---|---|
| `getMisNegociaciones()` | `GET /negociaciones/mis-negociaciones/` |
| `getDetalle()` | `GET /negociaciones/:id/` |
| `iniciar()` | `POST /negociaciones/iniciar/:productoId/` |
| `enviarTexto()` / `enviarAudio()` | `POST /negociaciones/:id/mensajes/` |
| `cambiarEstado()` | `POST /negociaciones/:id/estado/` |

### PedidoService

| Método | Endpoint |
|---|---|
| `getMisPedidos()` | `GET /pedidos/mis-pedidos/` |
| `getDetalle()` | `GET /pedidos/:id/` |
| `crearDesdeNegociacion()` | `POST /pedidos/crear/:negociacionId/` |
| `cambiarEstado()` | `POST /pedidos/:id/estado/` |
| `calificar()` | `POST /pedidos/:id/calificar/` |

### PerfilService

| Método | Endpoint |
|---|---|
| `getMiPerfil()` | `GET /usuarios/perfil/` |
| `actualizarPerfil()` | `PUT /usuarios/perfil/` |
| `cambiarPassword()` | `POST /usuarios/cambiar-password/` |

### NotificacionService

| Método | Endpoint |
|---|---|
| `getMisNotificaciones()` | `GET /notificaciones/` |
| `getConteo()` | `GET /notificaciones/no-leidas/` |
| `marcarLeida()` | `POST /notificaciones/:id/leer/` |
| `marcarTodasLeidas()` | `POST /notificaciones/leer-todas/` |

---

## Seguridad y manejo de errores

### Interceptor HTTP (`auth.interceptor.ts`)

- Inyecta `Authorization: Bearer <token>` en peticiones protegidas
- Refresh automático ante 401
- Códigos traducidos a español (400, 403, 404, 429, 500)
- **429 / 403 `guest_exploration_limit`:** activa modo restringido y redirige a login
- **`api_rate_limit`:** límite diario de usuario autenticado

### Login y django-axes

El login distingue:

| Situación | Código | Mensaje en UI |
|---|---|---|
| Credenciales incorrectas | 401 `invalid_credentials` | Correo o contraseña incorrectos |
| IP bloqueada por Axes | 429 `axes_lockout` | Acceso bloqueado + tiempo restante |

Implementado en `core/utils/login-error.util.ts`.

### Modo restringido (visitantes)

Tras **100 peticiones/día** sin autenticarse, el backend responde `guest_exploration_limit`. El frontend:

1. Guarda estado en `sessionStorage` (`GuestExplorationService`)
2. Redirige a login con banner explicativo
3. Login y registro siguen disponibles
4. Al autenticarse, limpia el modo restringido

---

## Flujos de usuario

### Comprador

```
Registro → Verificar email (enlace del correo o token en pantalla) → Catálogo
→ Detalle → Iniciar negociación → Chat → (productor crea pedido) → Pedidos → Calificar
```

Tras verificar por enlace o token, el frontend guarda el JWT y entra al catálogo sin pasar por login.

### Productor

```
Registro → Login → Publicar producto → Negociaciones → Crear pedido (si hay acuerdo)
→ Actualizar estados → Notificaciones
```

### Negociaciones (productor)

| Acción | Cuándo |
|---|---|
| **Crear pedido** | Hubo acuerdo; negociación `abierta` |
| **Cerrar** | Sin acuerdo; pasa a `cerrada`, no se crea pedido |
| **Cancelar** | Cancelar la negociación |

---

## Guards

| Guard | Función |
|---|---|
| `authGuard` | Rutas privadas → login si no hay token |
| `guestGuard` | Login/registro → catálogo si ya hay sesión |
| `producerGuard` | Rutas de productor |
| `guestExplorationGuard` | Bloquea catálogo/detalle en modo restringido |

---

## Scripts

```bash
npm start          # ng serve (desarrollo)
npm run build      # build producción
npm test           # tests unitarios
npx ng version
```

---

## Convenciones

- Componentes **standalone** con `inject()` y **Signals**
- Control flow: `@if`, `@for`
- Patrón UI: `cargando` / `error` / contenido (skeleton + reintentar + empty state)
- Errores del backend: preferir `err.error?.error` o `err.error?.detail`

---

## Producción

### URLs desplegadas

| Recurso | URL |
|---------|-----|
| **App** | https://agroconecta-frontend-sigma.vercel.app |
| **API** | https://agroconecta-backend-sjmy.onrender.com/api/v1 |

### Vercel

| Configuración | Valor |
|---------------|--------|
| Framework | Angular |
| Build command | `ng build --configuration production` |
| Output directory | `dist/agroconecta_frontend/browser` |

> Angular 17+ genera la salida en `dist/<proyecto>/browser`. Si el output apunta solo a `dist/agroconecta_frontend`, Vercel devuelve 404.

### `angular.json` — fileReplacements

En la configuración `production` debe existir:

```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

### Verificar build

```bash
ng build --configuration production
grep -R "localhost:8000" dist/agroconecta_frontend/browser
# No debe haber coincidencias
```

### Checklist

- [x] `apiUrl` en `environment.prod.ts` apunta a Render
- [x] `fileReplacements` en `angular.json`
- [x] Output directory `.../browser` en Vercel
- [x] Ruta `/auth/verificar-email` para enlaces del correo
- [ ] Backend con dominio Resend verificado (correo a cualquier usuario)
- [ ] Íconos PWA finales en `public/`

---

## Equipo

Proyecto académico — Universidad de La Guajira, Ingeniería de Sistemas.

| Integrante | Área |
|---|---|
| Diego De Luque | Backend / coordinación |
| Carlos Basilio | Backend |
| David Royero | Frontend |
| Daniel Royero | Frontend |
