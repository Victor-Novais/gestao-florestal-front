export type EstadoGeral = 'OTIMO' | 'BOM' | 'REGULAR' | 'CRITICO';
export type Tendencia = 'EVOLUCAO' | 'ESTABILIDADE' | 'DEGRADACAO';

export interface VariacaoEspecie {
  especieId: string;
  especieNome: string;
  quantidadeAtual: number;
  quantidadeAnterior: number | null;
  variacaoQuantidade: number | null;
}

export interface HistoricoParcelaItem {
  inventarioId: string;
  dataVistoria: string;
  parcela: string;
  areaId: string;
  estadoGeral: EstadoGeral;
  mudancaEstadoGeral: string | null;
  dapMedioAtual: number;
  variacaoDap: number | null;
  tendencia: Tendencia | string;
  especies: VariacaoEspecie[];
}

export const ESTADO_GERAL_CONFIG: Record<EstadoGeral, { label: string; color: string; bg: string }> = {
  OTIMO:   { label: 'Ótimo',   color: '#1b5e20', bg: '#e8f5e9' },
  BOM:     { label: 'Bom',     color: '#2e7d32', bg: '#c8e6c9' },
  REGULAR: { label: 'Regular', color: '#e65100', bg: '#fbe9e7' },
  CRITICO: { label: 'Crítico', color: '#b71c1c', bg: '#ffebee' },
};

export const TENDENCIA_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  EVOLUCAO:     { icon: 'trending_up',   color: '#2e7d32', label: 'Evolução' },
  ESTABILIDADE: { icon: 'trending_flat', color: '#757575', label: 'Estabilidade' },
  DEGRADACAO:   { icon: 'trending_down', color: '#b71c1c', label: 'Degradação' },
};
