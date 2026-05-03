import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AreaPlantioOption } from '../../plantio/models/plantio.model';
import {
  PlantioAcumuladoMensalDTO,
  PlantioConfirmacaoDTO,
  PlantioMetaAreaDTO,
  PlantioMetaAreaFormDTO
} from '../models/relatorio.model';
import { ColaboradorPlantioOption } from '../../plantio/models/plantio.model';

type ApiObject = Record<string, unknown>;
type ApiResponse = ApiObject | ApiObject[];

@Injectable({ providedIn: 'root' })
export class RelatorioPlantioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/relatorios/plantio`;
  private readonly areasUrl = `${environment.apiUrl}/api/areas`;
  private readonly colaboradoresUrl = `${environment.apiUrl}/api/colaboradores`;

  getConfirmacao(id: string): Observable<PlantioConfirmacaoDTO> {
    return this.http.get<ApiObject>(`${this.base}/confirmacao/${id}`).pipe(
      map((response) => this.normalizeConfirmacao(response))
    );
  }

  getAcumuladoMensal(params: {
    mes: number;
    ano: number;
    colaboradorId?: string | null;
  }): Observable<PlantioAcumuladoMensalDTO> {
    let httpParams = new HttpParams()
      .set('mes', params.mes)
      .set('ano', params.ano);

    if (params.colaboradorId) {
      httpParams = httpParams
        .set('colaboradorId', params.colaboradorId)
        .set('colaborador', params.colaboradorId);
    }

    return this.http.get<ApiObject>(`${this.base}/acumulado-mensal`, { params: httpParams }).pipe(
      map((response) => this.normalizeAcumulado(response, params))
    );
  }

  getMetas(params?: { mes?: number | null; ano?: number | null }): Observable<PlantioMetaAreaDTO[]> {
    let httpParams = new HttpParams();
    if (params?.mes) httpParams = httpParams.set('mes', params.mes);
    if (params?.ano) httpParams = httpParams.set('ano', params.ano);

    return this.http.get<ApiResponse>(`${this.base}/metas`, { params: httpParams }).pipe(
      map((response) => {
        const payload = Array.isArray(response) ? { content: response } : response;
        return this.readArray(payload, ['content', 'items', 'data', 'results']).map((item) => this.normalizeMeta(item));
      })
    );
  }

  salvarMeta(payload: PlantioMetaAreaFormDTO): Observable<PlantioMetaAreaDTO> {
    return this.http.post<ApiObject>(`${this.base}/metas`, payload).pipe(
      map((response) => this.normalizeMeta(response))
    );
  }

  listarAreas(): Observable<AreaPlantioOption[]> {
    const params = new HttpParams().set('size', '200');
    return this.http.get<ApiResponse>(this.areasUrl, { params }).pipe(
      map((response) => {
        const payload = Array.isArray(response) ? { content: response } : response;
        return this.readArray(payload, ['content', 'items', 'data', 'results']).map((item) => ({
          id: this.readText(item, ['id'], ''),
          nome: this.readText(item, ['nome', 'name']),
          status: this.readText(item, ['status', 'situacao'], ''),
          identificadorUnico: this.readText(item, ['identificadorUnico', 'codigo', 'sigla'], '')
        }));
      })
    );
  }

  listarColaboradores(): Observable<ColaboradorPlantioOption[]> {
    const params = new HttpParams().set('size', '200');
    return this.http.get<ApiResponse>(this.colaboradoresUrl, { params }).pipe(
      map((response) => {
        const payload = Array.isArray(response) ? { content: response } : response;
        return this.readArray(payload, ['content', 'items', 'data', 'results']).map((item) => ({
          id: this.readText(item, ['id'], ''),
          nome: this.readText(item, ['nome', 'nomeCompleto'], '-'),
          funcao: this.readText(item, ['funcao', 'cargo'], ''),
          status: this.readText(item, ['status', 'situacao'], this.readBoolean(item, ['ativo'], true) ? 'ATIVO' : 'INATIVO')
        }));
      })
    );
  }

  private normalizeConfirmacao(source: ApiObject): PlantioConfirmacaoDTO {
    return {
      id: this.readText(source, ['id'], ''),
      protocolo: this.readText(source, ['protocolo', 'numeroProtocolo', 'codigoProtocolo'], ''),
      dataHora: this.readText(source, ['dataHora', 'dataPlantio'], ''),
      areaFlorestalNome: this.readText(source, ['areaFlorestalNome', 'areaNome'], '-'),
      especieNome: this.readText(source, ['especieNome', 'especieVegetalNome'], '-'),
      quantidadeMudas: this.readNumber(source, ['quantidadeMudas', 'quantidade'], 0),
      latitudeTalhao: this.readNumber(source, ['latitudeTalhao', 'latitude'], 0),
      longitudeTalhao: this.readNumber(source, ['longitudeTalhao', 'longitude'], 0),
      temperatura: this.readNumber(source, ['temperatura'], 0),
      umidade: this.readNumber(source, ['umidade'], 0),
      houveChuva: this.readBoolean(source, ['houveChuva', 'indicadorChuva', 'chuva'], false),
      metodoPlantio: this.readText(source, ['metodoPlantio', 'metodo'], '-'),
      observacoes: this.readNullableText(source, ['observacoes', 'descricao']),
      colaboradorNome: this.readText(source, ['colaboradorNome', 'nomeColaborador'], '-')
    };
  }

  private normalizeAcumulado(source: ApiObject, params: { mes: number; ano: number; colaboradorId?: string | null }): PlantioAcumuladoMensalDTO {
    return {
      mes: this.readNumber(source, ['mes'], params.mes),
      ano: this.readNumber(source, ['ano'], params.ano),
      totalMudasMes: this.readNumber(source, ['totalMudasMes', 'totalMudas'], 0),
      metaMes: this.readNullableNumber(source, ['metaMes', 'meta']),
      percentualAtingido: this.readNumber(source, ['percentualAtingido', 'percentual'], 0),
      colaboradorId: this.readNullableText(source, ['colaboradorId']),
      colaboradorNome: this.readNullableText(source, ['colaboradorNome'])
    };
  }

  private normalizeMeta(source: ApiObject): PlantioMetaAreaDTO {
    return {
      id: this.readText(source, ['id'], ''),
      areaId: this.readText(source, ['areaId'], ''),
      areaNome: this.readText(source, ['areaNome', 'areaFlorestalNome'], '-'),
      mes: this.readNumber(source, ['mes'], 0),
      ano: this.readNumber(source, ['ano'], 0),
      metaMudas: this.readNullableNumber(source, ['metaMudas', 'metaMes', 'meta']),
      totalMudas: this.readNumber(source, ['totalMudas', 'totalMudasMes'], 0),
      percentualAtingido: this.readNumber(source, ['percentualAtingido', 'percentual'], 0)
    };
  }

  private readArray(source: ApiObject, keys: string[]): ApiObject[] {
    for (const key of keys) {
      const value = source[key];
      if (Array.isArray(value)) return value as ApiObject[];
    }
    return [];
  }

  private readText(source: ApiObject, keys: string[], fallback = '-'): string {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number') return `${value}`;
    }
    return fallback;
  }

  private readNullableText(source: ApiObject, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
  }

  private readNumber(source: ApiObject, keys: string[], fallback: number): number {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return fallback;
  }

  private readNullableNumber(source: ApiObject, keys: string[]): number | null {
    for (const key of keys) {
      const value = source[key];
      if (value == null) return null;
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return null;
  }

  private readBoolean(source: ApiObject, keys: string[], fallback: boolean): boolean {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
      }
    }
    return fallback;
  }
}
