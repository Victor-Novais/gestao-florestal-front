import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ColaboradorSimples {
  id: string;
  nomeCompleto: string;
  funcao: string;
  ativo: boolean;
}

export interface AtividadeLinha {
  tipo: 'PLANTIO' | 'INVENTARIO' | 'OCORRENCIA';
  data: string;
  descricao: string;
  detalhe: string;
  mes: number;
  ano: number;
}

export interface TimelineMes {
  mes: number;
  ano: number;
  label: string;
  plantios: number;
  inventarios: number;
  ocorrencias: number;
  atividades: AtividadeLinha[];
}

export interface EscalaColaborador {
  colaboradorId: string;
  colaboradorNome: string;
  funcao: string;
  totalPlantios: number;
  totalInventarios: number;
  totalOcorrencias: number;
  totalAtividades: number;
}

interface PageResponse<T> {
  content?: T[];
}

interface PlantioItem {
  dataHora: string;
  areaFlorestalNome: string;
  especieVegetalNome: string;
  quantidadeMudas: number;
  colaboradorId: string;
}

interface InventarioItem {
  dataVistoria: string;
  numeroParcela?: string;
  parcela?: string;
  areaFlorestalNome?: string;
  estadoGeral?: string;
  colaboradorId?: string;
}

interface OcorrenciaItem {
  dataRegistro: string;
  tipo: string;
  urgencia: string;
  numeroProtocolo?: string;
  protocolo?: string;
  colaboradorId?: string;
}

