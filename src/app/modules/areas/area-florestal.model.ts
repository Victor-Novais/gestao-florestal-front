export interface AreaFlorestal {
  id: number | string | null;
  nome: string;
  latitude: number;
  longitude: number;
  tipo: string;
  bioma: string;
  municipio: string;
  estado: string;
  hectares: number;
  status: string;
}

export interface AreaFlorestalFormData {
  nome: string;
  latitude: number;
  longitude: number;
  municipio: string;
  estado: string;
  hectares: number;
  tipo: string;
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
