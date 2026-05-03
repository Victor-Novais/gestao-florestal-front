import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ProdutividadeResponseDTO,
  OcorrenciaConsolidadoResponseDTO
} from '../models/relatorio.model';

@Injectable({ providedIn: 'root' })
export class RelatorioProdutividadeService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/relatorios`;

  getProdutividade(dataInicio?: string | null, dataFim?: string | null): Observable<ProdutividadeResponseDTO> {
    let params = new HttpParams();
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim)    params = params.set('dataFim',    dataFim);
    return this.http.get<ProdutividadeResponseDTO>(`${this.base}/produtividade`, { params });
  }

  getConsolidadoOcorrencias(dataInicio?: string | null, dataFim?: string | null): Observable<OcorrenciaConsolidadoResponseDTO> {
    let params = new HttpParams();
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim)    params = params.set('dataFim',    dataFim);
    return this.http.get<OcorrenciaConsolidadoResponseDTO>(`${this.base}/ocorrencias/consolidado`, { params });
  }
}
