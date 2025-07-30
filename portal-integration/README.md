# 🌐 Portal Integration - Grifo API

Integração completa entre o **Portal de Produção** (`https://grifo-portal-v1.netlify.app`) e a **API REST** (`https://grifo-api-backend.onrender.com`) utilizando exclusivamente endpoints versionados (`/api/v1/*`) com autenticação segura via Firebase Authentication.

## 🎯 Características

- ✅ **100% Produção**: Sem testes, mocks ou dados fictícios
- 🔐 **Autenticação Segura**: Firebase Authentication com ID Tokens
- 🚀 **Endpoints Versionados**: Exclusivamente `/api/v1/*`
- 🔄 **Auto-renovação de Token**: Interceptor automático para tokens expirados
- 📱 **Notificações Push**: Suporte opcional para Firebase Messaging
- 🎨 **TypeScript**: Tipagem completa para melhor DX

## 📁 Estrutura dos Arquivos

```
portal-integration/
├── firebase.ts          # Configuração Firebase Web SDK
├── authInterceptor.ts   # Interceptor de autenticação automática
├── grifoApi.ts         # Serviço centralizado da API
├── useAuth.ts          # Hook/contexto de autenticação React
├── index.ts            # Exportações centralizadas
└── README.md           # Esta documentação
```

## 🚀 Configuração Inicial

### 1. Instalar Dependências

```bash
npm install firebase
# ou
yarn add firebase
```

### 2. Configurar Firebase no Portal

```typescript
// firebase.ts - Já configurado com credenciais de produção
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDRj2kodgFUW2-N1Boa5nP5IZYVg-HaJME",
  authDomain: "banco-visionaria.firebaseapp.com",
  databaseURL: "https://banco-visionaria-default-rtdb.firebaseio.com",
  projectId: "banco-visionaria",
  storageBucket: "banco-visionaria.firebasestorage.app",
  messagingSenderId: "806439611518",
  appId: "1:806439611518:web:591fc6ca38cb4459737c2f",
  measurementId: "G-NZKQKQYZVF"
};
```

### 3. Configurar a Aplicação React

```typescript
// App.tsx
import React from 'react';
import { AuthProvider } from './portal-integration';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Dashboard />
      </div>
    </AuthProvider>
  );
}

export default App;
```

## 🔐 Autenticação

### Login de Usuário

```typescript
// components/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../portal-integration';

function LoginForm() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Usuário será redirecionado automaticamente
    } catch (error) {
      console.error('Erro no login:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

### Verificação de Autenticação

```typescript
// components/ProtectedRoute.tsx
import React from 'react';
import { useAuthState } from '../portal-integration';
import LoginForm from './LoginForm';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuthState();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
}
```

## 📊 Consumo da API

### Dashboard

```typescript
// components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { grifoApi, type DashboardData } from '../portal-integration';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await grifoApi.getDashboard();
        if (response.success) {
          setDashboardData(response.data);
        } else {
          setError(response.error || 'Erro ao carregar dashboard');
        }
      } catch (err) {
        setError('Erro de conexão');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!dashboardData) return <div>Nenhum dado disponível</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats">
        <div className="stat-card">
          <h3>Propriedades</h3>
          <p>{dashboardData.totalProperties}</p>
        </div>
        <div className="stat-card">
          <h3>Vistorias</h3>
          <p>{dashboardData.totalInspections}</p>
        </div>
        <div className="stat-card">
          <h3>Usuários</h3>
          <p>{dashboardData.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Pendentes</h3>
          <p>{dashboardData.pendingInspections}</p>
        </div>
      </div>
    </div>
  );
}
```

### Lista de Propriedades

```typescript
// components/PropertyList.tsx
import React, { useState, useEffect } from 'react';
import { grifoApi, type Property } from '../portal-integration';

