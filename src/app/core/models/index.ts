// ============================================================
// MODELOS DE AGROCONECTA
// Representan exactamente la estructura JSON que devuelve
// el backend Django. Si el backend cambia un campo,
// también debe cambiarse aquí.
// ============================================================

// ------------------------------------------------------------
// MUNICIPIO
// Tabla de referencia con los 15 municipios de La Guajira
// ------------------------------------------------------------
export interface Municipio {
  id: number;
  nombre: string;
  codigo_dane: string;
}

// ------------------------------------------------------------
// USUARIO
// Puede ser productor, comprador o ambos simultáneamente
// ------------------------------------------------------------
export interface Usuario {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  telefono: string | null;
  es_productor: boolean;
  es_comprador: boolean;
  email_verificado: boolean;
  latitud: number | null;
  longitud: number | null;
  calificacion_promedio: number;
  total_calificaciones: number;
  municipio: number | null;
  municipio_detalle: Municipio | null;
  created_at: string;
}

// ------------------------------------------------------------
// AUTENTICACIÓN
// Estructura de la respuesta del login y verificación
// ------------------------------------------------------------
export interface TokensJWT {
  access: string;
  refresh: string;
}

export interface RespuestaLogin {
  tokens: TokensJWT;
  usuario: Usuario;
}

export interface RespuestaRegistro {
  mensaje: string;
  email: string;
}

export interface RespuestaVerificacion {
  mensaje: string;
  tokens: TokensJWT;
  usuario: Usuario;
}

// ------------------------------------------------------------
// CATEGORÍA DE PRODUCTO
// Tabla fija con 8 categorías agrícolas
// ------------------------------------------------------------
export interface CategoriaProducto {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
}

// ------------------------------------------------------------
// FOTO DE PRODUCTO
// Cada producto puede tener varias fotos en Cloudinary
// ------------------------------------------------------------
export interface FotoProducto {
  id: number;
  url_cloudinary: string;
  public_id_cloudinary: string;
  es_principal: boolean;
  orden: number;
}

// ------------------------------------------------------------
// PRODUCTO
// Versión ligera para el catálogo (menos datos, más rápido)
// ------------------------------------------------------------
export interface ProductoLista {
  id: number;
  nombre: string;
  precio: string;
  cantidad_disponible: string;
  unidad_medida: string;
  estado: string;
  categoria_nombre: string;
  municipio_nombre: string;
  productor_nombre: string;
  foto_principal: string | null;
}

// Versión completa para el detalle del producto
export interface ProductoDetalle {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  cantidad_disponible: string;
  unidad_medida: string;
  estado: string;
  categoria: CategoriaProducto;
  municipio: Municipio;
  fotos: FotoProducto[];
  productor: {
    id: number;
    nombre: string;
    municipio: string | null;
    calificacion_promedio: number;
    total_calificaciones: number;
    latitud: number | null;
    longitud: number | null;
  };
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------
// PAGINACIÓN
// Estructura que devuelve el catálogo con paginación
// ------------------------------------------------------------
export interface RespuestaPaginada<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ------------------------------------------------------------
// MENSAJE
// Puede ser texto o audio dentro de una negociación
// ------------------------------------------------------------
export interface Mensaje {
  id: number;
  tipo: 'texto' | 'audio';
  contenido: string | null;
  url_audio: string | null;
  leido: boolean;
  leido_en: string | null;
  created_at: string;
  remitente: number;
  remitente_nombre: string;
}

// ------------------------------------------------------------
// NEGOCIACIÓN
// Versión ligera para la lista de chats
// ------------------------------------------------------------
export interface NegociacionLista {
  id: number;
  estado: 'abierta' | 'cerrada' | 'cancelada';
  producto_nombre: string;
  producto_foto: string | null;
  comprador_nombre: string;
  productor_nombre: string;
  ultimo_mensaje: string | null;
  mensajes_no_leidos: number;
  created_at: string;
  updated_at: string;
}

// Versión completa con todos los mensajes
export interface NegociacionDetalle {
  id: number;
  estado: 'abierta' | 'cerrada' | 'cancelada';
  producto_id: number;
  producto_nombre: string;
  comprador_id: number;
  comprador_nombre: string;
  productor_id: number;
  productor_nombre: string;
  mensajes: Mensaje[];
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------
// PEDIDO
// Versión ligera para la lista de pedidos
// ------------------------------------------------------------
export interface PedidoLista {
  id: number;
  estado_actual: EstadoPedido;
  cantidad_acordada: string;
  precio_acordado: string;
  precio_total: string;
  producto_nombre: string;
  comprador_nombre: string;
  productor_nombre: string;
  created_at: string;
}

// Estados posibles de un pedido
export type EstadoPedido =
  | 'confirmado'
  | 'en_preparacion'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

// Versión completa con historial y calificaciones
export interface PedidoDetalle {
  id: number;
  estado_actual: EstadoPedido;
  cantidad_acordada: string;
  precio_acordado: string;
  precio_total: string;
  direccion_entrega: string | null;
  notas_entrega: string | null;
  producto_nombre: string;
  producto_id: number;
  comprador_nombre: string;
  productor_nombre: string;
  historial_estados: HistorialEstado[];
  calificaciones: Calificacion[];
  ya_califique: boolean;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------
// HISTORIAL DE ESTADO
// Cada cambio de estado del pedido queda registrado
// ------------------------------------------------------------
export interface HistorialEstado {
  id: number;
  estado: EstadoPedido;
  observacion: string | null;
  latitud: number | null;
  longitud: number | null;
  created_at: string;
  registrado_por: number;
  registrado_por_nombre: string;
}

// ------------------------------------------------------------
// CALIFICACIÓN
// Calificación mutua entre comprador y productor
// ------------------------------------------------------------
export interface Calificacion {
  id: number;
  puntuacion: number;
  comentario: string | null;
  created_at: string;
  calificador: number;
  calificador_nombre: string;
  calificado: number;
  calificado_nombre: string;
}

// ------------------------------------------------------------
// NOTIFICACIÓN
// Notificaciones persistentes en base de datos
// ------------------------------------------------------------
export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  leida_en: string | null;
  url_destino: string | null;
  created_at: string;
}

export interface ConteoNotificaciones {
  no_leidas: number;
}