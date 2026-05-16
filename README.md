# 🌿 AgroConecta — Frontend

> Marketplace agrícola digital que conecta **productores rurales** con **compradores** de manera directa, transparente y eficiente.

[![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular)](https://angular.dev)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-19-10B981?logo=primeng)](https://primeng.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Tabla de Contenidos

1. [Descripción del Proyecto](#-descripción-del-proyecto)
2. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
3. [Requisitos Previos](#-requisitos-previos)
4. [Instalación y Configuración](#-instalación-y-configuración)
5. [Estructura del Proyecto](#-estructura-del-proyecto)
6. [Arquitectura Técnica](#-arquitectura-técnica)
7. [Módulos y Páginas](#-módulos-y-páginas)
8. [Servicios y API](#-servicios-y-api)
9. [Guards y Seguridad](#-guards-y-seguridad)
10. [Modelos de Datos](#-modelos-de-datos)
11. [Flujos de Usuario](#-flujos-de-usuario)
12. [Variables de Entorno](#-variables-de-entorno)
13. [Scripts Disponibles](#-scripts-disponibles)
14. [Convenciones de Código](#-convenciones-de-código)

---

## 🌾 Descripción del Proyecto

**AgroConecta** es una plataforma web SPA (Single Page Application) desarrollada en **Angular 19** que sirve como marketplace para el sector agrícola colombiano. Permite:

- A los **productores** publicar sus productos, gestionar pedidos y negociar directamente con compradores.
- A los **compradores** explorar el catálogo, contactar productores, realizar pedidos y calificar entregas.
- A ambos roles gestionar **negociaciones en tiempo real** mediante un sistema de chat integrado.

El frontend se comunica con un backend **Django REST Framework** a través de una API RESTful con autenticación **JWT**.

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Versión | Propósito |
|---|---|---|
| [Angular](https://angular.dev) | 19.x | Framework SPA principal |
| [TypeScript](https://www.typescriptlang.org) | 5.x | Lenguaje de programación |
| [PrimeNG](https://primeng.org) | 19.x | Librería de componentes UI |
| [RxJS](https://rxjs.dev) | 7.x | Programación reactiva / HTTP |
| [Angular Signals](https://angular.dev/guide/signals) | 19 | Estado reactivo local |
| [Angular Router](https://angular.dev/guide/routing) | 19 | Enrutamiento SPA |

---

## 📦 Requisitos Previos

Antes de clonar y ejecutar el proyecto, asegúrate de tener instalado:

| Herramienta | Versión mínima | Verificación |
|---|---|---|
| [Node.js](https://nodejs.org) | **18.x** o superior | `node --version` |
| [npm](https://www.npmjs.com) | **9.x** o superior | `npm --version` |
| [Angular CLI](https://angular.dev/tools/cli) | **19.x** | `npx ng version` |
| Backend AgroConecta corriendo | — | `curl http://localhost:8000/api/v1/` |

> **⚠️ Importante:** El frontend requiere que el backend Django esté corriendo en `http://localhost:8000`. Consulta el repositorio del backend para instrucciones de instalación.

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/DiegoDeluque1504/agroconecta_frontend.git
cd agroconecta_frontend
```

### 2. Instalar dependencias

```bash
npm install
```

> Esto instalará Angular, PrimeNG y todas las dependencias listadas en `package.json`. Puede tardar 1-2 minutos.

### 3. Configurar la URL del backend

La URL base del backend se define directamente en cada servicio. Si tu backend corre en un puerto o host diferente a `http://localhost:8000`, debes actualizar la constante `API` en cada archivo de servicio:

```
src/app/core/services/auth.service.ts       → const API = 'http://localhost:8000/api/v1'
src/app/core/services/producto.service.ts   → const API = 'http://localhost:8000/api/v1'
src/app/core/services/negociacion.service.ts → const API = 'http://localhost:8000/api/v1'
src/app/core/services/pedido.service.ts     → const API = 'http://localhost:8000/api/v1'
src/app/core/services/perfil.service.ts     → const API = 'http://localhost:8000/api/v1'
src/app/core/services/notificacion.service.ts → const API = 'http://localhost:8000/api/v1'
```

### 4. Levantar el servidor de desarrollo

```bash
npm run start
# o equivalentemente:
npx ng serve
```

La aplicación estará disponible en: **http://localhost:4200**

El servidor se recarga automáticamente cuando guardas cambios en el código (Hot Module Replacement).

### 5. Build de producción (opcional)

```bash
npm run build
```

Los archivos compilados quedan en `dist/agroconecta_frontend/`.

---

## 📂 Estructura del Proyecto

```
agroconecta_frontend/
├── src/
│   ├── app/
│   │   ├── app.ts                    # Componente raíz
│   │   ├── app.config.ts             # Configuración global (HTTP, Router, Animations, PrimeNG)
│   │   ├── app.routes.ts             # Definición de todas las rutas
│   │   │
│   │   ├── core/                     # Lógica central (singleton)
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts     # authGuard, guestGuard, producerGuard
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts  # JWT + manejo global de errores HTTP
│   │   │   ├── models/
│   │   │   │   └── index.ts          # Todas las interfaces TypeScript
│   │   │   └── services/
│   │   │       ├── auth.service.ts      # Login, registro, tokens JWT
│   │   │       ├── producto.service.ts  # CRUD productos, categorías, municipios
│   │   │       ├── negociacion.service.ts # Chat y negociaciones
│   │   │       ├── pedido.service.ts    # Pedidos y estados
│   │   │       ├── perfil.service.ts    # Perfil de usuario
│   │   │       └── notificacion.service.ts # Notificaciones
│   │   │
│   │   ├── layout/                   # Componentes de estructura global
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts
│   │   │   │   ├── header.component.html
│   │   │   │   └── header.component.css
│   │   │   └── main-layout/
│   │   │       └── main-layout.component.ts  # Router outlet principal
│   │   │
│   │   └── pages/                    # Páginas de la aplicación (lazy loading)
│   │       ├── auth/
│   │       │   ├── login/            # Página de inicio de sesión
│   │       │   └── registro/         # Página de registro
│   │       ├── catalogo/             # Catálogo público de productos
│   │       ├── producto-detalle/     # Detalle de un producto
│   │       ├── publicar-producto/    # Formulario de publicación (solo productores)
│   │       ├── mis-productos/        # Gestión de productos propios (solo productores)
│   │       ├── negociaciones/        # Chat entre comprador y productor
│   │       ├── pedidos/              # Historial y gestión de pedidos
│   │       ├── perfil/               # Perfil y contraseña
│   │       └── notificaciones/       # Centro de notificaciones
│   │
│   ├── styles.css                    # Estilos globales y tema PrimeNG
│   └── main.ts                       # Bootstrap de la aplicación
│
├── public/                           # Assets estáticos
├── angular.json                      # Configuración del workspace Angular
├── tsconfig.app.json                 # Configuración TypeScript
└── package.json                      # Dependencias npm
```

---

## 🏗️ Arquitectura Técnica

### Patrón General

```
Usuario → Componente (página) → Servicio → HTTP Interceptor → Backend API
                ↓
          Angular Signals
         (estado reactivo)
```

### Configuración de la App (`app.config.ts`)

La app usa **standalone components** (sin NgModules). La configuración global incluye:

```typescript
provideRouter(routes)           // Enrutamiento con lazy loading
provideHttpClient(withInterceptors([authInterceptor]))  // HTTP + JWT automático
provideAnimations()             // Animaciones para PrimeNG Toast
providePrimeNG({ theme: ... })  // Tema verde personalizado
```

### Estado Reactivo con Signals

Todos los componentes usan `signal<T>()` de Angular para el estado local, en lugar de variables simples. Esto garantiza detección de cambios eficiente:

```typescript
productos = signal<ProductoLista[]>([]);
cargando  = signal(true);
error     = signal<string | null>(null);
```

### Lazy Loading

Todas las páginas se cargan bajo demanda (`loadComponent`). El bundle inicial es ~560kB gzipado; las páginas se descargan solo cuando el usuario las visita.

---

## 📄 Módulos y Páginas

### 🔐 Autenticación (`/auth`)

| Ruta | Componente | Descripción |
|---|---|---|
| `/auth/login` | `LoginComponent` | Formulario con email/contraseña. Redirige a `/catalogo` si el login es exitoso. Muestra toast de error si las credenciales son incorrectas. Timeout de 15s para evitar carga infinita. |
| `/auth/registro` | `RegistroComponent` | Registro con selección de roles (Productor / Comprador, ambos simultáneos). Incluye campo de confirmación de contraseña y validación de mínimo 8 caracteres. |

> Ambas rutas están protegidas por `guestGuard`: si el usuario ya está autenticado, es redirigido a `/catalogo`.

---

### 🛒 Catálogo (`/catalogo`)

**Acceso:** Solo usuarios autenticados.

Muestra todos los productos activos del sistema con:
- **Barra de búsqueda** por nombre (filtro en tiempo real con debounce de 400ms)
- **Filtro por categoría** (dropdown con categorías del backend)
- **Paginación** (12 productos por página)
- **Skeleton loading** mientras carga
- **Estado de error** con botón "Reintentar" si la carga falla
- **Estado vacío** con mensaje informativo si no hay productos

---

### 📦 Detalle de Producto (`/producto/:id`)

Muestra la información completa de un producto:
- Imagen, nombre, descripción, precio, cantidad disponible, municipio
- Información del productor
- Botón **"Iniciar Negociación"** (solo compradores): crea o reanuda una negociación con el productor
- Botón **"Agregar al pedido"**: crea un pedido directamente

---

### 📝 Publicar Producto (`/publicar`) — *Solo Productores*

Formulario completo para publicar un nuevo producto:
- Nombre, descripción, precio, cantidad, unidad de medida
- Selección de categoría y municipio
- **Subida de imagen** con preview visual antes de guardar
- Validación completa del formulario con mensajes de error

---

### 📋 Mis Productos (`/mis-productos`) — *Solo Productores*

Panel de gestión de los productos propios:
- Lista de todos los productos del productor autenticado
- **Editar** producto (inline o modal)
- **Eliminar** producto con confirmación
- **Cambiar estado** (activo/inactivo)
- Skeleton loading y empty state

---

### 💬 Negociaciones (`/negociaciones`)

Interfaz de chat estilo WhatsApp Web:
- **Panel izquierdo:** Lista de todas las negociaciones con preview del último mensaje y badge de mensajes no leídos
- **Panel derecho:** Conversación activa con burbujas de mensajes diferenciadas (propio/otro)
- Envío de mensajes con Enter o botón
- Acciones según rol:
  - **Productor:** puede "Cerrar" una negociación
  - **Comprador:** puede "Cancelar" una negociación
- Estados de negociación: `abierta` · `cerrada` · `cancelada`
- Scroll automático al último mensaje

---

### 🚚 Pedidos (`/pedidos`)

Gestión de pedidos con interfaz de dos paneles:
- **Panel izquierdo:** Lista de pedidos con nombre del producto, contraparte, precio y estado
- **Panel derecho:** Detalle del pedido seleccionado con timeline del historial de estados

**Flujo de estados (solo productores pueden cambiarlos):**
```
confirmado → en_preparacion → en_camino → entregado
     └──────────────────────────────────→ cancelado
```

**Calificación:** El comprador puede calificar el pedido (1-5 estrellas + comentario) una vez esté `entregado`.

---

### 🔔 Notificaciones (`/notificaciones`)

Centro de notificaciones del sistema:
- Lista de todas las notificaciones con indicador de leído/no leído
- Marcar como leída individualmente o todas a la vez
- Badge en el header con conteo de notificaciones no leídas (se actualiza cada vez que se entra a la página)

---

### 👤 Perfil (`/perfil`)

Gestión del perfil de usuario:
- Muestra avatar con iniciales, nombre completo, email y roles
- **Skeleton loading** mientras carga los datos frescos del servidor
- **Formulario de datos personales:** nombre, apellido, teléfono, municipio
- **Formulario de cambio de contraseña:** contraseña actual + nueva (mínimo 8 caracteres)

---

## 🔌 Servicios y API

Todos los servicios usan `HttpClient` con el interceptor de autenticación aplicado automáticamente.

### `AuthService`

| Método | Endpoint | Descripción |
|---|---|---|
| `login(email, password)` | `POST /usuarios/login/` | Autenticación, guarda tokens en localStorage |
| `registro(data)` | `POST /usuarios/registro/` | Registro de nuevo usuario |
| `refreshToken()` | `POST /usuarios/token/refresh/` | Renueva el access token usando el refresh token |
| `logout()` | — | Limpia localStorage y redirige a `/auth/login` |
| `token()` | — | Signal con el access token actual |
| `usuario()` | — | Signal con los datos del usuario autenticado |
| `esProductor()` | — | Computed: `true` si el usuario tiene rol de productor |

### `ProductoService`

| Método | Endpoint | Descripción |
|---|---|---|
| `getCatalogo(params)` | `GET /productos/` | Lista paginada con filtros (búsqueda, categoría) |
| `getDetalle(id)` | `GET /productos/:id/` | Detalle de un producto |
| `getMisProductos()` | `GET /productos/mis-productos/` | Productos del productor autenticado |
| `publicar(formData)` | `POST /productos/` | Crea un nuevo producto con imagen |
| `actualizar(id, data)` | `PATCH /productos/:id/` | Actualiza un producto |
| `eliminar(id)` | `DELETE /productos/:id/` | Elimina un producto |
| `getCategorias()` | `GET /categorias/` | Lista de categorías |
| `getMunicipios()` | `GET /municipios/` | Lista de municipios |

### `NegociacionService`

| Método | Endpoint | Descripción |
|---|---|---|
| `getMisNegociaciones()` | `GET /negociaciones/` | Lista de negociaciones del usuario |
| `getDetalle(id)` | `GET /negociaciones/:id/` | Detalle con todos los mensajes |
| `iniciar(productoId)` | `POST /negociaciones/` | Inicia o reanuda una negociación |
| `enviarTexto(id, texto)` | `POST /negociaciones/:id/mensajes/` | Envía un mensaje de texto |
| `cambiarEstado(id, estado)` | `PATCH /negociaciones/:id/` | Cambia estado (cerrada/cancelada) |

### `PedidoService`

| Método | Endpoint | Descripción |
|---|---|---|
| `getMisPedidos()` | `GET /pedidos/mis-pedidos/` | Pedidos del usuario (comprador o productor) |
| `getDetalle(id)` | `GET /pedidos/:id/` | Detalle con historial de estados |
| `cambiarEstado(id, estado, obs)` | `PATCH /pedidos/:id/estado/` | Cambia estado (solo productor) |
| `calificar(id, puntos, comentario)` | `POST /pedidos/:id/calificar/` | Califica un pedido entregado |

### `PerfilService`

| Método | Endpoint | Descripción |
|---|---|---|
| `getMiPerfil()` | `GET /usuarios/perfil/` | Obtiene datos frescos del usuario |
| `actualizarPerfil(data)` | `PATCH /usuarios/perfil/` | Actualiza nombre, teléfono, municipio |
| `cambiarPassword(actual, nueva)` | `POST /usuarios/cambiar-password/` | Cambia la contraseña |

### `NotificacionService`

| Método | Endpoint | Descripción |
|---|---|---|
| `getMisNotificaciones()` | `GET /notificaciones/` | Lista de notificaciones |
| `getConteo()` | `GET /notificaciones/no-leidas/` | Número de notificaciones no leídas |
| `marcarLeida(id)` | `PATCH /notificaciones/:id/` | Marca una notificación como leída |
| `marcarTodasLeidas()` | `POST /notificaciones/marcar-todas/` | Marca todas como leídas |

---

## 🛡️ Guards y Seguridad

El archivo `src/app/core/guards/auth.guard.ts` contiene tres guards:

| Guard | Propósito | Redirige a |
|---|---|---|
| `authGuard` | Protege rutas privadas. Verifica que haya token en localStorage. | `/auth/login` si no autenticado |
| `guestGuard` | Protege rutas de auth. Evita que usuarios logueados vean login/registro. | `/catalogo` si ya autenticado |
| `producerGuard` | Protege rutas exclusivas de productores. | `/catalogo` si no es productor |

### Interceptor HTTP (`auth.interceptor.ts`)

El interceptor se ejecuta **automáticamente en cada petición HTTP** y hace:

1. **Inyecta el JWT** en el header `Authorization: Bearer <token>` (excepto en rutas de auth)
2. **Refresh automático:** Si recibe un `401`, intenta renovar el token con el refresh token. Si el refresh también falla, cierra sesión automáticamente.
3. **Mensajes de error enriquecidos:** Convierte códigos HTTP a mensajes legibles en español:
   - `0` → "No se pudo conectar con el servidor"
   - `400` → "Solicitud incorrecta. Verifica los datos enviados."
   - `403` → "No tienes permiso para realizar esta acción."
   - `404` → "El recurso solicitado no fue encontrado."
   - `500` → "Error interno del servidor. Intenta más tarde."

---

## 📐 Modelos de Datos

Todas las interfaces TypeScript están centralizadas en `src/app/core/models/index.ts`:

```typescript
// Autenticación
interface RespuestaLogin { access: string; refresh: string; user: Usuario; }
interface Usuario {
  id: number; email: string; first_name: string; last_name: string;
  es_productor: boolean; es_comprador: boolean;
  telefono?: string; municipio?: number;
}

// Productos
interface ProductoLista { id: number; nombre: string; precio: number; foto?: string; ... }
interface ProductoDetalle extends ProductoLista { descripcion: string; productor_nombre: string; ... }
interface CategoriaProducto { id: number; nombre: string; }
interface Municipio { id: number; nombre: string; }

// Negociaciones
interface NegociacionLista { id: number; producto_nombre: string; estado: string; ... }
interface NegociacionDetalle extends NegociacionLista { mensajes: Mensaje[]; }
interface Mensaje { id: number; tipo: 'texto' | 'audio'; contenido?: string; remitente: number; ... }

// Pedidos
type EstadoPedido = 'confirmado' | 'en_preparacion' | 'en_camino' | 'entregado' | 'cancelado';
interface PedidoLista { id: number; producto_nombre: string; estado_actual: EstadoPedido; ... }
interface PedidoDetalle extends PedidoLista { historial: HistorialEstado[]; }

// Notificaciones
interface Notificacion { id: number; titulo: string; mensaje: string; leida: boolean; ... }
```

---

## 🔄 Flujos de Usuario

### Flujo de Comprador

```
Registro (rol: comprador)
  → Login
  → Catálogo (buscar/filtrar productos)
  → Detalle del producto
  → Iniciar negociación (chat con productor)
  → Acordar precio → Productor crea pedido
  → Pedidos (seguir estado: confirmado → entregado)
  → Calificar entrega (1-5 ⭐)
```

### Flujo de Productor

```
Registro (rol: productor)
  → Login
  → Publicar producto (foto + datos)
  → Mis Productos (editar/activar/desactivar)
  → Negociaciones (responder compradores)
  → Pedidos (cambiar estado del pedido)
  → Notificaciones (alertas del sistema)
```

---

## ⚙️ Variables de Entorno

Actualmente la URL del backend está hardcodeada como `http://localhost:8000/api/v1` en cada servicio. Para futuros entornos (staging, producción), se recomienda mover esta URL a `src/environments/environment.ts`:

```typescript
// src/environments/environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1'
};

// src/environments/environment.prod.ts (producción)
export const environment = {
  production: true,
  apiUrl: 'https://api.tudominio.com/api/v1'
};
```

Y en cada servicio reemplazar:
```typescript
// Antes:
const API = 'http://localhost:8000/api/v1';

// Después:
import { environment } from '../../../environments/environment';
const API = environment.apiUrl;
```

---

## 📜 Scripts Disponibles

```bash
# Servidor de desarrollo (con hot reload)
npm start
# o
npx ng serve

# Build de producción
npm run build

# Ejecutar tests unitarios
npm test

# Ver versión de Angular CLI
npx ng version
```

---

## 📏 Convenciones de Código

### Nombres de archivos
- Componentes: `nombre-pagina.component.ts` / `.html` / `.css`
- Servicios: `nombre.service.ts`
- Guards: `nombre.guard.ts`
- Modelos: `index.ts` (archivo único centralizado)

### Estilo de componentes
- Todos los componentes son **standalone** (sin NgModules)
- Estado local con **Angular Signals** (`signal<T>()`)
- Inyección de dependencias con `inject()` (no constructor)
- Templates con **control flow** de Angular 17+ (`@if`, `@for`, `@else`)

### Manejo de errores en componentes

```typescript
this.servicio.getData().subscribe({
  next: (data) => {
    this.datos.set(data);
    this.cargando.set(false);
  },
  error: (err) => {
    this.cargando.set(false);
    // Usa el mensaje del interceptor si está disponible
    const msg = err.error?.detail ?? err.error?._mensaje ?? 'Mensaje genérico';
    this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
  },
});
```

### Estados de UI (patrón de 3 estados)

Toda página con datos asíncronos implementa el patrón de **3 estados**:

```html
<!-- 1. Loading -->
@if (cargando()) { <p-skeleton /> }

<!-- 2. Error -->
@if (!cargando() && error()) {
  <div class="error-state">
    <p>{{ error() }}</p>
    <button (click)="cargar()">Reintentar</button>
  </div>
}

<!-- 3. Contenido (con empty state si lista vacía) -->
@if (!cargando() && !error()) {
  @if (datos().length === 0) { <div class="empty-state">Sin resultados</div> }
  @else { <!-- lista de items --> }
}
```

---

## 👥 Equipo

Proyecto académico desarrollado por el equipo de **AgroConecta**.

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Ver [LICENSE](LICENSE) para más detalles.
