import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HistoricoParcelaItem } from './historico-parcela.model';

@Injectable({ providedIn: 'root' })
export class RelatorioInventarioService {
  private api = `${environment.apiUrl}/api/relatorios/inventarios`;

  constructor(private http: HttpClient) {}

  buscarHistoricoParcela(params: {
    areaId: string;
    parcela: string;
    dataInicio?: string;
    dataFim?: string;
  }): Observable<HistoricoParcelaItem[]> {
    let httpParams = new HttpParams()
      .set('areaId', params.areaId)
      .set('parcela', params.parcela);

    if (params.dataInicio) httpParams = httpParams.set('dataInicio', params.dataInicio);
    if (params.dataFim)    httpParams = httpParams.set('dataFim', params.dataFim);

    return this.http.get<HistoricoParcelaItem[]>(`${this.api}/historico-parcela`, { params: httpParams });
  }
}