@Injectable({ providedIn: 'root' })
export class HistoricoColaboradorService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api`;

  listarColaboradores(): Observable<ColaboradorSimples[]> {
    const params = new HttpParams().set('size', '200').set('sort', 'nomeCompleto');

    return this.http.get<PageResponse<ColaboradorSimples>>(`${this.base}/colaboradores`, { params }).pipe(
      map((page) => page.content ?? [])
    );
  }

  getTimeline(colaboradorId: string): Observable<TimelineMes[]> {
    const pPlantio = new HttpParams().set('colaboradorId', colaboradorId).set('size', '500');
    const pInventario = new HttpParams().set('colaborador', colaboradorId).set('size', '500');
    const pOcorrencia = new HttpParams().set('colaborador', colaboradorId).set('size', '500');

    return forkJoin({
      plantios: this.http.get<PageResponse<PlantioItem>>(`${this.base}/plantios`, { params: pPlantio }),
      inventarios: this.http.get<PageResponse<InventarioItem>>(`${this.base}/inventarios`, { params: pInventario }),
      ocorrencias: this.http.get<PageResponse<OcorrenciaItem>>(`${this.base}/ocorrencias`, { params: pOcorrencia })
    }).pipe(
      map(({ plantios, inventarios, ocorrencias }) => {
        const atividades: AtividadeLinha[] = [];

        (plantios.content ?? []).forEach((p) => {
          const d = new Date(p.dataHora);
          atividades.push({
            tipo: 'PLANTIO',
            data: p.dataHora,
            descricao: `Plantio - ${p.areaFlorestalNome}`,
            detalhe: `${p.quantidadeMudas} mudas de ${p.especieVegetalNome}`,
            mes: d.getMonth() + 1,
            ano: d.getFullYear()
          });
        });

        (inventarios.content ?? []).forEach((i) => {
          const d = new Date(i.dataVistoria);
          atividades.push({
            tipo: 'INVENTARIO',
            data: i.dataVistoria,
            descricao: `Inventario - Parcela ${i.numeroParcela ?? i.parcela ?? '-'}`,
            detalhe: `Area: ${i.areaFlorestalNome ?? '-'} | Estado: ${i.estadoGeral ?? '-'}`,
            mes: d.getMonth() + 1,
            ano: d.getFullYear()
          });
        });

        (ocorrencias.content ?? []).forEach((o) => {
          const d = new Date(o.dataRegistro);
          atividades.push({
            tipo: 'OCORRENCIA',
            data: o.dataRegistro,
            descricao: `Ocorrencia - ${this.tipoLabel(o.tipo)}`,
            detalhe: `Urgencia: ${o.urgencia} | Protocolo: ${o.numeroProtocolo ?? o.protocolo ?? '-'}`,
            mes: d.getMonth() + 1,
            ano: d.getFullYear()
          });
        });

        return this.agruparPorMes(atividades);
      })
    );
  }

  getEscalaAlocacao(mes: number, ano: number): Observable<EscalaColaborador[]> {
    const inicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const fim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`;

    const pPlantio = new HttpParams()
      .set('size', '500')
      .set('inicio', `${inicio}T00:00:00`)
      .set('fim', `${fim}T23:59:59`);

    const pBase = new HttpParams().set('size', '500');

    return forkJoin({
      colaboradores: this.listarColaboradores(),
      plantios: this.http.get<PageResponse<PlantioItem>>(`${this.base}/plantios`, { params: pPlantio }),
      inventarios: this.http.get<PageResponse<InventarioItem>>(`${this.base}/inventarios`, { params: pBase }),
      ocorrencias: this.http.get<PageResponse<OcorrenciaItem>>(`${this.base}/ocorrencias`, { params: pBase })
    }).pipe(
      map(({ colaboradores, plantios, inventarios, ocorrencias }) =>
        colaboradores
          .map((col) => {
            const totalP = (plantios.content ?? []).filter((p) => p.colaboradorId === col.id).length;

            const totalI = (inventarios.content ?? []).filter((i) => {
              if (i.colaboradorId !== col.id) return false;
              const d = new Date(i.dataVistoria);
              return d.getMonth() + 1 === mes && d.getFullYear() === ano;
            }).length;

            const totalO = (ocorrencias.content ?? []).filter((o) => {
              if (o.colaboradorId !== col.id) return false;
              const d = new Date(o.dataRegistro);
              return d.getMonth() + 1 === mes && d.getFullYear() === ano;
            }).length;

            return {
              colaboradorId: col.id,
              colaboradorNome: col.nomeCompleto,
              funcao: col.funcao,
              totalPlantios: totalP,
              totalInventarios: totalI,
              totalOcorrencias: totalO,
              totalAtividades: totalP + totalI + totalO
            } satisfies EscalaColaborador;
          })
          .filter((e) => e.totalAtividades > 0)
          .sort((a, b) => b.totalAtividades - a.totalAtividades)
      )
    );
  }

  private agruparPorMes(atividades: AtividadeLinha[]): TimelineMes[] {
    const mapa = new Map<string, TimelineMes>();

    atividades.forEach((a) => {
      const key = `${a.ano}-${String(a.mes).padStart(2, '0')}`;
      if (!mapa.has(key)) {
        mapa.set(key, {
          mes: a.mes,
          ano: a.ano,
          label: this.mesLabel(a.mes, a.ano),
          plantios: 0,
          inventarios: 0,
          ocorrencias: 0,
          atividades: []
        });
      }

      const mes = mapa.get(key)!;
      mes.atividades.push(a);
      if (a.tipo === 'PLANTIO') mes.plantios++;
      if (a.tipo === 'INVENTARIO') mes.inventarios++;
      if (a.tipo === 'OCORRENCIA') mes.ocorrencias++;
    });

    return Array.from(mapa.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([, value]) => value);
  }

  private mesLabel(mes: number, ano: number): string {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[mes - 1]}/${ano}`;
  }

  private tipoLabel(tipo: string): string {
    const map: Record<string, string> = {
      INCENDIO: 'Incendio',
      DESMATAMENTO_ILEGAL: 'Desmatamento',
      EROSAO: 'Erosao',
      ESPECIE_INVASORA: 'Especie Invasora',
      PRAGA_DOENCA: 'Praga/Doenca',
      ACIDENTE_ANIMAL: 'Acidente Animal',
      ACIDENTE_EQUIPE: 'Acidente Equipe',
      INFRACAO_AMBIENTAL: 'Infracao Ambiental'
    };

    return map[tipo] ?? tipo;
  }
}
