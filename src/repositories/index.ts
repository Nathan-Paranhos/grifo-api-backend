// Exportar todos os repositories
export * from './BaseRepository';
export * from './InspectionRepository';
export * from './CompanyRepository';

// Instâncias dos repositories para uso direto
export { InspectionRepository } from './InspectionRepository';
export { CompanyRepository } from './CompanyRepository';

// Factory para criar instâncias
import { InspectionRepository } from './InspectionRepository';
import { CompanyRepository } from './CompanyRepository';

export const createInspectionRepository = () => new InspectionRepository();
export const createCompanyRepository = () => new CompanyRepository();