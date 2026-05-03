import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlantioService {
  private readonly API = `${environment.apiUrl}/api/plantios`;
  private readonly RELATORIOS_API = `${environment.apiUrl}/api/relatorios/plantio`;

  constructor(private http: HttpClient) {}

  /**
   * T5 - REGISTRO E LISTAGEM
   */

  // Listagem com filtros de área, espécie, colaborador e período
  listar(filtros: any): Observable<any> {
    let params = new HttpParams();
    if (filtros.areaId) params = params.set('areaId', filtros.areaId);
    if (filtros.especieId) params = params.set('especieId', filtros.especieId);
    if (filtros.colaboradorId) params = params.set('colaboradorId', filtros.colaboradorId);
    if (filtros.inicio && filtros.fim) {
      params = params.set('inicio', filtros.inicio);
      params = params.set('fim', filtros.fim);
    }
    return this.http.get<any>(this.API, { params });
  }

  // Registrar novo plantio (Gera o protocolo)
  registrar(dados: any): Observable<any> {
    return this.http.post<any>(this.API, dados);
  }

  // Métodos auxiliares para carregar apenas ATIVOS nos selects
  getAreasAtivas(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/areas/ativas`);
  }

  getEspeciesAtivas(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/especies/ativas`);
  }

  /**
   * T6 - RELATÓRIOS E METAS
   */

  // Busca o acumulado mensal para o gráfico/barra de progresso
  // Critério: Filtragem por mês e ano
  buscarAcumuladoMensal(mes: number, ano: number): Observable<any> {
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('ano', ano.toString());

    return this.http.get<any>(`${this.RELATORIOS_API}/acumulado-mensal`, { params });
  }

  // Cadastrar meta mensal de plantio
  cadastrarMeta(meta: { mes: number, ano: number, quantidade: number }): Observable<any> {
    return this.http.post<any>(`${this.RELATORIOS_API}/metas`, meta);
  }
}
