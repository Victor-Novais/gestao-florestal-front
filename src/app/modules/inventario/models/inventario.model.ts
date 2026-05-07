export type EstadoGeral = 'OTIMO' | 'BOM' | 'REGULAR' | 'CRITICO';

export interface InventarioEspecieItemRequest {
  especieId: string;
  quantidade: number;
  dapMedio: number;
  alturaMedia: number;
}

export interface InventarioRequest {
  numeroParcela: string;
  areaFlorestalId: string;
  dataVistoria: string;        // LocalDate → 'YYYY-MM-DD'
  presencaPragas: boolean;
  descricaoPragas?: string;
  estadoGeral: EstadoGeral;
  /** Opcional: ADMIN pode registrar em nome de um colaborador. */
  colaboradorId?: string;
  especies: InventarioEspecieItemRequest[];
}

export interface InventarioEspecieResponse {
  id: string;
  especieId: string;
  especieNome: string;
  especieNomeCientifico: string;
  quantidade: number;
  dapMedio: number;
  alturaMedia: number;
}

export interface InventarioResponse {
  id: string;
  numeroParcela: string;
  areaFlorestalId: string;
  areaFlorestalNome: string;
  dataVistoria: string;
  presencaPragas: boolean;
  descricaoPragas?: string;
  estadoGeral: EstadoGeral;
  colaboradorId: string;
  colaboradorNome: string;
  criadoEm: string;
  especies: InventarioEspecieResponse[];
}

export interface AreaFlorestalOption {
  id: string;
  nome: string;
  identificadorUnico: string;
  ativo: boolean;
}

export interface EspecieOption {
  id: string;
  nomePopular: string;
  nomeCientifico: string;
  ativo: boolean;
}

export interface ColaboradorOption {
  id: string;
  nomeCompleto: string;
  funcao?: string;
  ativo?: boolean;
}
