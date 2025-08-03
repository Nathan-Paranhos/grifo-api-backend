// Controllers
export { InspectionController } from './InspectionController';
export { CompanyController } from './CompanyController';
export { UserController } from './UserController';
export { AuthController } from './AuthController';
export { PropertyController } from './PropertyController';
export { DashboardController } from './DashboardController';
export { ContestationController } from './ContestationController';
export { ExportController } from './ExportController';

// Controller instances (singletons)
import { inspectionController, InspectionController } from './InspectionController';
import { companyController, CompanyController } from './CompanyController';
import { userController, UserController } from './UserController';
import { authController, AuthController } from './AuthController';
import { propertyController, PropertyController } from './PropertyController';
import { dashboardController, DashboardController } from './DashboardController';
import { contestationController, ContestationController } from './ContestationController';
import { exportController, ExportController } from './ExportController';

export {
  inspectionController,
  companyController,
  userController,
  authController,
  propertyController,
  dashboardController,
  contestationController,
  exportController
};

// Factory functions
export const createInspectionController = () => new InspectionController();
export const createCompanyController = () => new CompanyController();
export const createUserController = () => new UserController();
export const createAuthController = () => new AuthController();
export const createPropertyController = () => new PropertyController();
export const createDashboardController = () => new DashboardController();
export const createContestationController = () => new ContestationController();
export const createExportController = () => new ExportController();