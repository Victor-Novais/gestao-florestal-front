// ── Produtividade (GET /api/relatorios/produtividade) ─────────────────────
export interface TotalMudasAreaDTO {
  areaId: string;
  areaNome: string;
  totalMudas: number;
}

export interface CoberturaBiomaDTO {
  bioma: string;
  hectaresMonitorados: number;
  hectaresTotais: number;
  taxaCobertura: number;
}

export interface OcorrenciaTipoUrgenciaDTO {
  tipo: string;
  baixo: number;
  medio: number;
  alto: number;
  critico: number;
  total: number;
  percentualCriticas: number;
}

export interface IndiceSaudeFlorestalDTO {
  mediaScore: number;
  totalInventarios: number;
}

export interface ProdutividadeResponseDTO {
  dataInicio: string | null;
  dataFim: string | null;
  totalMudasPorArea: TotalMudasAreaDTO[];
  coberturaPorBioma: CoberturaBiomaDTO[];
  ocorrenciasPorTipoUrgencia: OcorrenciaTipoUrgenciaDTO[];
  indiceSaudeFlorestal: IndiceSaudeFlorestalDTO;
}

// ── Consolidado de Ocorrências (GET /api/relatorios/ocorrencias/consolidado) ─
export interface OcorrenciaConsolidadoItemDTO {
  tipo: string;
  baixo: number;
  medio: number;
  alto: number;
  critico: number;
  total: number;
  percentualCriticas: number;
}

export interface OcorrenciaConsolidadoResponseDTO {
  dataInicio: string | null;
  dataFim: string | null;
  itens: OcorrenciaConsolidadoItemDTO[];
}

// ── Filtros de período ────────────────────────────────────────────────────────
export interface PeriodoFiltro {
  dataInicio: string | null;
  dataFim: string | null;
}

export interface AreaConsolidadoBreakdownDTO {
  tipo: string;
  totalAreas: number;
  totalHectares: number;
}

export interface AreaConsolidadoBiomaDTO {
  bioma: string;
  totalAreas: number;
  totalHectares: number;
  breakdown: AreaConsolidadoBreakdownDTO[];
}

export interface AreaConsolidadoTipoDTO {
  tipo: string;
  totalAreas: number;
  totalHectares: number;
}

export interface AreaConsolidadoStatusDTO {
  status: string;
  totalAreas: number;
  totalHectares: number;
}

export interface AreaConsolidadoResponseDTO {
  statusFiltro: string | null;
  totalAreas: number;
  totalHectares: number;
  totaisPorStatus: AreaConsolidadoStatusDTO[];
  agrupadoPorBioma: AreaConsolidadoBiomaDTO[];
  agrupadoPorTipo: AreaConsolidadoTipoDTO[];
}

export interface PlantioConfirmacaoDTO {
  id: string;
  protocolo: string;
  dataHora: string;
  areaFlorestalNome: string;
  especieNome: string;
  quantidadeMudas: number;
  latitudeTalhao: number;
  longitudeTalhao: number;
  temperatura: number;
  umidade: number;
  houveChuva: boolean;
  metodoPlantio: string;
  observacoes: string | null;
  colaboradorNome: string;
}

export interface PlantioAcumuladoMensalDTO {
  mes: number;
  ano: number;
  totalMudasMes: number;
  metaMes: number | null;
  percentualAtingido: number;
  colaboradorId?: string | null;
  colaboradorNome?: string | null;
}

export interface PlantioMetaAreaDTO {
  id: string;
  areaId: string;
  areaNome: string;
  mes: number;
  ano: number;
  metaMudas: number | null;
  totalMudas: number;
  percentualAtingido: number;
}

export interface PlantioMetaAreaFormDTO {
  areaId: string;
  mes: number;
  ano: number;
  metaMudas: number;
}

export interface RelatorioEspecieFichaDTO {
  id: number | string | null;
  nomeCientifico: string;
  nomePopular: string;
  familiaBotanica: string;
  porte: string;
  statusConservacao: string;
  ativo: boolean;
}

export interface RelatorioEspecieAlertaDTO extends RelatorioEspecieFichaDTO {
  dataIdentificacao: string | null;
  totalAreas: number;
}

export interface RelatorioEspecieFichaPageDTO {
  content: RelatorioEspecieFichaDTO[];
  totalElements: number;
  page: number;
  size: number;
}

export interface RelatorioEspecieFichaQueryParams {
  statusConservacao?: string | null;
  page: number;
  size: number;
  sort: string;
}
