export interface PlantioRequest {
  dataHora: string;
  areaFlorestalId: string;
  especieId: string;
  quantidadeMudas: number;
  latitudeTalhao: number;
  longitudeTalhao: number;
  temperatura: number;
  umidade: number;
  houveChuva: boolean;
  metodoPlantio: string;
  observacoes?: string;
}

export interface PlantioResponse {
  id: string;
  protocolo: string;
  dataHora: string;
  areaFlorestalId: string;
  areaFlorestalNome: string;
  especieId: string;
  especieNome: string;
  quantidadeMudas: number;
  latitudeTalhao: number;
  longitudeTalhao: number;
  temperatura: number;
  umidade: number;
  houveChuva: boolean;
  metodoPlantio: string;
  observacoes: string;
  colaboradorId: string;
  colaboradorNome: string;
}

export interface PlantioPage {
  content: PlantioResponse[];
  totalElements: number;
  page: number;
  size: number;
}

export interface PlantioQueryParams {
  area?: string | null;
  especie?: string | null;
  colaboradorId?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  page: number;
  size: number;
}

export interface AreaPlantioOption {
  id: string;
  nome: string;
  status: string;
  identificadorUnico?: string;
}

export interface EspeciePlantioOption {
  id: string;
  nomePopular: string;
  nomeCientifico: string;
  ativo: boolean;
}

export interface ColaboradorPlantioOption {
  id: string;
  nome: string;
  funcao: string;
  status: string;
}
