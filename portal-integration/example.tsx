/**
 * Exemplo prático de uso da integração Portal + API Grifo
 * 
 * Este arquivo demonstra como implementar um componente React
 * que utiliza a integração completa com autenticação Firebase
 * e consumo da API de produção.
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  AuthProvider,
  useAuth,
  useAuthState,
  grifoApi,
  type DashboardData,
  type Property
} from './index';

/**
 * Componente de Login
 */
const LoginForm: React.FC = () => {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      console.log('Login realizado com sucesso!');
    } catch (error) {
      console.error('Erro no login:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', maxWidth: '400px' }}>
      <h2>Login - Portal Grifo</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="password">Senha:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha"
          required
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        style={{ 
          width: '100%', 
          padding: '10px', 
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
      
      {error && (
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
    </form>
  );
};

/**
 * Componente do Dashboard
 */
const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar dados do dashboard
        const dashboardResponse = await grifoApi.getDashboard();
        if (dashboardResponse.success) {
          setDashboardData(dashboardResponse.data);
        }

        // Carregar propriedades
        const propertiesResponse = await grifoApi.getProperties({ limit: 10 });
        if (propertiesResponse.success) {
          setProperties(propertiesResponse.data || []);
        }
      } catch (err) {
        setError('Erro ao carregar dados');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Carregando dados...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>Erro: {error}</h2>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '1px solid #eee',
        paddingBottom: '15px'
      }}>
        <h1>Dashboard - Portal Grifo</h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sair
        </button>
      </header>

      {/* Estatísticas do Dashboard */}
      {dashboardData && (
        <section style={{ marginBottom: '30px' }}>
          <h2>Estatísticas</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginTop: '15px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3>Propriedades</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                {dashboardData.totalProperties || 0}
              </p>
            </div>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3>Vistorias</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {dashboardData.totalInspections || 0}
              </p>
            </div>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3>Usuários</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                {dashboardData.totalUsers || 0}
              </p>
            </div>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3>Pendentes</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                {dashboardData.pendingInspections || 0}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Lista de Propriedades */}
      <section>
        <h2>Propriedades Recentes</h2>
        {properties.length > 0 ? (
          <div style={{ marginTop: '15px' }}>
            {properties.map((property) => (
              <div 
                key={property.id} 
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}
              >
                <h4 style={{ margin: '0 0 10px 0' }}>{property.endereco}</h4>
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
                  <span><strong>Tipo:</strong> {property.tipo}</span>
                  <span><strong>Status:</strong> {property.status}</span>
                  {property.valor && (
                    <span><strong>Valor:</strong> R$ {property.valor.toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Nenhuma propriedade encontrada.</p>
        )}
      </section>
    </div>
  );
};

/**
 * Componente de Rota Protegida
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuthState();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Verificando autenticação...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
};

/**
 * Componente Principal da Aplicação
 */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif'
      }}>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </div>
    </AuthProvider>
  );
};

export default App;

/**
 * Exemplo de uso em uma aplicação React:
 * 
 * ```tsx
 * import React from 'react';
 * import ReactDOM from 'react-dom/client';
 * import App from './portal-integration/example';
 * 
 * const root = ReactDOM.createRoot(
 *   document.getElementById('root') as HTMLElement
 * );
 * 
 * root.render(
 *   <React.StrictMode>
 *     <App />
 *   </React.StrictMode>
 * );
 * ```
 */