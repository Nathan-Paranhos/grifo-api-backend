// Services
export { InspectionService } from './InspectionService';
export { CompanyService } from './CompanyService';
export { UserService } from './UserService';
export { PropertyService } from './PropertyService';

// Types
export type { CreateInspectionData, UpdateInspectionData, InspectionFilters } from './InspectionService';
export type { CreateCompanyData, UpdateCompanyData } from './CompanyService';
export type { CreateUserData, UpdateUserData, User } from './UserService';

// Export PropertyService instance
export { propertyService } from './PropertyService';

// Service instances (singletons)
// Lazy loading para evitar inicialização prematura dos serviços
let _inspectionService: any = null;
let _companyService: any = null;
let _userService: any = null;

export const getInspectionService = () => {
  if (!_inspectionService) {
    const { InspectionService } = require('./InspectionService');
    _inspectionService = new InspectionService();
  }
  return _inspectionService;
};

export const getCompanyService = () => {
  if (!_companyService) {
    const { CompanyService } = require('./CompanyService');
    _companyService = new CompanyService();
  }
  return _companyService;
};

export const getUserService = () => {
  if (!_userService) {
    const { UserService } = require('./UserService');
    _userService = new UserService(getCompanyService());
  }
  return _userService;
};

// Manter compatibilidade com código existente
export const inspectionService = {
  get: getInspectionService
};
export const companyService = {
  get: getCompanyService
};
export const userService = {
  get: getUserService
};

// Factory functions
export const createInspectionService = () => {
  const { InspectionService } = require('./InspectionService');
  return new InspectionService();
};
export const createCompanyService = () => {
  const { CompanyService } = require('./CompanyService');
  return new CompanyService();
};
export const createUserService = () => {
  const { UserService } = require('./UserService');
  return new UserService();
};