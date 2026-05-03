import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AreaConsolidadoBiomaDTO,
  AreaConsolidadoBreakdownDTO,
  AreaConsolidadoResponseDTO,
  AreaConsolidadoStatusDTO,
  AreaConsolidadoTipoDTO
} from '../models/relatorio.model';

type ApiObject = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class RelatorioAreasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/relatorios/areas`;

  getConsolidado(status?: string | null): Observable<AreaConsolidadoResponseDTO> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiObject>(`${this.base}/consolidado`, { params }).pipe(
      map((response) => this.normalizeResponse(response, status ?? null))
    );
  }

  private normalizeResponse(source: ApiObject, statusFiltro: string | null): AreaConsolidadoResponseDTO {
    const agrupadoPorBioma = this.normalizeBiomas(this.readArray(source, [
      'agrupadoPorBioma',
      'biomas',
      'porBioma',
      'itensBioma'
    ]));

    const agrupadoPorTipo = this.normalizeTipos(this.readArray(source, [
      'agrupadoPorTipo',
      'tipos',
      'porTipo',
      'itensTipo'
    ]));

    const totaisPorStatus = this.normalizeStatus(this.readArray(source, [
      'totaisPorStatus',
      'status',
      'porStatus'
    ]), statusFiltro, agrupadoPorBioma, agrupadoPorTipo);

    const totalAreas = this.readNumber(source, ['totalAreas', 'quantidadeAreas'], null)
      ?? this.sumAreas(agrupadoPorBioma, agrupadoPorTipo);
    const totalHectares = this.readNumber(source, ['totalHectares', 'hectares'], null)
      ?? this.sumHectares(agrupadoPorBioma, agrupadoPorTipo);

    return {
      statusFiltro,
      totalAreas,
      totalHectares,
      totaisPorStatus,
      agrupadoPorBioma,
      agrupadoPorTipo
    };
  }

  private normalizeBiomas(items: ApiObject[]): AreaConsolidadoBiomaDTO[] {
    return items.map((item) => ({
      bioma: this.readText(item, ['bioma', 'nome'], '-'),
      totalAreas: this.readNumber(item, ['totalAreas', 'quantidadeAreas'], 0) ?? 0,
      totalHectares: this.readNumber(item, ['totalHectares', 'hectares'], 0) ?? 0,
      breakdown: this.normalizeBreakdown(this.readArray(item, ['breakdown', 'tipos', 'detalhes']))
    }));
  }

  private normalizeBreakdown(items: ApiObject[]): AreaConsolidadoBreakdownDTO[] {
    return items.map((item) => ({
      tipo: this.readText(item, ['tipo', 'tipoFloresta', 'nome'], '-'),
      totalAreas: this.readNumber(item, ['totalAreas', 'quantidadeAreas'], 0) ?? 0,
      totalHectares: this.readNumber(item, ['totalHectares', 'hectares'], 0) ?? 0
    }));
  }

  private normalizeTipos(items: ApiObject[]): AreaConsolidadoTipoDTO[] {
    return items.map((item) => ({
      tipo: this.readText(item, ['tipo', 'tipoFloresta', 'nome'], '-'),
      totalAreas: this.readNumber(item, ['totalAreas', 'quantidadeAreas'], 0) ?? 0,
      totalHectares: this.readNumber(item, ['totalHectares', 'hectares'], 0) ?? 0
    }));
  }

  private normalizeStatus(
    items: ApiObject[],
    statusFiltro: string | null,
    biomas: AreaConsolidadoBiomaDTO[],
    tipos: AreaConsolidadoTipoDTO[]
  ): AreaConsolidadoStatusDTO[] {
    if (items.length) {
      return items.map((item) => ({
        status: this.readText(item, ['status', 'nome'], '-').toUpperCase(),
        totalAreas: this.readNumber(item, ['totalAreas', 'quantidadeAreas'], 0) ?? 0,
        totalHectares: this.readNumber(item, ['totalHectares', 'hectares'], 0) ?? 0
      }));
    }

    if (!statusFiltro) {
      return [];
    }

    return [{
      status: statusFiltro,
      totalAreas: this.sumAreas(biomas, tipos),
      totalHectares: this.sumHectares(biomas, tipos)
    }];
  }

  private sumAreas(biomas: AreaConsolidadoBiomaDTO[], tipos: AreaConsolidadoTipoDTO[]): number {
    if (biomas.length) {
      return biomas.reduce((acc, item) => acc + item.totalAreas, 0);
    }
    return tipos.reduce((acc, item) => acc + item.totalAreas, 0);
  }

  private sumHectares(biomas: AreaConsolidadoBiomaDTO[], tipos: AreaConsolidadoTipoDTO[]): number {
    if (biomas.length) {
      return biomas.reduce((acc, item) => acc + item.totalHectares, 0);
    }
    return tipos.reduce((acc, item) => acc + item.totalHectares, 0);
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

  private readText(source: ApiObject, keys: string[], fallback = '-'): string {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return fallback;
  }

  private readNumber(source: ApiObject, keys: string[], fallback: number | null): number | null {
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
