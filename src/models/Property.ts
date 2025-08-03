export interface Property {
  id: string;
  empresaId: string;
  enderecoCompleto?: string;
  proprietario?: {
    nome?: string;
  };
  // Add other property fields as needed
  createdAt: Date;
  updatedAt: Date;
}