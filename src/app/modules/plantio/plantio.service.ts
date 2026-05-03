import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  AreaPlantioOption,
  ColaboradorPlantioOption,
  EspeciePlantioOption,
  PlantioPage,
  PlantioQueryParams,
  PlantioRequest,
  PlantioResponse
} from './models/plantio.model';

type ApiResponse = Record<string, unknown> | Record<string, unknown>[];

@Injectable({ providedIn: 'root' })
export class PlantioService {
  private readonly apiUrl = `${environment.apiUrl}/api/plantios`;
  private readonly areasUrl = `${environment.apiUrl}/api/areas`;
  private readonly especiesUrl = `${environment.apiUrl}/api/especies`;
  private readonly colaboradoresUrl = `${environment.apiUrl}/api/colaboradores`;

  constructor(private readonly http: HttpClient) {}

  criar(payload: PlantioRequest): Observable<PlantioResponse> {
    return this.http.post<Record<string, unknown>>(this.apiUrl, payload).pipe(
      map((response) => this.normalizeItem(response))
    );
  }

  listar(query: PlantioQueryParams): Observable<PlantioPage> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size);

    if (query.area) {
      params = params
        .set('area', query.area)
        .set('areaId', query.area);
    }

    if (query.especie) {
      params = params
        .set('especie', query.especie)
        .set('especieId', query.especie);
    }

    if (query.colaboradorId) {
      params = params
        .set('colaboradorId', query.colaboradorId)
        .set('colaborador', query.colaboradorId);
    }

    if (query.dataInicio) {
      params = params
        .set('dataInicio', query.dataInicio)
        .set('inicio', query.dataInicio);
    }

    if (query.dataFim) {
      params = params
        .set('dataFim', query.dataFim)
        .set('fim', query.dataFim);
    }

    return this.http.get<ApiResponse>(this.apiUrl, { params }).pipe(
      map((response) => this.normalizePage(response, query))
    );
  }

  listarAreasAtivas(): Observable<AreaPlantioOption[]> {
    const params = new HttpParams().set('status', 'ATIVA').set('size', '200');
    return this.http.get<ApiResponse>(this.areasUrl, { params }).pipe(
      map((response) => {
        const payload = Array.isArray(response) ? { content: response } : response;
        return this.readArray(payload, ['content', 'items', 'data', 'results'])
          .map((item) => ({
            id: this.readText(item, ['id'], ''),
            nome: this.readText(item, ['nome', 'name']),
            status: this.readText(item, ['status', 'situacao']).toUpperCase(),
            identificadorUnico: this.readText(item, ['identificadorUnico', 'codigo', 'sigla'], '')
          }))
          .filter((area) => area.id && area.status === 'ATIVA');
      })
    );
  }

  listarEspeciesAtivas(): Observable<EspeciePlantioOption[]> {
    const params = new HttpParams().set('ativo', 'true').set('size', '200');
    return this.http.get<ApiResponse>(this.especiesUrl, { params }).pipe(
      map((response) => {
        const payload = Array.isArray(response) ? { content: response } : response;
        return this.readArray(payload, ['content', 'items', 'data', 'results'])
          .map((item) => ({
            id: this.readText(item, ['id'], ''),
            nomePopular: this.readText(item, ['nomePopular']),
            nomeCientifico: this.readText(item, ['nomeCientifico']),
            ativo: this.readBoolean(item, ['ativo'], true)
          }))
          .filter((especie) => especie.id && especie.ativo);
      })
    );
  }

  listarColaboradores(): Observable<ColaboradorPlantioOption[]> {
    const params = new HttpParams().set('size', '200');
    return this.http.get<ApiResponse>(this.colaboradoresUrl, { params }).pipe(
      map((response) => {
        const payload = Array.isArray(response) ? { content: response } : response;
        return this.readArray(payload, ['content', 'items', 'data', 'results'])
          .map((item) => ({
            id: this.readText(item, ['id'], ''),
            nome: this.readText(item, ['nome', 'nomeCompleto']),
            funcao: this.readText(item, ['funcao', 'cargo'], ''),
            status: this.readStatus(item)
          }))
          .filter((colaborador) => !!colaborador.id);
      })
    );
  }

  private normalizePage(response: ApiResponse, query: PlantioQueryParams): PlantioPage {
    const payload = Array.isArray(response) ? { content: response } : response;
    const items = this.readArray(payload, ['content', 'items', 'data', 'results']);

    return {
      content: items.map((item) => this.normalizeItem(item)),
      totalElements: this.readNumber(payload, ['totalElements', 'totalItems', 'total', 'count'], items.length),
      page: this.readNumber(payload, ['number', 'page', 'pageNumber'], query.page),
      size: this.readNumber(payload, ['size', 'pageSize'], query.size)
    };
  }

  private normalizeItem(source: Record<string, unknown>): PlantioResponse {
    return {
      id: this.readText(source, ['id'], ''),
      protocolo: this.readText(source, ['numeroProtocolo', 'protocolo', 'codigoProtocolo'], ''),
      dataHora: this.readText(source, ['dataHora', 'dataPlantio', 'criadoEm'], ''),
      areaFlorestalId: this.readText(source, ['areaFlorestalId', 'areaId'], ''),
      areaFlorestalNome: this.readText(source, ['areaFlorestalNome', 'areaNome'], '-'),
      especieId: this.readText(source, ['especieId', 'especieVegetalId'], ''),
      especieNome: this.readText(source, ['especieNome', 'especieVegetalNome', 'nomeEspecie'], '-'),
      quantidadeMudas: this.readNumber(source, ['quantidadeMudas', 'quantidade'], 0),
      latitudeTalhao: this.readNumber(source, ['latitudeTalhao', 'latitude'], 0),
      longitudeTalhao: this.readNumber(source, ['longitudeTalhao', 'longitude'], 0),
      temperatura: this.readNumber(source, ['temperatura'], 0),
      umidade: this.readNumber(source, ['umidade'], 0),
      houveChuva: this.readBoolean(source, ['houveChuva', 'indicadorChuva', 'chuva'], false),
      metodoPlantio: this.readText(source, ['metodoPlantio', 'metodo'], '-'),
      observacoes: this.readText(source, ['observacoes', 'descricao'], ''),
      colaboradorId: this.readText(source, ['colaboradorId', 'usuarioId'], ''),
      colaboradorNome: this.readText(source, ['colaboradorNome', 'nomeColaborador', 'usuarioNome'], '-')
    };
  }

  private readArray(source: Record<string, unknown>, keys: string[]): Record<string, unknown>[] {
    for (const key of keys) {
      const value = source[key];
      if (Array.isArray(value)) {
        return value as Record<string, unknown>[];
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
      if (typeof value === 'number') {
        return `${value}`;
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

  private readStatus(source: Record<string, unknown>): string {
    const explicit = this.readText(source, ['status', 'situacao'], '');
    if (explicit) {
      return explicit.toUpperCase();
    }

    return this.readBoolean(source, ['ativo'], true) ? 'ATIVO' : 'INATIVO';
  }
}
