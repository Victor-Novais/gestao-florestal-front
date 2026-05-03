export interface EspecieVegetal {
  id: number | string | null;
  nomeCientifico: string;
  nomePopular: string;
  familiaBotanica: string;
  porte: string;
  statusConservacao: string;
  cicloVida: number;
  exigenciasClimaticas: string;
  exigenciasSolo: string;
  nativa: boolean;
  ativo: boolean;
}

export interface EspecieFormData {
  nomeCientifico: string;
  nomePopular: string;
  familiaBotanica: string;
  porte: string;
  statusConservacao: string;
  cicloVida: number;
  exigenciasClimaticas: string;
  exigenciasSolo: string;
  nativa: boolean;
}

export interface EspecieQueryParams {
  statusConservacao?: string | null;
  porte?: string | null;
  ativo?: boolean | null;
  page: number;
  size: number;
}

export interface EspeciePage {
  content: EspecieVegetal[];
  totalElements: number;
  page: number;
  size: number;
}
