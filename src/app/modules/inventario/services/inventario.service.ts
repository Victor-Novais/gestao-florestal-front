import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  InventarioRequest,
  InventarioResponse,
} from '../models/inventario.model';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private http = inject(HttpClient);

  private base = `${environment.apiUrl}/api/inventarios`;
  private areasUrl = `${environment.apiUrl}/api/areas`;
  private especiesUrl = `${environment.apiUrl}/api/especies`;
  private colaboradoresUrl = `${environment.apiUrl}/api/colaboradores`;
  private relUrl = `${environment.apiUrl}/api/relatorios/inventarios`;

  criar(dto: InventarioRequest): Observable<InventarioResponse> {
    return this.http.post<InventarioResponse>(this.base, dto);
  }

  listar(params: {
    area?: string;
    estado?: string;
    colaborador?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    size?: number;
  }): Observable<any> {
    let p = new HttpParams();
    if (params.area) p = p.set('area', params.area);
    if (params.estado) p = p.set('estado', params.estado);
    if (params.colaborador) p = p.set('colaborador', params.colaborador);
    if (params.dataInicio) p = p.set('dataInicio', params.dataInicio);
    if (params.dataFim) p = p.set('dataFim', params.dataFim);
    p = p.set('page', params.page ?? 0);
    p = p.set('size', params.size ?? 10);
    return this.http.get<any>(this.base, { params: p });
  }

  buscarPorId(id: string): Observable<InventarioResponse> {
    return this.http.get<InventarioResponse>(`${this.base}/${id}`);
  }

  buscarPorParcela(area: string, parcela: string): Observable<InventarioResponse[]> {
    const p = new HttpParams().set('area', area).set('parcela', parcela);
    return this.http.get<InventarioResponse[]>(`${this.base}/parcela`, { params: p });
  }

  buscarHistoricoParcela(
    _url: string,
    areaId: string,
    parcela: string,
    dataInicio?: string,
    dataFim?: string,
  ): Observable<any> {
    let p = new HttpParams()
      .set('areaId', areaId)
      .set('parcela', parcela);
    if (dataInicio) p = p.set('dataInicio', dataInicio);
    if (dataFim) p = p.set('dataFim', dataFim);
    return this.http.get<any>(`${this.relUrl}/historico-parcela`, { params: p });
  }

  listarAreasAtivas(): Observable<any> {
    return this.http.get<any>(this.areasUrl, {
      params: new HttpParams().set('status', 'ATIVA').set('size', '200')
    });
  }

  listarEspeciesAtivas(): Observable<any> {
    return this.http.get<any>(this.especiesUrl, {
      params: new HttpParams().set('ativo', 'true').set('size', '200')
    });
  }

  listarColaboradores(): Observable<any> {
    return this.http.get<any>(this.colaboradoresUrl, {
      params: new HttpParams().set('size', '200')
    });
  }
}
