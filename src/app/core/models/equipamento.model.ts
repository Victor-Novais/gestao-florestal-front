export interface Equipamento {
  id: number | string | null;
  nome: string;
  codigoPatrimonial: string;
  categoria: string;
  status: string;
  localizacao: string;
  quantidade: number;
  estoqueMinimo: number;
  percentualRestante: number;
  alertaEstoqueBaixo: boolean;
  dataAquisicao: string | null;
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
  status?: string | null;
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
  nome: string;
  codigoPatrimonial: string;
  categoria?: string | null;
  status?: string | null;
  localizacao?: string | null;
  quantidade: number;
  estoqueMinimo: number;
  dataAquisicao: string | null;
  responsavelId: number | string | null;
}
