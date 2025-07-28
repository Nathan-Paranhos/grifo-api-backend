# Exemplos de Integração - Portal Grifo

Este documento contém exemplos práticos de como integrar o portal web com a API Grifo.

## Configuração Inicial

### 1. Configuração do Firebase (Frontend)

```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

### 2. Configuração do Cliente API

```javascript
// api-client.js
import { auth } from './firebase-config';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://grifo-api.onrender.com/api/v1'
  : 'http://localhost:3006/api/v1';

class ApiClient {
  async getAuthToken() {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');
    return await user.getIdToken();
  }

  async request(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro na requisição');
    }

    return await response.json();
  }

  // Métodos específicos
  async getDashboard(vistoriadorId = null) {
    const params = vistoriadorId ? `?vistoriadorId=${vistoriadorId}` : '';
    return this.request(`/dashboard${params}`);
  }

  async getInspections(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/inspections?${params}`);
  }

  async getInspection(id) {
    return this.request(`/inspections/${id}`);
  }

  async getProperties(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/properties?${params}`);
  }

  async getUsers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/users?${params}`);
  }

  async getContestations(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/contestations?${params}`);
  }

  async updateContestationStatus(id, status, resposta) {
    return this.request(`/contestations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, resposta })
    });
  }
}

export const apiClient = new ApiClient();
```

## Exemplos de Uso

### 1. Dashboard Principal

```javascript
// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api-client';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDashboard();
      setStats(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total de Vistorias</h3>
          <p>{stats.overview.total}</p>
        </div>
        <div className="stat-card">
          <h3>Pendentes</h3>
          <p>{stats.overview.pendentes}</p>
        </div>
        <div className="stat-card">
          <h3>Concluídas</h3>
          <p>{stats.overview.concluidas}</p>
        </div>
        <div className="stat-card">
          <h3>Em Andamento</h3>
          <p>{stats.overview.emAndamento}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
```

### 2. Lista de Vistorias

```javascript
// InspectionsList.jsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api-client';

function InspectionsList() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    dataInicio: '',
    dataFim: '',
    limit: '50'
  });

  useEffect(() => {
    loadInspections();
  }, [filters]);

  const loadInspections = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getInspections(filters);
      setInspections(response.data);
    } catch (err) {
      console.error('Erro ao carregar vistorias:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="inspections-list">
      <h1>Vistorias</h1>
      
      {/* Filtros */}
      <div className="filters">
        <select 
          value={filters.status} 
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="Pendente">Pendente</option>
          <option value="Em Andamento">Em Andamento</option>
          <option value="Concluída">Concluída</option>
        </select>
        
        <input 
          type="date" 
          value={filters.dataInicio}
          onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
          placeholder="Data Início"
        />
        
        <input 
          type="date" 
          value={filters.dataFim}
          onChange={(e) => handleFilterChange('dataFim', e.target.value)}
          placeholder="Data Fim"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <table className="inspections-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Data</th>
              <th>Status</th>
              <th>Tipo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map(inspection => (
              <tr key={inspection.id}>
                <td>{inspection.id}</td>
                <td>{new Date(inspection.dataVistoria).toLocaleDateString()}</td>
                <td>
                  <span className={`status ${inspection.status.toLowerCase()}`}>
                    {inspection.status}
                  </span>
                </td>
                <td>{inspection.tipo}</td>
                <td>
                  <button onClick={() => viewInspection(inspection.id)}>
                    Ver Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InspectionsList;
```

### 3. Detalhes da Vistoria

```javascript
// InspectionDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../services/api-client';

function InspectionDetails() {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInspection();
  }, [id]);

  const loadInspection = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getInspection(id);
      setInspection(response.data);
    } catch (err) {
      console.error('Erro ao carregar vistoria:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (!inspection) return <div>Vistoria não encontrada</div>;

  return (
    <div className="inspection-details">
      <h1>Detalhes da Vistoria</h1>
      
      <div className="inspection-info">
        <div className="info-section">
          <h3>Informações Gerais</h3>
          <p><strong>ID:</strong> {inspection.id}</p>
          <p><strong>Status:</strong> {inspection.status}</p>
          <p><strong>Tipo:</strong> {inspection.tipo}</p>
          <p><strong>Data:</strong> {new Date(inspection.dataVistoria).toLocaleString()}</p>
        </div>

        {inspection.observacoes && (
          <div className="info-section">
            <h3>Observações</h3>
            <p>{inspection.observacoes}</p>
          </div>
        )}

        {inspection.fotos && inspection.fotos.length > 0 && (
          <div className="info-section">
            <h3>Fotos</h3>
            <div className="photos-grid">
              {inspection.fotos.map((foto, index) => (
                <div key={index} className="photo-item">
                  <img src={foto.url} alt={foto.descricao || `Foto ${index + 1}`} />
                  {foto.descricao && <p>{foto.descricao}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InspectionDetails;
```

### 4. Gestão de Contestações

```javascript
// ContestationsList.jsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api-client';

function ContestationsList() {
  const [contestations, setContestations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContestations();
  }, []);

  const loadContestations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getContestations();
      setContestations(response.data);
    } catch (err) {
      console.error('Erro ao carregar contestações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status, resposta) => {
    try {
      await apiClient.updateContestationStatus(id, status, resposta);
      // Recarregar lista
      loadContestations();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  return (
    <div className="contestations-list">
      <h1>Contestações</h1>
      
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="contestations-grid">
          {contestations.map(contestation => (
            <div key={contestation.id} className="contestation-card">
              <h3>Contestação #{contestation.id}</h3>
              <p><strong>Status:</strong> {contestation.status}</p>
              <p><strong>Motivo:</strong> {contestation.motivo}</p>
              <p><strong>Descrição:</strong> {contestation.descricao}</p>
              
              {contestation.status === 'Pendente' && (
                <div className="actions">
                  <button 
                    onClick={() => handleStatusUpdate(contestation.id, 'Aprovada', 'Contestação aprovada')}
                    className="btn-approve"
                  >
                    Aprovar
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(contestation.id, 'Rejeitada', 'Contestação rejeitada')}
                    className="btn-reject"
                  >
                    Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContestationsList;
```

### 5. Hook Personalizado para API

```javascript
// hooks/useApi.js
import { useState, useEffect } from 'react';
import { apiClient } from '../services/api-client';

export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { dependencies = [], ...requestOptions } = options;

  useEffect(() => {
    loadData();
  }, dependencies);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.request(endpoint, requestOptions);
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    loadData();
  };

  return { data, loading, error, refetch };
}

// Exemplo de uso:
// const { data: inspections, loading, error } = useApi('/inspections', {
//   dependencies: [filters]
// });
```

### 6. Tratamento de Erros Global

```javascript
// utils/error-handler.js
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

export function handleApiError(error) {
  if (error.status === 401) {
    // Token expirado ou inválido
    window.location.href = '/login';
    return;
  }

  if (error.status === 403) {
    // Acesso negado
    alert('Você não tem permissão para acessar este recurso.');
    return;
  }

  if (error.status >= 500) {
    // Erro do servidor
    alert('Erro interno do servidor. Tente novamente mais tarde.');
    return;
  }

  // Outros erros
  alert(error.message || 'Erro desconhecido');
}
```

### 7. Configuração de Interceptadores

```javascript
// services/api-interceptors.js
import { auth } from '../firebase-config';
import { handleApiError } from '../utils/error-handler';

// Interceptador para adicionar token automaticamente
export async function requestInterceptor(config) {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

// Interceptador para tratar erros globalmente
export function responseInterceptor(response) {
  return response;
}

export function errorInterceptor(error) {
  handleApiError(error);
  return Promise.reject(error);
}
```

## Configuração de Ambiente

### Variáveis de Ambiente (.env)

```bash
# .env.development
REACT_APP_API_URL=http://localhost:3006/api/v1
REACT_APP_FIREBASE_API_KEY=your-dev-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-dev-project-id

# .env.production
REACT_APP_API_URL=https://grifo-api.onrender.com/api/v1
REACT_APP_FIREBASE_API_KEY=your-prod-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-prod-project-id
```

## Testes

### Teste de Integração com API

```javascript
// tests/api-client.test.js
import { apiClient } from '../services/api-client';

// Mock do Firebase Auth
jest.mock('../firebase-config', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    }
  }
}));

describe('ApiClient', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should make authenticated request', async () => {
    const mockResponse = {
      success: true,
      data: { total: 10 }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    const result = await apiClient.getDashboard();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/dashboard'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    );

    expect(result).toEqual(mockResponse);
  });
});
```

## Monitoramento e Logs

### Cliente de Logs

```javascript
// services/logger.js
class Logger {
  info(message, data = {}) {
    console.log(`[INFO] ${message}`, data);
    // Enviar para serviço de monitoramento se necessário
  }

  error(message, error = {}) {
    console.error(`[ERROR] ${message}`, error);
    // Enviar para serviço de monitoramento
  }

  warn(message, data = {}) {
    console.warn(`[WARN] ${message}`, data);
  }
}

export const logger = new Logger();
```

Esta documentação fornece uma base sólida para integrar o portal web com a API Grifo, incluindo autenticação, tratamento de erros, e exemplos práticos de uso.