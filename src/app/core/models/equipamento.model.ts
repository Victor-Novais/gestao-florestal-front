export interface Equipamento {
  id: number | string | null;
  descricao: string;
  codigoPatrimonial: string;
  categoria: string;
  ativo: boolean;
  unidadeMedida: string;
  localizacao: string;
  quantidade: number;
  estoqueMinimo: number;
  percentualRestante: number;
  alertaEstoqueBaixo: boolean;
  dataAquisicao: string | null;
  vidaUtilEstimada: number | null;
  responsavelId: number | string | null;
}

export interface EquipamentoPage {
  content: Equipamento[];
  totalElements: number;
  page: number;
  size: number;
}

export interface EquipamentoQueryParams {
  categoria?: string | null;
  ativo?: boolean | null;
  localizacao?: string | null;
  page: number;
  size: number;
}

export interface EquipamentoAlerta {
  id: number | string | null;
  nome: string;
  categoria: string;
  localizacao: string;
  quantidade: number;
  estoqueMinimo: number;
  percentualRestante: number;
  alertaEstoqueBaixo: boolean;
}

export interface EquipamentoResponsavel {
  id: number | string | null;
  nome: string;
}

export interface EquipamentoFormData {
  descricao: string;
  codigoPatrimonial: string;
  categoria: string;
  unidadeMedida: string;
  localizacaoAtual?: string | null;
  quantidade: number;
  estoqueMinimo: number;
  dataAquisicao: string | null;
  vidaUtilEstimada: number;
  responsavelId: number | string | null;
}

export interface InventarioEquipamentoItem {
  id: string;
  codigoPatrimonial: string;
  descricao: string;
  categoria: string;
  quantidade: number;
  estoqueMinimo: number;
  unidadeMedida: string;
  localizacaoAtual: string | null;
  dataAquisicao: string;
  vidaUtilEstimada: number;
  responsavelId: string | null;
  responsavelNome: string | null;
  statusEstoque: 'OK' | 'BAIXO' | 'CRITICO';
}

export interface PrevisaoReposicaoItem {
  id: string;
  codigoPatrimonial: string;
  descricao: string;
  categoria: string;
  localizacaoAtual: string | null;
  dataAquisicao: string;
  vidaUtilEstimada: number;
  dataVencimento: string;
  diasRestantes: number;
}
