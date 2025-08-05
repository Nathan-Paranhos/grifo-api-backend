export interface Property {
  id: string;
  empresaId: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  tipo: string;
  areaTotal?: number;
  areaConstruida?: number;
  descricao?: string;
  enderecoCompleto?: string;
  proprietario?: {
    nome: string;
    telefone?: string;
    email?: string;
    cpf?: string;
    rg?: string;
  };
  inquilino?: {
    nome?: string;
    telefone?: string;
    email?: string;
    cpf?: string;
    rg?: string;
  };
  valorAluguel?: number;
  valorIptu?: number;
  observacoes?: string;
  ativo?: boolean;
  createdAt: Date;
  updatedAt: Date;
}