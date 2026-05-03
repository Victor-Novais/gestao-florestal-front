export type ColaboradorStatus = 'ATIVO' | 'INATIVO';

export interface UsuarioAcesso {
  id: number | string | null;
  username: string;
  email?: string;
  ativo?: boolean;
}

export interface HistoricoAcesso {
  id: number | string | null;
  data: string;
  ip: string;
  dispositivo: string;
}

export interface Colaborador {
  id: number | string | null;
  nome: string;
  cpf: string;
  matricula: string;
  funcao: string;
  areaAtuacao: string;
  dataAdmissao: string;
  qualificacoes: string;
  certificacoes: string;
  contatoEmergenciaNome: string;
  contatoEmergenciaTelefone: string;
  status: ColaboradorStatus;
  usuario?: UsuarioAcesso | null;
  historicoAcessos?: HistoricoAcesso[];
}

export interface ColaboradorPage {
  content: Colaborador[];
  totalElements: number;
  page: number;
  size: number;
}

export interface ColaboradorQueryParams {
  funcao: string | null;
  areaAtuacao: string | null;
  status: ColaboradorStatus | null;
  page: number;
  size: number;
}

export interface ColaboradorFormData {
  nome: string;
  cpf: string;
  matricula: string;
  funcao: string;
  areaAtuacao: string;
  dataAdmissao: string;
  qualificacoes: string;
  certificacoes: string;
  contatoEmergenciaNome: string;
  contatoEmergenciaTelefone: string;
  criarAcessoSistema?: boolean;
  senha?: string;
}
