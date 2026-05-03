import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  Colaborador,
  ColaboradorFormData,
  ColaboradorPage,
  ColaboradorQueryParams,
  ColaboradorStatus,
  HistoricoAcesso,
  UsuarioAcesso
} from './models/Colaborador';

type ApiResponse = Record<string, unknown> | ColaboradorApiItem[];

interface ColaboradorApiItem extends Record<string, unknown> {
  id?: number | string | null;
  nome?: string;
  nomeCompleto?: string;
  cpf?: string;
  matricula?: string;
  registro?: string;
  funcao?: string;
  cargo?: string;
  areaAtuacao?: string;
  area?: string;
  dataAdmissao?: string;
  admissao?: string;
  qualificacoes?: string;
  certificacoes?: string;
  status?: string;
  situacao?: string;
  ativo?: boolean | string;
  usuario?: Record<string, unknown>;
  historicoAcessos?: Record<string, unknown>[];
  contatoEmergencia?: Record<string, unknown>;
  contatoEmergenciaNome?: string;
  contatoEmergenciaTelefone?: string;
}

@Injectable({ providedIn: 'root' })
export class ColaboradorService {
  private readonly apiUrl = `${environment.apiUrl}/api/colaboradores`;

  constructor(private readonly http: HttpClient) {}

  listColaboradores(query: ColaboradorQueryParams): Observable<ColaboradorPage> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size);

    if (query.funcao) {
      params = params.set('funcao', query.funcao);
    }

    if (query.areaAtuacao) {
      params = params.set('areaAtuacao', query.areaAtuacao);
    }

    if (query.status) {
      params = params
        .set('status', query.status)
        .set('ativo', `${query.status === 'ATIVO'}`);
    }

    return this.http.get<ApiResponse>(this.apiUrl, { params }).pipe(
      map((response) => this.normalizePage(response, query))
    );
  }

  buscarPorId(id: number | string): Observable<Colaborador> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => this.normalizeItem(response as ColaboradorApiItem))
    );
  }

  criar(payload: ColaboradorFormData): Observable<Colaborador> {
    return this.http.post<Record<string, unknown>>(this.apiUrl, this.toApiPayload(payload)).pipe(
      map((response) => this.normalizeItem(response as ColaboradorApiItem))
    );
  }

  atualizar(id: number | string, payload: ColaboradorFormData): Observable<Colaborador> {
    return this.http.put<Record<string, unknown>>(`${this.apiUrl}/${id}`, this.toApiPayload(payload)).pipe(
      map((response) => this.normalizeItem(response as ColaboradorApiItem))
    );
  }

  inativar(id: number | string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, {}, {
      params: new HttpParams().set('ativo', 'false')
    });
  }

  reativar(id: number | string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, {}, {
      params: new HttpParams().set('ativo', 'true')
    });
  }

  private normalizePage(response: ApiResponse, query: ColaboradorQueryParams): ColaboradorPage {
    const payload = Array.isArray(response) ? { content: response } : response;
    const rawItems = this.readArray(payload, ['content', 'items', 'data', 'results']);

    return {
      content: rawItems.map((item) => this.normalizeItem(item)),
      totalElements: this.readNumber(payload, ['totalElements', 'totalItems', 'total', 'count'], rawItems.length),
      page: this.readNumber(payload, ['number', 'page', 'pageNumber'], query.page),
      size: this.readNumber(payload, ['size', 'pageSize'], query.size)
    };
  }

  private normalizeItem(item: ColaboradorApiItem): Colaborador {
    const contatoEmergencia = this.readObject(item, ['contatoEmergencia']);

    return {
      id: (item.id as number | string | null | undefined) ?? null,
      nome: this.readText(item, ['nome', 'nomeCompleto']),
      cpf: this.maskCpf(this.onlyDigits(this.readText(item, ['cpf'], ''))),
      matricula: this.readText(item, ['matricula', 'registro'], ''),
      funcao: this.readText(item, ['funcao', 'cargo'], ''),
      areaAtuacao: this.readText(item, ['areaAtuacao', 'area'], ''),
      dataAdmissao: this.readText(item, ['dataAdmissao', 'admissao'], ''),
      qualificacoes: this.readText(item, ['qualificacoes'], ''),
      certificacoes: this.readText(item, ['certificacoes'], ''),
      contatoEmergenciaNome: this.readText(
        item,
        ['contatoEmergenciaNome'],
        this.readText(contatoEmergencia, ['nome'], '')
      ),
      contatoEmergenciaTelefone: this.maskPhone(this.onlyDigits(this.readText(
        item,
        ['contatoEmergenciaTelefone'],
        this.readText(contatoEmergencia, ['telefone'], '')
      ))),
      status: this.readStatus(item),
      usuario: this.normalizeUsuario(this.readObject(item, ['usuario'])),
      historicoAcessos: this.normalizeHistorico(item.historicoAcessos)
    };
  }

  private normalizeUsuario(source: Record<string, unknown>): UsuarioAcesso | null {
    if (!Object.keys(source).length) {
      return null;
    }

    return {
      id: (source['id'] as number | string | null | undefined) ?? null,
      username: this.readText(source, ['username', 'login', 'email'], ''),
      email: this.readText(source, ['email'], ''),
      ativo: this.readBoolean(source, ['ativo', 'enabled'], true)
    };
  }

  private normalizeHistorico(source: unknown): HistoricoAcesso[] {
    if (!Array.isArray(source)) {
      return [];
    }

    return source.map((item) => {
      const entry = typeof item === 'object' && item ? item as Record<string, unknown> : {};
      return {
        id: (entry['id'] as number | string | null | undefined) ?? null,
        data: this.readText(entry, ['data', 'dataHora', 'timestamp'], ''),
        ip: this.readText(entry, ['ip', 'enderecoIp'], '-'),
        dispositivo: this.readText(entry, ['dispositivo', 'device', 'navegador'], '-')
      };
    });
  }

  private toApiPayload(payload: ColaboradorFormData): Record<string, unknown> {
    const body: Record<string, unknown> = {
      nome: payload.nome.trim(),
      cpf: this.onlyDigits(payload.cpf),
      matricula: payload.matricula.trim(),
      funcao: payload.funcao,
      areaAtuacao: payload.areaAtuacao.trim(),
      dataAdmissao: payload.dataAdmissao,
      qualificacoes: payload.qualificacoes.trim(),
      certificacoes: payload.certificacoes.trim(),
      contatoEmergenciaNome: payload.contatoEmergenciaNome.trim(),
      contatoEmergenciaTelefone: this.onlyDigits(payload.contatoEmergenciaTelefone),
      contatoEmergencia: {
        nome: payload.contatoEmergenciaNome.trim(),
        telefone: this.onlyDigits(payload.contatoEmergenciaTelefone)
      },
      criarAcessoSistema: !!payload.criarAcessoSistema
    };

    if (payload.senha) {
      body['senha'] = payload.senha;
    }

    return body;
  }

  private readArray(source: Record<string, unknown>, keys: string[]): ColaboradorApiItem[] {
    for (const key of keys) {
      const value = source[key];
      if (Array.isArray(value)) {
        return value as ColaboradorApiItem[];
      }
    }

    return [];
  }

  private readObject(source: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    for (const key of keys) {
      const value = source[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
      }
    }

    return {};
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

  private readStatus(source: ColaboradorApiItem): ColaboradorStatus {
    const explicit = this.readText(source, ['status', 'situacao'], '');
    if (explicit.toUpperCase() === 'INATIVO') {
      return 'INATIVO';
    }

    if (explicit.toUpperCase() === 'ATIVO') {
      return 'ATIVO';
    }

    return this.readBoolean(source, ['ativo'], true) ? 'ATIVO' : 'INATIVO';
  }

  private onlyDigits(value: string): string {
    return value.replace(/\D/g, '');
  }

  private maskCpf(value: string): string {
    const digits = this.onlyDigits(value).slice(0, 11);
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  private maskPhone(value: string): string {
    const digits = this.onlyDigits(value).slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
}
