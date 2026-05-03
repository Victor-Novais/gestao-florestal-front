import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  AreaFlorestal,
  AreaFlorestalFormData,
  AreaFlorestalPage,
  AreaFlorestalQueryParams
} from './area-florestal.model';

type ApiResponse = Record<string, unknown> | AreaFlorestalApiItem[];

interface AreaFlorestalApiItem extends Record<string, unknown> {
  id?: number | string | null;
  nome?: string;
  name?: string;
  tipo?: string;
  tipoArea?: string;
  bioma?: string;
  municipio?: string;
  cidade?: string;
  estado?: string;
  uf?: string;
  latitude?: number | string;
  lat?: number | string;
  longitude?: number | string;
  lng?: number | string;
  lon?: number | string;
  hectares?: number | string;
  areaHectares?: number | string;
  tamanhoHectares?: number | string;
  status?: string;
  situacao?: string;
  localizacao?: {
    municipio?: string;
    estado?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AreaFlorestalService {
  private readonly apiUrl = `${environment.apiUrl}/api/areas`;

  constructor(private readonly http: HttpClient) {}

  listAreas(query: AreaFlorestalQueryParams): Observable<AreaFlorestalPage> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size);

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.bioma) {
      params = params.set('bioma', query.bioma);
    }

    if (query.tipo) {
      params = params.set('tipoFloresta', query.tipo);
    }

    return this.http.get<ApiResponse>(this.apiUrl, { params }).pipe(
      map((response) => this.normalizePage(response, query))
    );
  }

  getAreaById(id: number | string): Observable<AreaFlorestal> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => this.normalizeArea(response as AreaFlorestalApiItem))
    );
  }

  createArea(payload: AreaFlorestalFormData): Observable<AreaFlorestal> {
    return this.http.post<Record<string, unknown>>(this.apiUrl, payload).pipe(
      map((response) => this.normalizeArea(response as AreaFlorestalApiItem))
    );
  }

  updateArea(id: number | string, payload: AreaFlorestalFormData): Observable<AreaFlorestal> {
    return this.http.put<Record<string, unknown>>(`${this.apiUrl}/${id}`, payload).pipe(
      map((response) => this.normalizeArea(response as AreaFlorestalApiItem))
    );
  }

  ativarArea(id: number | string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, {}, {
      params: new HttpParams().set('ativo', 'true')
    });
  }

  inativarArea(id: number | string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, {}, {
      params: new HttpParams().set('ativo', 'false')
    });
  }

  private normalizePage(
    response: ApiResponse,
    query: AreaFlorestalQueryParams
  ): AreaFlorestalPage {
    const payload = Array.isArray(response) ? { content: response } : response;
    const rawItems = this.readArray(payload, ['content', 'items', 'data', 'results']);

    return {
      content: rawItems.map((item) => this.normalizeArea(item)),
      totalElements: this.readNumber(payload, [
        'totalElements',
        'totalItems',
        'total',
        'count',
        'totalRecords'
      ], rawItems.length),
      page: this.readNumber(payload, ['number', 'page', 'pageNumber'], query.page),
      size: this.readNumber(payload, ['size', 'pageSize'], query.size)
    };
  }

  private normalizeArea(item: AreaFlorestalApiItem): AreaFlorestal {
    const localizacao = this.readObject(item, ['localizacao']);

    return {
      id: (item.id as number | string | null | undefined) ?? null,
      nome: this.readText(item, ['nome', 'name']),
      latitude: this.readNumber(item, ['latitude', 'lat'], 0),
      longitude: this.readNumber(item, ['longitude', 'lng', 'lon'], 0),
      tipo: this.readText(item, ['tipo', 'tipoArea', 'tipoFloresta']),
      bioma: this.readText(item, ['bioma']),
      municipio: this.readText(item, ['municipio', 'cidade'], this.readText(localizacao, ['municipio'])),
      estado: this.readText(item, ['estado', 'uf'], this.readText(localizacao, ['estado'])),
      hectares: this.readNumber(item, ['hectares', 'areaHectares', 'tamanhoHectares'], 0),
      status: this.readText(item, ['status', 'situacao']).toUpperCase()
    };
  }

  private readArray(source: Record<string, unknown>, keys: string[]): AreaFlorestalApiItem[] {
    for (const key of keys) {
      const value = source[key];
      if (Array.isArray(value)) {
        return value as AreaFlorestalApiItem[];
      }
    }

    return [];
  }

  private readObject(
    source: Record<string, unknown>,
    keys: string[]
  ): Record<string, unknown> {
    for (const key of keys) {
      const value = source[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
      }
    }

    return {};
  }

  private readText(
    source: Record<string, unknown>,
    keys: string[],
    fallback = '-'
  ): string {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return fallback;
  }

  private readNumber(
    source: Record<string, unknown>,
    keys: string[],
    fallback: number
  ): number {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return fallback;
  }
}
