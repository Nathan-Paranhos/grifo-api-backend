# Integração Portal Grifo com API

## 📋 Resumo dos Testes da API

### ✅ Status das Rotas (Testado em 28/07/2025)

**Rotas Públicas (Funcionando):**
- ✅ `GET /api/health` - Status da API
- ✅ `GET /` - Informações gerais da API
- ✅ `GET /api-docs` - Documentação Swagger

**Rotas Legacy (Protegidas - Retornam 401):**
- 🔒 `GET /api/dashboard`
- 🔒 `GET /api/inspections`
- 🔒 `GET /api/properties`
- 🔒 `GET /api/sync`
- 🔒 `GET /api/contestations`
- 🔒 `GET /api/users`
- 🔒 `GET /api/empresas`

**Rotas V1 (Protegidas - Retornam 401):**
- 🔒 `GET /api/v1/dashboard`
- 🔒 `GET /api/v1/inspections`
- 🔒 `GET /api/v1/properties`
- 🔒 `GET /api/v1/sync`
- 🔒 `GET /api/v1/contestations`
- 🔒 `GET /api/v1/users`
- 🔒 `GET /api/v1/empresas`

## 🔧 Configuração do Portal

### 1. Configuração Firebase no Portal

```javascript
// firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { auth, analytics };
```

### 2. Cliente API para o Portal

```javascript
// api-client.js
import { auth } from './firebase-config.js';

class GrifoAPIClient {
  constructor() {
    this.baseURL = 'https://grifo-api.onrender.com';
    this.token = null;
  }

  // Configurar token de autenticação
  async setAuthToken() {
    if (auth.currentUser) {
      this.token = await auth.currentUser.getIdToken();
    }
  }

  // Fazer requisição autenticada
  async request(endpoint, options = {}) {
    await this.setAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://grifo-portal-v1.netlify.app',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Não autorizado - faça login novamente');
      }
      throw new Error(`Erro na API: ${response.status}`);
    }

    return response.json();
  }

  // Métodos específicos para cada endpoint
  async getDashboard() {
    return this.request('/api/v1/dashboard');
  }

  async getInspections() {
    return this.request('/api/v1/inspections');
  }

  async getProperties() {
    return this.request('/api/v1/properties');
  }

  async getUsers() {
    return this.request('/api/v1/users');
  }

  async getCompanies() {
    return this.request('/api/v1/empresas');
  }

  async sync() {
    return this.request('/api/v1/sync', { method: 'POST' });
  }

  async getContestations() {
    return this.request('/api/v1/contestations');
  }

  // Verificar status da API
  async getHealth() {
    const response = await fetch(`${this.baseURL}/api/health`);
    return response.json();
  }
}

export default new GrifoAPIClient();
```

### 3. Hook React para Autenticação

```javascript
// hooks/useAuth.js
import { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw new Error('Erro ao fazer login: ' + error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error('Erro ao fazer logout: ' + error.message);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };
}
```

### 4. Exemplo de Uso no Portal

```javascript
// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api-client';
import { useAuth } from '../hooks/useAuth';

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
    }
  }, [isAuthenticated]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div>Por favor, faça login para acessar o dashboard.</div>;
  }

  if (loading) {
    return <div>Carregando dashboard...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {dashboardData && (
        <pre>{JSON.stringify(dashboardData, null, 2)}</pre>
      )}
    </div>
  );
}

export default Dashboard;
```

## 🚀 Próximos Passos

1. **Implementar Autenticação**: Configure o Firebase Auth no portal
2. **Criar Usuários**: Adicione usuários no Firebase Authentication
3. **Testar Integração**: Use o cliente API para testar as rotas protegidas
4. **Implementar UI**: Crie interfaces para cada funcionalidade

## 🔍 Verificação de Status

Para verificar se a API está funcionando:

```bash
# Testar rota pública
curl https://grifo-api.onrender.com/api/health

# Testar rota protegida (deve retornar 401)
curl https://grifo-api.onrender.com/api/v1/dashboard
```

## 📚 Documentação

- **Swagger UI**: https://grifo-api.onrender.com/api-docs
- **Health Check**: https://grifo-api.onrender.com/api/health
- **API Info**: https://grifo-api.onrender.com/

---

**Status**: ✅ API funcionando corretamente
**CORS**: ✅ Configurado para o portal
**Autenticação**: 🔒 Firebase Auth obrigatório para rotas protegidas