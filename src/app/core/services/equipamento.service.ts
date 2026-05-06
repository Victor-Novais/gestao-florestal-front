import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Equipamento,
  EquipamentoAlerta,
  EquipamentoFormData,
  InventarioEquipamentoItem,
  EquipamentoPage,
  PrevisaoReposicaoItem,
  EquipamentoQueryParams,
  EquipamentoResponsavel
} from '../models/equipamento.model';

type ApiObject = Record<string, unknown>;
type ApiResponse = ApiObject | ApiObject[];

@Injectable({ providedIn: 'root' })
export class EquipamentoService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/equipamentos`;
  private readonly apiRelatorios = `${environment.apiUrl}/api/relatorios/equipamentos`;
  private readonly categoriaAliases: Record<string, string> = {
    FERRAMENTA: 'FERRAMENTA_MANUAL',
    INSUMO: 'INSUMO_QUIMICO'
  };

  listar(query: EquipamentoQueryParams): Observable<EquipamentoPage> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size);

    if (query.categoria) {
      const categoria = this.normalizeCategoria(query.categoria);
      if (categoria) {
        params = params.set('categoria', categoria);
      }
    }

    if (typeof query.ativo === 'boolean') {
      params = params.set('ativo', query.ativo);
    }

    if (query.localizacao) {
      params = params.set('localizacao', query.localizacao);
    }

    return this.http.get<ApiResponse>(this.api, { params }).pipe(
      map((response) => this.normalizePage(response, query))
    );
  }

  listarAlertasEstoque(): Observable<EquipamentoAlerta[]> {
    return this.http.get<ApiResponse>(`${this.api}/alertas-estoque`).pipe(
      map((response) => this.normalizeAlertas(response))
    );
  }

  buscarPorId(id: number | string): Observable<Equipamento> {
    return this.http.get<ApiObject>(`${this.api}/${id}`).pipe(
      map((response) => this.normalizeItem(response))
    );
  }

  salvar(dados: EquipamentoFormData): Observable<Equipamento> {
    return this.http.post<ApiObject>(this.api, dados).pipe(
      map((response) => this.normalizeItem(response))
    );
  }

  atualizar(id: number | string, dados: EquipamentoFormData): Observable<Equipamento> {
    return this.http.put<ApiObject>(`${this.api}/${id}`, dados).pipe(
      map((response) => this.normalizeItem(response))
    );
  }

  listarResponsaveis(): Observable<EquipamentoResponsavel[]> {
    return this.http.get<ApiResponse>(`${environment.apiUrl}/api/colaboradores/ativos`).pipe(
      map((response) => this.normalizeResponsaveis(response))
    );
  }

  relatorioInventario(): Observable<InventarioEquipamentoItem[]> {
    return this.http.get<InventarioEquipamentoItem[]>(`${this.apiRelatorios}/inventario`);
  }

  relatorioPrevisaoReposicao(diasParaVencer = 30): Observable<PrevisaoReposicaoItem[]> {
    const params = new HttpParams().set('diasParaVencer', diasParaVencer);
    return this.http.get<PrevisaoReposicaoItem[]>(`${this.apiRelatorios}/previsao-reposicao`, { params });
  }

  private normalizePage(response: ApiResponse, query: EquipamentoQueryParams): EquipamentoPage {
    const payload = Array.isArray(response) ? { content: response } : response;
    const rawItems = this.readArray(payload, ['content', 'items', 'data', 'results']);

    return {
      content: rawItems.map((item) => this.normalizeItem(item)),
      totalElements: this.readNumber(
        payload,
        ['totalElements', 'totalItems', 'total', 'count', 'totalRecords'],
        rawItems.length
      ),
      page: this.readNumber(payload, ['number', 'page', 'pageNumber'], query.page),
      size: this.readNumber(payload, ['size', 'pageSize'], query.size)
    };
  }

  private normalizeAlertas(response: ApiResponse): EquipamentoAlerta[] {
    const payload = Array.isArray(response) ? { content: response } : response;
    const rawItems = this.readArray(payload, ['content', 'items', 'data', 'results']);

    return rawItems
      .map((item) => this.normalizeAlerta(item))
      .filter((item) => item.alertaEstoqueBaixo);
  }

  private normalizeItem(item: ApiObject): Equipamento {
    const quantidade = this.readNumber(item, ['quantidade', 'estoqueAtual', 'qtdAtual', 'saldoAtual'], 0);
    const estoqueMinimo = this.readNumber(item, ['estoqueMinimo', 'estoque_minimo', 'minimo'], 0);
    const percentual = this.resolvePercentualRestante(item, quantidade, estoqueMinimo);
    const alerta = this.readBoolean(item, ['alertaEstoqueBaixo', 'estoqueBaixo', 'baixoEstoque'], quantidade <= estoqueMinimo);

    return {
      id: this.readId(item),
      descricao: this.readText(item, ['descricao', 'nome', 'titulo']),
      codigoPatrimonial: this.readText(item, ['codigoPatrimonial', 'codigo', 'patrimonio'], '-'),
      categoria: this.readText(item, ['categoria', 'tipo', 'grupo']).toUpperCase(),
      ativo: this.readBoolean(item, ['ativo'], true),
      unidadeMedida: this.readText(item, ['unidadeMedida', 'unidade_medida', 'unidade'], '-'),
      localizacao: this.readText(item, ['localizacaoAtual', 'localizacao', 'local', 'setor']),
      quantidade,
      estoqueMinimo,
      percentualRestante: percentual,
      alertaEstoqueBaixo: alerta,
      dataAquisicao: this.readDate(item, ['dataAquisicao', 'data_aquisicao', 'adquiridoEm']),
      vidaUtilEstimada: this.readNumber(item, ['vidaUtilEstimada', 'vida_util_estimada'], 0),
      responsavelId: this.readPrimitive(item, ['responsavelId', 'responsavel_id', 'colaboradorId'])
    };
  }

  private normalizeAlerta(item: ApiObject): EquipamentoAlerta {
    const normalized = this.normalizeItem(item);

    return {
      id: normalized.id,
      nome: normalized.descricao,
      categoria: normalized.categoria,
      localizacao: normalized.localizacao,
      quantidade: normalized.quantidade,
      estoqueMinimo: normalized.estoqueMinimo,
      percentualRestante: normalized.percentualRestante,
      alertaEstoqueBaixo: normalized.alertaEstoqueBaixo
    };
  }

  private normalizeResponsaveis(response: ApiResponse): EquipamentoResponsavel[] {
    const payload = Array.isArray(response) ? response : this.readArray(response, ['content', 'items', 'data', 'results']);

    return payload.map((item) => ({
      id: this.readId(item),
      nome: this.readText(item, ['nomeCompleto', 'nome', 'name'])
    }));
  }

  private resolvePercentualRestante(source: ApiObject, quantidade: number, estoqueMinimo: number): number {
    const explicit = this.readNumber(source, ['percentualRestante', 'percentual_estoque', 'nivelEstoque'], Number.NaN);
    if (Number.isFinite(explicit)) {
      return Math.max(0, Math.min(100, explicit));
    }

    if (estoqueMinimo <= 0) {
      return quantidade > 0 ? 100 : 0;
    }

    const percentual = (quantidade / estoqueMinimo) * 100;
    return Math.max(0, Math.min(100, Math.round(percentual)));
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

  private readPrimitive(source: ApiObject, keys: string[]): number | string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' || typeof value === 'string') {
        return value;
      }
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

  private readDate(source: ApiObject, keys: string[]): string | null {
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

  private normalizeCategoria(raw: string): string | null {
    const normalized = raw.trim().toUpperCase();
    if (!normalized) {
      return null;
    }

    return this.categoriaAliases[normalized] ?? normalized;
  }
}
