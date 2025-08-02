// Services
export { InspectionService } from './InspectionService';
export { CompanyService } from './CompanyService';
export { UserService } from './UserService';

// Types
export type { CreateInspectionData, UpdateInspectionData, InspectionFilters } from './InspectionService';
export type { CreateCompanyData, UpdateCompanyData } from './CompanyService';
export type { CreateUserData, UpdateUserData, User } from './UserService';

// Service instances (singletons)
const inspectionService = new InspectionService();
const companyService = new CompanyService();
const userService = new UserService();

export {
  inspectionService,
  companyService,
  userService
};

// Factory functions
export const createInspectionService = () => new InspectionService();
export const createCompanyService = () => new CompanyService();
export const createUserService = () => new UserService();