function PropertyList() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tipo: '',
    status: '',
    limit: 50
  });

  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true);
      try {
        const response = await grifoApi.getProperties(filters);
        if (response.success) {
          setProperties(response.data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar propriedades:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [filters]);

  return (
    <div className="property-list">
      <h2>Propriedades</h2>
      
      {/* Filtros */}
      <div className="filters">
        <select 
          value={filters.tipo} 
          onChange={(e) => setFilters({...filters, tipo: e.target.value})}
        >
          <option value="">Todos os tipos</option>
          <option value="casa">Casa</option>
          <option value="apartamento">Apartamento</option>
          <option value="comercial">Comercial</option>
        </select>
        
        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div>Carregando propriedades...</div>
      ) : (
        <div className="properties-grid">
          {properties.map((property) => (
            <div key={property.id} className="property-card">
              <h3>{property.endereco}</h3>
              <p>Tipo: {property.tipo}</p>
              <p>Status: {property.status}</p>
              {property.valor && <p>Valor: R$ {property.valor.toLocaleString()}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Criação de Nova Vistoria

```typescript
// components/CreateInspection.tsx
import React, { useState } from 'react';
import { grifoApi, type Inspection } from '../portal-integration';

function CreateInspection() {
  const [formData, setFormData] = useState({
    propertyId: '',
    vistoriadorId: '',
    dataAgendada: '',
    observacoes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const inspectionData: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'> = {
        ...formData,
        status: 'pendente',
        empresaId: '' // Será preenchido automaticamente pela API
      };

      const response = await grifoApi.createInspection(inspectionData);
      
      if (response.success) {
        alert('Vistoria criada com sucesso!');
        // Reset form
        setFormData({
          propertyId: '',
          vistoriadorId: '',
          dataAgendada: '',
          observacoes: ''
        });
      } else {
        alert(`Erro: ${response.error}`);
      }
    } catch (error) {
      alert('Erro ao criar vistoria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-inspection-form">
      <h2>Nova Vistoria</h2>
      
      <input
        type="text"
        placeholder="ID da Propriedade"
        value={formData.propertyId}
        onChange={(e) => setFormData({...formData, propertyId: e.target.value})}
        required
      />
      
      <input
        type="text"
        placeholder="ID do Vistoriador"
        value={formData.vistoriadorId}
        onChange={(e) => setFormData({...formData, vistoriadorId: e.target.value})}
        required
      />
      
      <input
        type="datetime-local"
        value={formData.dataAgendada}
        onChange={(e) => setFormData({...formData, dataAgendada: e.target.value})}
        required
      />
      
      <textarea
        placeholder="Observações"
        value={formData.observacoes}
        onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Criando...' : 'Criar Vistoria'}
      </button>
    </form>
  );
}
```

## 🔧 Configurações Avançadas

### Interceptor Personalizado

```typescript
// utils/customApi.ts
import { authenticatedFetch } from '../portal-integration';

// Função personalizada para requisições com tratamento de erro
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await authenticatedFetch(
    `https://grifo-api-backend.onrender.com/api/v1${endpoint}`,
    options
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};
```

### Notificações Push (Opcional)

```typescript
// components/NotificationSetup.tsx
import React, { useEffect } from 'react';
import { requestNotificationPermission } from '../portal-integration';

function NotificationSetup() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const token = await requestNotificationPermission();
        if (token) {
          console.log('Token de notificação:', token);
          // Enviar token para o backend se necessário
        }
      } catch (error) {
        console.error('Erro ao configurar notificações:', error);
      }
    };

    setupNotifications();
  }, []);

  return null; // Componente invisível
}
```

## 📋 Endpoints Disponíveis

| Método | Rota | Descrição |
|--------|------|----------|
| GET | `/dashboard` | Dados do dashboard |
| GET | `/inspections` | Lista vistorias |
| POST | `/inspections` | Cria nova vistoria |
| GET | `/inspections/:id` | Detalhe de uma vistoria |
| GET | `/properties` | Lista de imóveis |
| POST | `/properties` | Cria novo imóvel |
| GET | `/properties/:id` | Detalhe de um imóvel |
| GET | `/users` | Lista usuários da empresa |
| POST | `/users` | Cria novo usuário |
| GET | `/empresas` | Dados da empresa autenticada |
| PATCH | `/empresas/:id` | Atualiza dados da empresa |
| GET | `/contestations` | Lista contestações cadastradas |
| POST | `/contestations` | Envia nova contestação |

## 🚫 Restrições de Produção

- ❌ **Não utilizar** endpoints legados `/api/*` (reservados para mobile)
- ❌ **Não utilizar** tokens genéricos ou simulados
- ❌ **Não utilizar** `BYPASS_AUTH=true` ou similares
- ❌ **Não utilizar** scripts de teste ou dados fictícios
- ✅ **Utilizar apenas** dados reais e válidos
- ✅ **Utilizar apenas** endpoints `/api/v1/*`
- ✅ **Utilizar apenas** tokens Firebase válidos

## 🔗 Links Importantes

- **Portal de Produção**: https://grifo-portal-v1.netlify.app
- **API de Produção**: https://grifo-api-backend.onrender.com
- **Documentação Swagger**: https://grifo-api-backend.onrender.com/api-docs
- **Firebase Console**: https://console.firebase.google.com/project/banco-visionaria

## 🆘 Troubleshooting

### Erro 401 - Token Inválido
```typescript
// O interceptor já trata automaticamente, mas você pode forçar renovação:
const { getIdToken } = useAuth();
const newToken = await getIdToken();
```

### Erro de CORS
```typescript
// Verificar se o domínio está na lista CORS_ORIGIN do backend
// Domínios permitidos: https://grifo-portal-v1.netlify.app
```

### Firebase não inicializado
```typescript
// Verificar se as credenciais estão corretas no firebase.ts
// Verificar se o projeto Firebase está ativo
```

---

**🎯 Objetivo**: Integração 100% em produção, sem testes ou simulações, utilizando apenas dados reais e autenticação segura via Firebase Authentication.