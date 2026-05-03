import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  RelatorioEspecieAlertaDTO,
  RelatorioEspecieFichaDTO,
  RelatorioEspecieFichaPageDTO,
  RelatorioEspecieFichaQueryParams
} from '../models/relatorio.model';

type ApiObject = Record<string, unknown>;
type ApiResponse = ApiObject | ApiObject[];

@Injectable({ providedIn: 'root' })
export class RelatorioEspeciesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/relatorios/especies`;

  getFichas(query: RelatorioEspecieFichaQueryParams): Observable<RelatorioEspecieFichaPageDTO> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('sort', query.sort);

    if (query.statusConservacao) {
      params = params.set('statusConservacao', query.statusConservacao);
    }

    return this.http.get<ApiResponse>(`${this.base}/fichas`, { params }).pipe(
      map((response) => this.normalizePage(response, query))
    );
  }

  getAlertasAmeacadas(): Observable<RelatorioEspecieAlertaDTO[]> {
    return this.http.get<ApiResponse>(`${this.base}/alertas-ameacadas`).pipe(
      map((response) => this.normalizeAlertas(response))
    );
  }

  private normalizePage(
    response: ApiResponse,
    query: RelatorioEspecieFichaQueryParams
  ): RelatorioEspecieFichaPageDTO {
    const payload = Array.isArray(response) ? { content: response } : response;
    const rawItems = this.readArray(payload, ['content', 'items', 'data', 'results']);

    return {
      content: rawItems.map((item) => this.normalizeFicha(item)),
      totalElements: this.readNumber(
        payload,
        ['totalElements', 'totalItems', 'total', 'count', 'totalRecords'],
        rawItems.length
      ),
      page: this.readNumber(payload, ['number', 'page', 'pageNumber'], query.page),
      size: this.readNumber(payload, ['size', 'pageSize'], query.size)
    };
  }

  private normalizeAlertas(response: ApiResponse): RelatorioEspecieAlertaDTO[] {
    const payload = Array.isArray(response) ? { content: response } : response;
    const rawItems = this.readArray(payload, ['content', 'items', 'data', 'results']);

    return rawItems
      .map((item) => this.normalizeAlerta(item))
      .filter((item) => item.statusConservacao === 'AMEACADA' && item.ativo);
  }

  private normalizeFicha(item: ApiObject): RelatorioEspecieFichaDTO {
    return {
      id: this.readId(item),
      nomeCientifico: this.readText(item, ['nomeCientifico', 'nome_cientifico']),
      nomePopular: this.readText(item, ['nomePopular', 'nome_popular']),
      familiaBotanica: this.readText(item, ['familiaBotanica', 'familia', 'familia_botanica']),
      porte: this.readText(item, ['porte']).toUpperCase(),
      statusConservacao: this.readText(item, ['statusConservacao', 'status', 'status_conservacao']).toUpperCase(),
      ativo: this.readBoolean(item, ['ativo', 'active'], true)
    };
  }

  private normalizeAlerta(item: ApiObject): RelatorioEspecieAlertaDTO {
    return {
      ...this.normalizeFicha(item),
      dataIdentificacao: this.readDateText(item, ['dataIdentificacao', 'data_identificacao', 'identificadoEm']),
      totalAreas: this.readNumber(item, ['totalAreas', 'total_areas', 'quantidadeAreas', 'areasRelacionadas'], 0)
    };
  }

  private readArray(source: ApiObject, keys: string[]): ApiObject[] {
    for (const key of keys) {
      const value = source[key];
      if (Array.isArray(value)) {
        return value as ApiObject[];
      }
    }

    return [];
  }

  private readId(source: ApiObject): number | string | null {
    const value = source['id'];
    if (typeof value === 'number' || typeof value === 'string') {
      return value;
    }
    return null;
  }

  private readText(source: ApiObject, keys: string[], fallback = '-'): string {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return fallback;
  }

  private readDateText(source: ApiObject, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private readNumber(source: ApiObject, keys: string[], fallback: number): number {
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

  private readBoolean(source: ApiObject, keys: string[], fallback: boolean): boolean {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'boolean') {
        return value;
      }

      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') {
          return true;
        }

        if (value.toLowerCase() === 'false') {
          return false;
        }
      }
    }

    return fallback;
  }
}
