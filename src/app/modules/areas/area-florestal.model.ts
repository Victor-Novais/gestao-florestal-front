export interface AreaFlorestal {
  id: number | string | null;
  identificadorUnico: string;
  nome: string;
  latitude: number;
  longitude: number;
  tipoFloresta: string;
  bioma: string;
  municipio: string;
  estado: string;
  hectares: number;
  status: string;
}

export interface AreaFlorestalFormData {
  identificadorUnico: string;
  nome: string;
  latitude: number;
  longitude: number;
  municipio: string;
  estado: string;
  hectares: number;
  tipoFloresta: string;
  bioma: string;
  status?: string;
}

export interface AreaFlorestalQueryParams {
  status?: string | null;
  bioma?: string | null;
  tipo?: string | null;
  page: number;
  size: number;
}

export interface AreaFlorestalPage {
  content: AreaFlorestal[];
  totalElements: number;
  page: number;
  size: number;
}
