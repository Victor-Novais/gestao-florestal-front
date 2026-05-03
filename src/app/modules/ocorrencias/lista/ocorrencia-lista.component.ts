import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { OcorrenciaService } from '../ocorrencia.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  OcorrenciaResponse, TipoOcorrencia, UrgenciaOcorrencia,
  TIPO_OCORRENCIA_LABELS, URGENCIA_CONFIG
} from '../ocorrencia.model';

@Component({
  selector: 'app-ocorrencia-lista',
  standalone: false,
  templateUrl: './ocorrencia-lista.component.html',
  styleUrls: ['./ocorrencia-lista.component.scss']
})
export class OcorrenciaListaComponent implements OnInit {
  ocorrencias: OcorrenciaResponse[] = [];
  totalElements = 0;
  pageSize = 10;
  pageIndex = 0;
  loading = false;
  isAdmin = false;

  filterForm!: FormGroup;
  protocolo = '';
  areas: { id: string; nome: string }[] = [];
  colaboradores: { id: string; nomeCompleto: string }[] = [];

  tiposOcorrencia = Object.keys(TIPO_OCORRENCIA_LABELS) as TipoOcorrencia[];
  urgencias = Object.keys(URGENCIA_CONFIG) as UrgenciaOcorrencia[];

  displayedColumns = ['protocolo', 'tipo', 'area', 'urgencia', 'data', 'colaborador', 'acoes'];

  TIPO_LABELS = TIPO_OCORRENCIA_LABELS;
  URGENCIA_CONFIG = URGENCIA_CONFIG;

  constructor(
    private fb: FormBuilder,
    private service: OcorrenciaService,
    private router: Router,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      tipo:       [null],
      urgencia:   [null],
      area:       [null],
      colaborador:[null],
      dataInicio: [null],
      dataFim:    [null],
    });

    this.auth.currentUser$.subscribe((user) => {
      this.isAdmin = user?.role === 'ROLE_ADMIN';
    });

    this.carregarAreas();
    if (this.isAdmin) {
      this.carregarColaboradores();
    }
    this.buscar();
  }

  carregarAreas(): void {
    this.http.get<any>(`${environment.apiUrl}/api/areas?size=100`)
      .subscribe(res => this.areas = res.content ?? []);
  }

  carregarColaboradores(): void {
    this.http.get<any>(`${environment.apiUrl}/api/colaboradores?size=100`)
      .subscribe(res => this.colaboradores = res.content ?? []);
  }

  buscar(page = 0): void {
    this.loading = true;
    this.pageIndex = page;
    const f = this.filterForm.value;

    const filters: any = { page, size: this.pageSize };
    if (f.tipo)        filters.tipo = f.tipo;
    if (f.urgencia)    filters.urgencia = f.urgencia;
    if (f.area)        filters.area = f.area;
    if (f.colaborador) filters.colaborador = f.colaborador;
    if (f.dataInicio)  filters.dataInicio = this.toISOString(f.dataInicio);
    if (f.dataFim)     filters.dataFim = this.toISOString(f.dataFim);

    this.service.listar(filters).subscribe({
      next: (res: any) => {
        this.ocorrencias = res.content;
        this.totalElements = res.totalElements;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  buscarPorProtocolo(): void {
    if (!this.protocolo.trim()) return;
    this.service.buscarPorProtocolo(this.protocolo.trim()).subscribe({
      next: (res: any) => this.router.navigate(['/ocorrencias', res.id]),
      error: () => {}
    });
  }

  limparFiltros(): void {
    this.filterForm.reset();
    this.protocolo = '';
    this.buscar();
  }

  onPageChange(event: any): void {
    this.buscar(event.pageIndex);
  }

  verDetalhe(id: string): void {
    this.router.navigate(['/ocorrencias', id]);
  }

  tipoConfig(tipo: TipoOcorrencia) {
    return this.TIPO_LABELS[tipo];
  }

  urgenciaConfig(urgencia: UrgenciaOcorrencia) {
    return this.URGENCIA_CONFIG[urgencia];
  }

  private toISOString(date: Date | string): string {
    return new Date(date).toISOString();
  }
}
