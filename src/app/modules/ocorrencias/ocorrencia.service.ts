import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  OcorrenciaRequest, OcorrenciaResponse, PageResponse
} from './ocorrencia.model';

@Injectable({ providedIn: 'root' })
export class OcorrenciaService {
  private api = `${environment.apiUrl}/api/ocorrencias`;

  constructor(private http: HttpClient) {}

  criar(dto: OcorrenciaRequest): Observable<OcorrenciaResponse> {
    return this.http.post<OcorrenciaResponse>(this.api, dto);
  }

  listar(filters: {
    tipo?: string; urgencia?: string; area?: string;
    colaborador?: string; dataInicio?: string; dataFim?: string;
    page?: number; size?: number;
  }): Observable<PageResponse<OcorrenciaResponse>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PageResponse<OcorrenciaResponse>>(this.api, { params });
  }

  buscarPorProtocolo(protocolo: string): Observable<OcorrenciaResponse> {
    return this.http.get<OcorrenciaResponse>(`${this.api}/protocolo/${protocolo}`);
  }

  buscarPorId(id: string): Observable<OcorrenciaResponse> {
    return this.http.get<OcorrenciaResponse>(`${this.api}/${id}`);
  }
}
