import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { EspecieFormData, EspeciePage, EspecieQueryParams, EspecieVegetal } from './especie.model';

type ApiResponse = Record<string, unknown> | EspecieApiItem[];

interface EspecieApiItem extends Record<string, unknown> {
  id?: number | string | null;
  nomeCientifico?: string;
  nomePopular?: string;
  familiaBotanica?: string;
  familia?: string;
  porte?: string;
  statusConservacao?: string;
  status?: string;
  cicloVida?: number | string;
  ciclo?: number | string;
  exigenciasClimaticas?: string;
  clima?: string;
  exigenciasSolo?: string;
  solo?: string;
  nativa?: boolean | string;
  exotica?: boolean | string;
  ativo?: boolean | string;
}

@Injectable({ providedIn: 'root' })
export class EspecieService {
  private readonly apiUrl = `${environment.apiUrl}/api/especies`;

  constructor(private readonly http: HttpClient) {}

  listEspecies(query: EspecieQueryParams): Observable<EspeciePage> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size);

    if (query.statusConservacao) {
      params = params.set('statusConservacao', query.statusConservacao);
    }

    if (query.porte) {
      params = params.set('porte', query.porte);
    }

    if (query.ativo !== null && query.ativo !== undefined) {
      params = params.set('ativo', `${query.ativo}`);
    }

    return this.http.get<ApiResponse>(this.apiUrl, { params }).pipe(
      map((response) => this.normalizePage(response, query))
    );
  }

  listAlertas(): Observable<EspecieVegetal[]> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/alertas`).pipe(
      map((response) => this.normalizeAlertas(response))
    );
  }

  getEspecieById(id: number | string): Observable<EspecieVegetal> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => this.normalizeItem(response as EspecieApiItem))
    );
  }

  createEspecie(payload: EspecieFormData): Observable<EspecieVegetal> {
    return this.http.post<Record<string, unknown>>(this.apiUrl, payload).pipe(
      map((response) => this.normalizeItem(response as EspecieApiItem))
    );
  }

  updateEspecie(id: number | string, payload: EspecieFormData): Observable<EspecieVegetal> {
    return this.http.put<Record<string, unknown>>(`${this.apiUrl}/${id}`, payload).pipe(
      map((response) => this.normalizeItem(response as EspecieApiItem))
    );
  }

  ativar(id: number | string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, {}, {
      params: new HttpParams().set('ativo', 'true')
    });
  }

  inativar(id: number | string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, {}, {
      params: new HttpParams().set('ativo', 'false')
    });
  }

  private normalizePage(response: ApiResponse, query: EspecieQueryParams): EspeciePage {
    const payload = Array.isArray(response) ? { content: response } : response;
    const rawItems = this.readArray(payload, ['content', 'items', 'data', 'results']);

    return {
      content: rawItems.map((item) => this.normalizeItem(item)),
      totalElements: this.readNumber(payload, ['totalElements', 'totalItems', 'total', 'count', 'totalRecords'], rawItems.length),
      page: this.readNumber(payload, ['number', 'page', 'pageNumber'], query.page),
      size: this.readNumber(payload, ['size', 'pageSize'], query.size)
    };
  }

  private normalizeAlertas(response: ApiResponse): EspecieVegetal[] {
    const payload = Array.isArray(response) ? { content: response } : response;
    const rawItems = this.readArray(payload, ['content', 'items', 'data', 'results']);
    return rawItems
      .map((item) => this.normalizeItem(item))
      .filter((item) => item.statusConservacao === 'AMEACADA' && item.ativo);
  }

  private normalizeItem(item: EspecieApiItem): EspecieVegetal {
    return {
      id: (item.id as number | string | null | undefined) ?? null,
      nomeCientifico: this.readText(item, ['nomeCientifico']),
      nomePopular: this.readText(item, ['nomePopular']),
      familiaBotanica: this.readText(item, ['familiaBotanica', 'familia']),
      porte: this.readText(item, ['porte']).toUpperCase(),
      statusConservacao: this.readText(item, ['statusConservacao', 'status']).toUpperCase(),
      cicloVida: this.readNumber(item, ['cicloVida', 'ciclo', 'cicloVidaAnos'], 0),
      exigenciasClimaticas: this.readText(item, ['exigenciasClimaticas', 'clima']),
      exigenciasSolo: this.readText(item, ['exigenciasSolo', 'solo']),
      nativa: this.readNative(item),
      ativo: this.readBoolean(item, ['ativo'], true)
    };
  }

  private readArray(source: Record<string, unknown>, keys: string[]): EspecieApiItem[] {
    for (const key of keys) {
      const value = source[key];
      if (Array.isArray(value)) {
        return value as EspecieApiItem[];
      }
    }

    return [];
  }

  private readText(source: Record<string, unknown>, keys: string[], fallback = '-'): string {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return fallback;
  }

  private readNumber(source: Record<string, unknown>, keys: string[], fallback: number): number {
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

  private readBoolean(source: Record<string, unknown>, keys: string[], fallback: boolean): boolean {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'boolean') {
        return value;
      }

      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
      }
    }

    return fallback;
  }

  private readNative(source: Record<string, unknown>): boolean {
    if ('nativa' in source) {
      return this.readBoolean(source, ['nativa'], true);
    }

    if ('exotica' in source) {
      return !this.readBoolean(source, ['exotica'], false);
    }

    return true;
  }
}
