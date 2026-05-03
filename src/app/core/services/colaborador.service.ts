import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Se você já tiver o model criado, importe-o. Se não, use 'any' por enquanto.
@Injectable({
  providedIn: 'root'
})
export class ColaboradorService {
  private readonly API = `${environment.apiUrl}/api/colaboradores`;

  constructor(private http: HttpClient) {}

  // Listagem com Paginação (Usada na T1)
  listar(page: number, size: number): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(this.API, { params });
  }

  // Buscar detalhe do colaborador (Para a T2)
  buscarPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.API}/${id}`);
  }

  // Criar novo colaborador
  salvar(dados: any): Observable<any> {
    return this.http.post<any>(this.API, dados);
  }

  // Atualizar dados completos
  atualizar(id: number, dados: any): Observable<any> {
    return this.http.put<any>(`${this.API}/${id}`, dados);
  }

  /**
   * ALTERAR STATUS (Inativar/Reativar)
   * Conforme os critérios de aceite: deve bloquear o login se for INATIVO.
   * Usamos PATCH pois estamos alterando apenas um campo do recurso.
   */
  alterarStatus(id: number, novoStatus: 'ATIVO' | 'INATIVO'): Observable<void> {
    return this.http.patch<void>(`${this.API}/${id}/status`, { status: novoStatus });
  }

  // Buscar histórico de acessos (Critério de Aceite 5)
  buscarHistoricoAcessos(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/${id}/acessos`);
  }
}
