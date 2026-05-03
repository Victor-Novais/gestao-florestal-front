export type TipoOcorrencia =
  | 'INCENDIO' | 'DESMATAMENTO_ILEGAL' | 'EROSAO' | 'ESPECIE_INVASORA'
  | 'PRAGA_DOENCA' | 'ACIDENTE_ANIMAL' | 'ACIDENTE_EQUIPE' | 'INFRACAO_AMBIENTAL';

export type UrgenciaOcorrencia = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export interface OcorrenciaRequest {
  tipo: TipoOcorrencia;
  areaFlorestalId: string;
  latitude?: number;
  longitude?: number;
  urgencia: UrgenciaOcorrencia;
  descricao?: string;
  urlFotos?: string[];
}

export interface OcorrenciaResponse {
  id: string;
  numeroProtocolo: string;
  tipo: TipoOcorrencia;
  areaFlorestalId: string;
  areaFlorestalNome: string;
  latitude?: number;
  longitude?: number;
  urgencia: UrgenciaOcorrencia;
  descricao?: string;
  dataRegistro: string;
  colaboradorId: string;
  colaboradorNome: string;
  fotos: string[];
  alertaEmitido: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const TIPO_OCORRENCIA_LABELS: Record<TipoOcorrencia, { label: string; icon: string }> = {
  INCENDIO:            { label: 'Incêndio',              icon: 'local_fire_department' },
  DESMATAMENTO_ILEGAL: { label: 'Desmatamento Ilegal',   icon: 'forest' },
  EROSAO:              { label: 'Erosão',                icon: 'landslide' },
  ESPECIE_INVASORA:    { label: 'Espécie Invasora',      icon: 'pest_control' },
  PRAGA_DOENCA:        { label: 'Praga/Doença',          icon: 'bug_report' },
  ACIDENTE_ANIMAL:     { label: 'Acidente com Animal',   icon: 'cruelty_free' },
  ACIDENTE_EQUIPE:     { label: 'Acidente com Equipe',   icon: 'personal_injury' },
  INFRACAO_AMBIENTAL:  { label: 'Infração Ambiental',    icon: 'gavel' },
};

export const URGENCIA_CONFIG: Record<UrgenciaOcorrencia, { label: string; color: string; bg: string }> = {
  BAIXO:   { label: 'Baixo',    color: '#2e7d32', bg: '#e8f5e9' },
  MEDIO:   { label: 'Médio',    color: '#f57f17', bg: '#fff9c4' },
  ALTO:    { label: 'Alto',     color: '#e65100', bg: '#fbe9e7' },
  CRITICO: { label: 'Crítico',  color: '#b71c1c', bg: '#ffebee' },
};
