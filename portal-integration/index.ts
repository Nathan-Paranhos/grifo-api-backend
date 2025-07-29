/**
 * Portal Integration - Grifo API
 * 
 * Este módulo fornece integração completa entre o portal web de produção
 * (https://grifo-portal-v1.netlify.app) e a API REST (https://grifo-api.onrender.com)
 * utilizando exclusivamente endpoints versionados (/api/v1/*) com autenticação
 * segura via Firebase Authentication.
 */

// Firebase Configuration
export { default as firebaseApp, auth, messaging, requestNotificationPermission } from './firebase';

// Authentication Interceptor
export { AuthInterceptor, authInterceptor, authenticatedFetch } from './authInterceptor';

// API Service
export { 
  GrifoApiService, 
  grifoApi,
  type ApiResponse,
  type Property,
  type Inspection,
  type User,
  type Company,
  type DashboardData,
  type Contestation
} from './grifoApi';

// Authentication Hook/Context
export {
  useAuth,
  useAuthState,
  useAuthActions,
  AuthProvider,
  type AuthUser,
  type AuthContextType
} from './useAuth';

/**
 * Configurações de produção
 */
export const PRODUCTION_CONFIG = {
  API_BASE_URL: 'https://grifo-api.onrender.com/api/v1',
  PORTAL_URL: 'https://grifo-portal-v1.netlify.app',
  FIREBASE_PROJECT_ID: 'banco-visionaria',
  SWAGGER_DOCS: 'https://grifo-api.onrender.com/api-docs',
  VAPID_KEY: 'BNcV8bkNP0aR5fXJsgMWAKboOUWDG0S3m5jmKdgQNdZIB6ZjJuhHTMQGhe0qb_PTsGWxP2-Y8b0bySCwiglOx0'
} as const;

/**
 * Endpoints disponíveis na API v1
 */
export const API_ENDPOINTS = {
  DASHBOARD: '/dashboard',
  INSPECTIONS: '/inspections',
  PROPERTIES: '/properties',
  USERS: '/users',
  COMPANIES: '/empresas',
  CONTESTATIONS: '/contestations'
} as const;

/**
 * Exemplo de uso básico:
 * 
 * ```typescript
 * import { AuthProvider, useAuth, grifoApi } from './portal-integration';
 * 
 * // 1. Envolver a aplicação com o AuthProvider
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Dashboard />
 *     </AuthProvider>
 *   );
 * }
 * 
 * // 2. Usar o hook de autenticação
 * function Dashboard() {
 *   const { user, login, logout, isAuthenticated } = useAuth();
 *   const [properties, setProperties] = useState([]);
 * 
 *   useEffect(() => {
 *     if (isAuthenticated) {
 *       grifoApi.getProperties().then(response => {
 *         if (response.success) {
 *           setProperties(response.data);
 *         }
 *       });
 *     }
 *   }, [isAuthenticated]);
 * 
 *   if (!isAuthenticated) {
 *     return <LoginForm onLogin={login} />;
 *   }
 * 
 *   return (
 *     <div>
 *       <h1>Bem-vindo, {user?.email}</h1>
 *       <button onClick={logout}>Sair</button>
 *       <PropertyList properties={properties} />
 *     </div>
 *   );
 * }
 * ```
 */