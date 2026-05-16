import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProductoLista,
  ProductoDetalle,
  RespuestaPaginada,
  CategoriaProducto,
  Municipio,
} from '../models/index';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

export interface FiltrosCatalogo {
  search?: string;
  categoria?: number;
  municipio?: number;
  ordering?: string;
  page?: number;
}

export interface DatosProducto {
  nombre: string;
  descripcion: string;
  precio: string;
  cantidad_disponible: string;
  unidad_medida: string;
  estado?: string;
  categoria_id: number;
  municipio_id: number;
}

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private http = inject(HttpClient);

  getCatalogo(filtros: FiltrosCatalogo = {}): Observable<RespuestaPaginada<ProductoLista>> {
    let params = new HttpParams();

    if (filtros.search)    params = params.set('busqueda', filtros.search);
    if (filtros.categoria) params = params.set('categoria', filtros.categoria.toString());
    if (filtros.municipio) params = params.set('municipio', filtros.municipio.toString());
    if (filtros.ordering)  params = params.set('ordering', filtros.ordering);
    if (filtros.page)      params = params.set('page', filtros.page.toString());

    return this.http.get<RespuestaPaginada<ProductoLista>>(`${API}/productos/catalogo/`, { params });
  }

  getProducto(id: number): Observable<ProductoDetalle> {
    return this.http.get<ProductoDetalle>(`${API}/productos/${id}/`);
  }

  getCategorias(): Observable<CategoriaProducto[]> {
    return this.http.get<CategoriaProducto[]>(`${API}/productos/categorias/`);
  }

  getMisProductos(): Observable<ProductoLista[]> {
    return this.http.get<ProductoLista[]>(`${API}/productos/mis-productos/`);
  }

  getMunicipios(): Observable<Municipio[]> {
    return this.http.get<Municipio[]>(`${API}/usuarios/municipios/`);
  }

  crearProducto(datos: FormData): Observable<ProductoDetalle> {
    return this.http.post<ProductoDetalle>(`${API}/productos/crear/`, datos);
  }

  actualizarProducto(id: number, datos: FormData): Observable<ProductoDetalle> {
    return this.http.patch<ProductoDetalle>(`${API}/productos/${id}/gestionar/`, datos);
  }

  eliminarProducto(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${API}/productos/${id}/gestionar/`);
  }

  agregarFoto(productoId: number, foto: File): Observable<{ id: number; url_cloudinary: string; es_principal: boolean }> {
    const fd = new FormData();
    fd.append('foto', foto);
    return this.http.post<{ id: number; url_cloudinary: string; es_principal: boolean }>(
      `${API}/productos/${productoId}/fotos/agregar/`, fd
    );
  }

  eliminarFoto(fotoId: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${API}/productos/fotos/${fotoId}/eliminar/`);
  }
}
