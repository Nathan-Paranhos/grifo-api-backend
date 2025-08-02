// Controllers
export { InspectionController } from './InspectionController';
export { CompanyController } from './CompanyController';
export { UserController } from './UserController';
export { AuthController } from './AuthController';

// Controller instances (singletons)
const inspectionController = new InspectionController();
const companyController = new CompanyController();
const userController = new UserController();
const authController = new AuthController();

export {
  inspectionController,
  companyController,
  userController,
  authController
};

// Factory functions
export const createInspectionController = () => new InspectionController();
export const createCompanyController = () => new CompanyController();
export const createUserController = () => new UserController();
export const createAuthController = () => new AuthController();