# 📚 Documentação Completa da API Grifo

> **Sistema de Backend para Gerenciamento de Vistorias Imobiliárias**

## 🌐 Informações Gerais

- **URL de Produção**: https://grifo-api.onrender.com
- **Versão**: 1.0.0
- **Ambiente**: Production
- **Documentação Interativa**: https://grifo-api.onrender.com/api-docs
- **Health Check**: https://grifo-api.onrender.com/api/health
- **Tecnologias**: Node.js v18+, TypeScript, Firebase, Express.js
- **Banco de Dados**: Firebase Firestore
- **Autenticação**: Firebase Authentication

## 🔐 Autenticação

### Firebase Authentication
Todos os endpoints protegidos requerem autenticação via Firebase Auth Token.

**Header obrigatório:**
```
Authorization: Bearer <firebase_id_token>
```

### Custom Claims
O sistema utiliza custom claims do Firebase para controle de acesso:
- `empresaId`: ID da empresa do usuário
- `role`: Papel do usuário (`admin`, `user`, `vistoriador`, `gerente`)

### Endpoints de Autenticação

#### POST /api/auth/login
**Descrição**: Login com Firebase e geração de JWT
**Autenticação**: Não requerida

**Body**:
```json
{
  "firebaseToken": "string (obrigatório)",
  "empresaId": "string (opcional)"
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "role": "admin",
      "empresaId": "empresa_id"
    }
  }
}
```

#### POST /api/auth/refresh
**Descrição**: Renovar token de acesso
**Autenticação**: Não requerida

**Body**:
```json
{
  "refreshToken": "string (obrigatório)"
}
```

#### POST /api/auth/logout
**Descrição**: Logout do usuário
**Autenticação**: Não requerida

#### GET /api/auth/me
**Descrição**: Obter dados do usuário autenticado
**Autenticação**: Obrigatória

#### GET /api/auth/validate
**Descrição**: Validar token de acesso
**Autenticação**: Obrigatória

### Fluxo de Autenticação
1. **Login no Firebase**: O cliente faz login via Firebase Auth
2. **Obtenção do Token**: Cliente obtém o ID Token do Firebase
3. **Login na API**: POST /api/auth/login com firebaseToken
4. **Requisições**: Inclui o accessToken no header `Authorization`
5. **Verificação**: API verifica o token com Firebase Admin SDK
6. **Extração de Claims**: API extrai `empresaId` e `role` do token
7. **Isolamento de Dados**: Todas as consultas são filtradas por `empresaId`

## 📋 Endpoints Disponíveis

### 🔓 Endpoints Públicos

#### GET /api/health
**Descrição**: Verifica o status da API

**Resposta de Sucesso (200)**:
```json
{
  "status": "ok",
  "timestamp": "2025-07-31T10:52:04.035Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": "425 segundos",
  "services": {
    "firebase": "connected",
    "database": "available"
  },
  "memory": {
    "used": "55 MB",
    "total": "59 MB"
  },
  "system": {
    "platform": "linux",
    "nodeVersion": "v22.16.0",
    "pid": 116
  }
}
```

#### GET /
**Descrição**: Informações gerais da API e lista de endpoints

**Resposta de Sucesso (200)**:
```json
{
  "message": "Grifo API Backend",
  "version": "1.0.0",
  "environment": "production",
  "endpoints": {
    "public": ["/api/health"],
    "endpoints": [
      "/api/auth",
      "/api/users",
      "/api/companies",
      "/api/inspections",
      "/api/dashboard",
      "/api/properties",
      "/api/sync",
      "/api/contestations",
      "/api/notifications",
      "/api/uploads",
      "/api/exports",
      "/api/reports"
    ]
  },
  "authentication": {
    "required": "Firebase Auth Token",
    "header": "Authorization: Bearer <token>",
    "note": "All protected endpoints require authentication"
  },
  "compatibility": {
    "mobile": "Uses /api/* endpoints (legacy)",
    "portal": "Uses /api/v1/* endpoints (versioned)"
  },
  "documentation": "/api-docs"
}
```

### 🔒 Endpoints Protegidos

#### 👥 Usuários

##### GET /api/users
**Descrição**: Lista usuários da empresa
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

**Parâmetros de Query**:
- `role`: Filtrar por papel (`admin`, `vistoriador`, `usuario`, `gerente`)
- `ativo`: Filtrar por status ativo (`true`/`false`)
- `limit`: Limite de resultados (número inteiro)
- `page`: Página para paginação (número inteiro)

**Exemplo de Requisição**:
```
GET /api/users?role=vistoriador&ativo=true&limit=20
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "user_id_1",
      "nome": "João Silva",
      "email": "joao@empresa.com",
      "role": "vistoriador",
      "ativo": true,
      "empresaId": "empresa_123",
      "telefone": "+5511999999999",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "error": null
}
```

##### GET /api/users/:id ou /api/v1/users/:id
**Descrição**: Obtém detalhes de um usuário específico
**Autenticação**: Obrigatória
**Restrição**: Apenas usuários da mesma empresa

**Parâmetros de Path**:
- `id`: ID do usuário (string obrigatória)

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "id": "user_id_1",
    "nome": "João Silva",
    "email": "joao@empresa.com",
    "role": "vistoriador",
    "ativo": true,
    "empresaId": "empresa_123",
    "telefone": "+5511999999999",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  },
  "error": null
}
```

##### POST /api/users ou /api/v1/users
**Descrição**: Cria um novo usuário
**Autenticação**: Obrigatória
**Permissão**: Apenas administradores

**Body**:
```json
{
  "nome": "string (obrigatório, min: 1 caractere)",
  "email": "string (obrigatório, formato email válido)",
  "role": "admin|vistoriador|usuario|gerente (obrigatório)",
  "telefone": "string (opcional)",
  "ativo": "boolean (opcional, padrão: true)"
}
```

**Exemplo de Body**:
```json
{
  "nome": "Maria Santos",
  "email": "maria@empresa.com",
  "role": "vistoriador",
  "telefone": "+5511888888888",
  "ativo": true
}
```

**Resposta de Sucesso (201)**:
```json
{
  "success": true,
  "data": {
    "id": "new_user_id",
    "nome": "Maria Santos",
    "email": "maria@empresa.com",
    "role": "vistoriador",
    "ativo": true,
    "empresaId": "empresa_123",
    "telefone": "+5511888888888",
    "createdAt": "2025-01-31T15:45:00Z"
  },
  "error": null
}
```

##### PUT /api/users/:id ou /api/v1/users/:id
**Descrição**: Atualiza um usuário existente
**Autenticação**: Obrigatória
**Permissão**: Apenas administradores

**Parâmetros de Path**:
- `id`: ID do usuário (string obrigatória)

**Body** (todos os campos são opcionais):
```json
{
  "nome": "string (opcional, min: 1 caractere)",
  "email": "string (opcional, formato email válido)",
  "role": "admin|vistoriador|usuario|gerente (opcional)",
  "telefone": "string (opcional)",
  "ativo": "boolean (opcional)"
}
```

**Exemplo de Body**:
```json
{
  "nome": "João Silva Santos",
  "telefone": "+5511777777777",
  "ativo": false
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "id": "user_id_1",
    "nome": "João Silva Santos",
    "email": "joao@empresa.com",
    "role": "vistoriador",
    "ativo": false,
    "empresaId": "empresa_123",
    "telefone": "+5511777777777",
    "updatedAt": "2025-01-31T16:00:00Z"
  },
  "error": null
}
```

##### POST /api/users/set-claims
**Descrição**: Define custom claims para um usuário no Firebase
**Autenticação**: Obrigatória
**Permissão**: Apenas administradores
**Restrição**: Admin só pode setar claims para sua própria empresa

**Body**:
```json
{
  "uid": "string (obrigatório, Firebase UID do usuário)",
  "empresaId": "string (obrigatório, ID da empresa)",
  "role": "admin|user (obrigatório)"
}
```

**Exemplo de Body**:
```json
{
  "uid": "firebase_uid_123",
  "empresaId": "empresa_123",
  "role": "admin"
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Claims setados com sucesso"
  },
  "error": null
}
```

**Resposta de Erro (403)**:
```json
{
  "success": false,
  "data": null,
  "error": "Acesso negado. Apenas administradores podem setar claims."
}
```

**Nota Importante**: Após setar claims, o usuário deve fazer logout/login ou forçar atualização do token:
```javascript
await auth.currentUser?.getIdToken(true);
```

#### 🏢 Empresas

##### GET /api/empresas ou /api/v1/empresas
**Descrição**: Lista empresas
**Autenticação**: Obrigatória
**Comportamento**:
- **Admin**: Pode ver todas as empresas
- **User**: Vê apenas sua própria empresa

**Parâmetros de Query**:
- `ativo`: Filtrar por status ativo (`true`/`false`)
- `limit`: Limite de resultados (número inteiro)

**Exemplo de Requisição**:
```
GET /api/empresas?ativo=true&limit=50
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "empresa_123",
      "nome": "Imobiliária ABC",
      "cnpj": "12.345.678/0001-90",
      "email": "contato@imobiliariabc.com",
      "telefone": "+5511999999999",
      "endereco": {
        "rua": "Rua das Flores, 123",
        "bairro": "Centro",
        "cidade": "São Paulo",
        "estado": "SP",
        "cep": "01234-567"
      },
      "ativo": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "error": null
}
```

##### GET /api/empresas/:id ou /api/v1/empresas/:id
**Descrição**: Obtém detalhes de uma empresa específica
**Autenticação**: Obrigatória
**Restrição**: Usuários só podem ver sua própria empresa, exceto admins

**Parâmetros de Path**:
- `id`: ID da empresa (string obrigatória)

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "id": "empresa_123",
    "nome": "Imobiliária ABC",
    "cnpj": "12.345.678/0001-90",
    "email": "contato@imobiliariabc.com",
    "telefone": "+5511999999999",
    "endereco": {
      "rua": "Rua das Flores, 123",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01234-567"
    },
    "ativo": true,
    "configuracoes": {
      "notificacoes": true,
      "backupAutomatico": true
    },
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  },
  "error": null
}
```

#### 🏠 Propriedades

##### GET /api/properties ou /api/v1/properties
**Descrição**: Lista propriedades da empresa
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

**Parâmetros de Query**:
- `search`: Termo de busca (endereço ou nome do proprietário)
- `limit`: Limite de resultados (padrão: 10)
- `page`: Página para paginação (padrão: 1)

**Exemplo de Requisição**:
```
GET /api/properties?search=centro&limit=20
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "property_123",
      "endereco": "Rua das Palmeiras, 456",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01234-567",
      "tipo": "Apartamento",
      "areaTotal": 120.5,
      "areaConstruida": 95.0,
      "enderecoCompleto": "Rua das Palmeiras, 456, Centro, São Paulo - SP",
      "proprietario": {
        "nome": "Carlos Silva",
        "telefone": "+5511888888888",
        "email": "carlos@email.com",
        "cpf": "123.456.789-00"
      },
      "inquilino": {
        "nome": "Ana Costa",
        "telefone": "+5511777777777",
        "email": "ana@email.com"
      },
      "valorAluguel": 2500.00,
      "valorIptu": 300.00,
      "observacoes": "Apartamento com 3 quartos",
      "ativo": true,
      "empresaId": "empresa_123",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-20T14:15:00Z"
    }
  ],
  "error": null,
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

##### GET /api/properties/:id ou /api/v1/properties/:id
**Descrição**: Obtém detalhes de uma propriedade
**Autenticação**: Obrigatória
**Restrição**: Apenas propriedades da mesma empresa

**Parâmetros de Path**:
- `id`: ID da propriedade (string obrigatória)

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "id": "property_123",
    "endereco": "Rua das Palmeiras, 456",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567",
    "tipo": "Apartamento",
    "areaTotal": 120.5,
    "areaConstruida": 95.0,
    "descricao": "Apartamento moderno com 3 quartos",
    "enderecoCompleto": "Rua das Palmeiras, 456, Centro, São Paulo - SP",
    "proprietario": {
      "nome": "Carlos Silva",
      "telefone": "+5511888888888",
      "email": "carlos@email.com",
      "cpf": "123.456.789-00",
      "rg": "12.345.678-9"
    },
    "inquilino": {
      "nome": "Ana Costa",
      "telefone": "+5511777777777",
      "email": "ana@email.com",
      "cpf": "987.654.321-00"
    },
    "valorAluguel": 2500.00,
    "valorIptu": 300.00,
    "observacoes": "Apartamento com 3 quartos, 2 banheiros, sala, cozinha",
    "ativo": true,
    "empresaId": "empresa_123",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-20T14:15:00Z"
  },
  "error": null
}
```

##### POST /api/properties ou /api/v1/properties
**Descrição**: Cria uma nova propriedade
**Autenticação**: Obrigatória

**Body**:
```json
{
  "endereco": "string (obrigatório, min: 1 caractere)",
  "bairro": "string (obrigatório, min: 1 caractere)",
  "cidade": "string (obrigatório, min: 1 caractere)",
  "estado": "string (obrigatório, min: 1 caractere)",
  "cep": "string (obrigatório, min: 8 caracteres)",
  "tipo": "string (obrigatório, min: 1 caractere)",
  "areaTotal": "number (opcional, positivo)",
  "areaConstruida": "number (opcional, positivo)",
  "descricao": "string (opcional)",
  "enderecoCompleto": "string (opcional)",
  "proprietario": {
    "nome": "string (obrigatório)",
    "telefone": "string (opcional)",
    "email": "string (opcional, formato email)",
    "cpf": "string (opcional)",
    "rg": "string (opcional)"
  },
  "inquilino": {
    "nome": "string (opcional)",
    "telefone": "string (opcional)",
    "email": "string (opcional, formato email)",
    "cpf": "string (opcional)",
    "rg": "string (opcional)"
  },
  "valorAluguel": "number (opcional, positivo)",
  "valorIptu": "number (opcional, positivo)",
  "observacoes": "string (opcional)",
  "ativo": "boolean (opcional, padrão: true)"
}
```

##### PUT /api/properties/:id ou /api/v1/properties/:id
**Descrição**: Atualiza uma propriedade
**Autenticação**: Obrigatória

**Parâmetros de Path**:
- `id`: ID da propriedade (string obrigatória)

**Body** (todos os campos são opcionais, mesma estrutura do POST):
```json
{
  "endereco": "string (opcional)",
  "bairro": "string (opcional)",
  "valorAluguel": "number (opcional)",
  "observacoes": "string (opcional)"
}
```

#### 🔍 Vistorias

##### GET /api/inspections ou /api/v1/inspections
**Descrição**: Lista vistorias da empresa
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

**Parâmetros de Query**:
- `vistoriadorId`: Filtrar por ID do vistoriador
- `status`: Filtrar por status (`Pendente`, `Em Andamento`, `Concluída`, `Cancelada`)
- `limit`: Limite de resultados (padrão: 10)
- `dataInicio`: Data de início (formato ISO 8601)
- `dataFim`: Data de fim (formato ISO 8601)

**Exemplo de Requisição**:
```
GET /api/inspections?status=Pendente&vistoriadorId=vistoriador_123&limit=20
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "inspection_123",
      "empresaId": "empresa_123",
      "vistoriadorId": "vistoriador_123",
      "imovelId": "property_123",
      "tipo": "entrada",
      "status": "Pendente",
      "dataVistoria": "2025-02-01T10:00:00Z",
      "observacoes": "Vistoria de entrada do inquilino",
      "fotos": [
        {
          "url": "https://storage.com/foto1.jpg",
          "descricao": "Sala principal",
          "categoria": "ambiente"
        }
      ],
      "checklists": [
        {
          "categoria": "Elétrica",
          "itens": [
            {
              "item": "Tomadas funcionando",
              "status": "ok",
              "observacao": "Todas funcionando perfeitamente"
            }
          ]
        }
      ],
      "imovel": {
        "endereco": "Rua das Palmeiras, 456",
        "bairro": "Centro",
        "cidade": "São Paulo",
        "estado": "SP",
        "cep": "01234-567",
        "tipo": "Apartamento",
        "proprietario": {
          "nome": "Carlos Silva",
          "telefone": "+5511888888888"
        }
      },
      "createdAt": "2025-01-25T14:30:00Z",
      "updatedAt": "2025-01-25T14:30:00Z"
    }
  ],
  "error": null,
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

##### GET /api/inspections/:id ou /api/v1/inspections/:id
**Descrição**: Obtém detalhes de uma vistoria
**Autenticação**: Obrigatória
**Restrição**: Apenas vistorias da mesma empresa

**Parâmetros de Path**:
- `id`: ID da vistoria (string obrigatória)

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "id": "inspection_123",
    "empresaId": "empresa_123",
    "vistoriadorId": "vistoriador_123",
    "imovelId": "property_123",
    "tipo": "entrada",
    "status": "Concluída",
    "dataVistoria": "2025-02-01T10:00:00Z",
    "observacoes": "Vistoria de entrada realizada com sucesso",
    "fotos": [
      {
        "url": "https://storage.com/foto1.jpg",
        "descricao": "Sala principal",
        "categoria": "ambiente"
      },
      {
        "url": "https://storage.com/foto2.jpg",
        "descricao": "Cozinha",
        "categoria": "ambiente"
      }
    ],
    "checklists": [
      {
        "categoria": "Elétrica",
        "itens": [
          {
            "item": "Tomadas funcionando",
            "status": "ok",
            "observacao": "Todas funcionando perfeitamente"
          },
          {
            "item": "Interruptores",
            "status": "problema",
            "observacao": "Interruptor da sala com defeito"
          }
        ]
      },
      {
        "categoria": "Hidráulica",
        "itens": [
          {
            "item": "Torneiras",
            "status": "ok",
            "observacao": "Funcionando normalmente"
          }
        ]
      }
    ],
    "imovel": {
      "endereco": "Rua das Palmeiras, 456",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01234-567",
      "tipo": "Apartamento",
      "areaTotal": 120.5,
      "areaConstruida": 95.0,
      "proprietario": {
        "nome": "Carlos Silva",
        "telefone": "+5511888888888",
        "email": "carlos@email.com"
      },
      "inquilino": {
        "nome": "Ana Costa",
        "telefone": "+5511777777777",
        "email": "ana@email.com"
      }
    },
    "createdAt": "2025-01-25T14:30:00Z",
    "updatedAt": "2025-02-01T11:45:00Z"
  },
  "error": null
}
```

##### POST /api/inspections ou /api/v1/inspections
**Descrição**: Cria uma nova vistoria
**Autenticação**: Obrigatória

**Body**:
```json
{
  "empresaId": "string (obrigatório)",
  "vistoriadorId": "string (obrigatório)",
  "imovelId": "string (obrigatório)",
  "tipo": "string (obrigatório - entrada|saida|manutencao)",
  "status": "string (opcional - Pendente|Em Andamento|Concluída|Cancelada)",
  "dataVistoria": "string (opcional, formato ISO 8601)",
  "observacoes": "string (opcional)",
  "fotos": [
    {
      "url": "string (URL da foto)",
      "descricao": "string (opcional)",
      "categoria": "string (opcional)"
    }
  ],
  "checklists": [
    {
      "categoria": "string (ex: Elétrica, Hidráulica)",
      "itens": [
        {
          "item": "string (descrição do item)",
          "status": "string (ok|problema|nao_aplicavel)",
          "observacao": "string (opcional)"
        }
      ]
    }
  ],
  "imovel": {
    "endereco": "string",
    "bairro": "string",
    "cidade": "string",
    "estado": "string",
    "cep": "string",
    "tipo": "string",
    "areaTotal": "number (opcional)",
    "areaConstruida": "number (opcional)",
    "proprietario": {
      "nome": "string",
      "telefone": "string (opcional)",
      "email": "string (opcional)"
    },
    "inquilino": {
      "nome": "string",
      "telefone": "string (opcional)",
      "email": "string (opcional)"
    }
  }
}
```

##### PUT /api/inspections/:id ou /api/v1/inspections/:id
**Descrição**: Atualiza uma vistoria
**Autenticação**: Obrigatória

**Parâmetros de Path**:
- `id`: ID da vistoria (string obrigatória)

**Body** (todos os campos são opcionais, mesma estrutura do POST):
```json
{
  "status": "Concluída",
  "observacoes": "Vistoria finalizada com sucesso",
  "fotos": [
    {
      "url": "https://storage.com/nova_foto.jpg",
      "descricao": "Foto adicional",
      "categoria": "problema"
    }
  ]
}
```

##### POST /api/inspections/:id/contest ou /api/v1/inspections/:id/contest
**Descrição**: Cria uma contestação para uma vistoria
**Autenticação**: Obrigatória

**Parâmetros de Path**:
- `id`: ID da vistoria (string obrigatória)

**Body**:
```json
{
  "empresaId": "string (obrigatório)",
  "inspectionId": "string (obrigatório)",
  "motivo": "string (obrigatório)",
  "detalhes": "string (opcional)",
  "clienteId": "string (opcional)",
  "evidencias": [
    {
      "tipo": "foto|documento",
      "url": "string (URL da evidência)"
    }
  ]
}
```

#### 📊 Dashboard

##### GET /api/dashboard ou /api/v1/dashboard
**Descrição**: Obtém estatísticas do dashboard
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

**Parâmetros de Query**:
- `vistoriadorId`: Filtrar estatísticas por vistoriador específico

**Exemplo de Requisição**:
```
GET /api/dashboard?vistoriadorId=vistoriador_123
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "totalInspections": 150,
    "pendingInspections": 25,
    "completedInspections": 100,
    "inProgressInspections": 15,
    "cancelledInspections": 10,
    "totalProperties": 75,
    "totalUsers": 12,
    "recentInspections": [
      {
        "id": "inspection_123",
        "tipo": "entrada",
        "status": "Pendente",
        "dataVistoria": "2025-02-01T10:00:00Z",
        "imovel": {
          "endereco": "Rua das Palmeiras, 456"
        },
        "vistoriador": {
          "nome": "João Silva"
        }
      }
    ],
    "monthlyStats": {
      "janeiro": 45,
      "fevereiro": 38,
      "marco": 42
    }
  },
  "error": null
}
```

##### GET /api/dashboard/stats ou /api/v1/dashboard/stats
**Descrição**: Obtém estatísticas detalhadas
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

**Parâmetros de Query**:
- `vistoriadorId`: Filtrar estatísticas por vistoriador específico
- `periodo`: Período para análise (`mes`, `trimestre`, `ano`)
- `dataInicio`: Data de início para filtro personalizado (formato ISO 8601)
- `dataFim`: Data de fim para filtro personalizado (formato ISO 8601)

**Exemplo de Requisição**:
```
GET /api/dashboard/stats?periodo=mes&vistoriadorId=vistoriador_123
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "total": 150,
      "pendentes": 25,
      "concluidas": 100,
      "emAndamento": 15,
      "canceladas": 10
    },
    "porTipo": {
      "entrada": 80,
      "saida": 60,
      "manutencao": 10
    },
    "porVistoriador": [
      {
        "vistoriadorId": "vistoriador_123",
        "nome": "João Silva",
        "total": 45,
        "concluidas": 40,
        "pendentes": 5
      }
    ],
    "tendencias": {
      "ultimosMeses": [
        {
          "mes": "2025-01",
          "total": 42,
          "concluidas": 38
        },
        {
          "mes": "2025-02",
          "total": 35,
          "concluidas": 30
        }
      ]
    },
    "tempoMedio": {
      "conclusao": "2.5 dias",
      "porTipo": {
        "entrada": "2.1 dias",
        "saida": "2.8 dias",
        "manutencao": "3.2 dias"
      }
    }
  },
  "error": null
}
```

#### 📈 Relatórios

##### GET /api/reports ou /api/v1/reports
**Descrição**: Gera relatórios da empresa
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

#### 📤 Exportações

##### GET /api/exports ou /api/v1/exports
**Descrição**: Lista exportações da empresa
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

##### POST /api/exports ou /api/v1/exports
**Descrição**: Cria uma nova exportação
**Autenticação**: Obrigatória

#### 🔔 Notificações

##### GET /api/notifications ou /api/v1/notifications
**Descrição**: Lista notificações do usuário
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

**Parâmetros de Query**:
- `page`: Número da página (padrão: 1)
- `limit`: Limite de resultados por página (padrão: 20, máximo: 100)
- `read`: Filtrar por status de leitura (boolean - true/false)
- `type`: Filtrar por tipo (`inspection`, `contestation`, `system`, `reminder`)

**Exemplo de Requisição**:
```
GET /api/v1/notifications?page=1&limit=10&read=false&type=inspection
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "notification_123",
      "userId": "user_123",
      "empresaId": "empresa_123",
      "type": "inspection",
      "title": "Nova vistoria atribuída",
      "message": "Uma nova vistoria foi atribuída para você: Rua das Palmeiras, 456",
      "read": false,
      "data": {
        "inspectionId": "inspection_123",
        "propertyAddress": "Rua das Palmeiras, 456",
        "dueDate": "2025-02-01T10:00:00Z"
      },
      "createdAt": "2025-01-25T14:30:00Z",
      "readAt": null
    },
    {
      "id": "notification_124",
      "userId": "user_123",
      "empresaId": "empresa_123",
      "type": "contestation",
      "title": "Contestação recebida",
      "message": "Uma contestação foi registrada para a vistoria #inspection_122",
      "read": true,
      "data": {
        "contestationId": "contestation_456",
        "inspectionId": "inspection_122"
      },
      "createdAt": "2025-01-24T09:15:00Z",
      "readAt": "2025-01-24T10:30:00Z"
    }
  ],
  "error": null,
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "summary": {
    "totalUnread": 8,
    "totalRead": 17
  }
}
```

##### PUT /api/v1/notifications/:id/read
**Descrição**: Marca notificação como lida
**Autenticação**: Obrigatória

**Parâmetros de Path**:
- `id`: ID da notificação (string obrigatória)

**Body** (opcional):
```json
{
  "read": true
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "id": "notification_123",
    "read": true,
    "readAt": "2025-01-25T15:45:00Z"
  },
  "error": null
}
```

##### PUT /api/v1/notifications/read-all
**Descrição**: Marca todas as notificações como lidas
**Autenticação**: Obrigatória

**Body** (opcional):
```json
{
  "type": "inspection"
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "updatedCount": 8,
    "message": "Todas as notificações foram marcadas como lidas"
  },
  "error": null
}
```

##### POST /api/v1/notifications
**Descrição**: Cria uma nova notificação (uso interno/admin)
**Autenticação**: Obrigatória
**Permissão**: Admin ou sistema

**Body**:
```json
{
  "userId": "string (obrigatório)",
  "empresaId": "string (obrigatório)",
  "type": "string (obrigatório - inspection|contestation|system|reminder)",
  "title": "string (obrigatório)",
  "message": "string (obrigatório)",
  "data": {
    "inspectionId": "string (opcional)",
    "contestationId": "string (opcional)",
    "propertyId": "string (opcional)",
    "customData": "object (opcional)"
  }
}
```

#### 📁 Uploads

##### POST /api/v1/uploads/images
**Descrição**: Upload de imagens
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

**Especificações**:
- **Tipos permitidos**: JPEG, PNG, GIF, WebP
- **Tamanho máximo**: 5MB por arquivo
- **Quantidade máxima**: 10 arquivos por requisição
- **Content-Type**: `multipart/form-data`

**Parâmetros**:
- `files`: Array de arquivos de imagem (obrigatório)
- `categoria`: Categoria da imagem (opcional - ambiente, problema, evidencia)
- `descricao`: Descrição da imagem (opcional)

**Exemplo de Requisição**:
```bash
curl -X POST \
  https://grifo-api.onrender.com/api/v1/uploads/images \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: multipart/form-data' \
  -F 'files=@image1.jpg' \
  -F 'files=@image2.png' \
  -F 'categoria=ambiente' \
  -F 'descricao=Fotos da sala principal'
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "uploadedFiles": [
      {
        "originalName": "image1.jpg",
        "filename": "1643723400000-image1.jpg",
        "url": "https://firebasestorage.googleapis.com/v0/b/grifo-vistorias.appspot.com/o/uploads%2Fimages%2F1643723400000-image1.jpg",
        "size": 2048576,
        "mimetype": "image/jpeg",
        "categoria": "ambiente",
        "uploadedAt": "2025-01-25T14:30:00Z"
      },
      {
        "originalName": "image2.png",
        "filename": "1643723400001-image2.png",
        "url": "https://firebasestorage.googleapis.com/v0/b/grifo-vistorias.appspot.com/o/uploads%2Fimages%2F1643723400001-image2.png",
        "size": 1536000,
        "mimetype": "image/png",
        "categoria": "ambiente",
        "uploadedAt": "2025-01-25T14:30:01Z"
      }
    ],
    "totalUploaded": 2,
    "totalSize": 3584576
  },
  "error": null
}
```

##### POST /api/v1/uploads/documents
**Descrição**: Upload de documentos
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

**Especificações**:
- **Tipos permitidos**: PDF, DOC, DOCX, XLS, XLSX, TXT
- **Tamanho máximo**: 10MB por arquivo
- **Quantidade máxima**: 5 arquivos por requisição
- **Content-Type**: `multipart/form-data`

**Parâmetros**:
- `files`: Array de arquivos de documento (obrigatório)
- `tipo`: Tipo do documento (opcional - contrato, laudo, evidencia, outros)
- `descricao`: Descrição do documento (opcional)

**Exemplo de Requisição**:
```bash
curl -X POST \
  https://grifo-api.onrender.com/api/v1/uploads/documents \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: multipart/form-data' \
  -F 'files=@contrato.pdf' \
  -F 'files=@laudo.docx' \
  -F 'tipo=contrato' \
  -F 'descricao=Documentos da vistoria'
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "uploadedFiles": [
      {
        "originalName": "contrato.pdf",
        "filename": "1643723400000-contrato.pdf",
        "url": "https://storage.com/uploads/documents/1643723400000-contrato.pdf",
        "size": 5242880,
        "mimetype": "application/pdf",
        "tipo": "contrato",
        "uploadedAt": "2025-01-25T14:30:00Z"
      },
      {
        "originalName": "laudo.docx",
        "filename": "1643723400001-laudo.docx",
        "url": "https://storage.com/uploads/documents/1643723400001-laudo.docx",
        "size": 3145728,
        "mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "tipo": "contrato",
        "uploadedAt": "2025-01-25T14:30:01Z"
      }
    ],
    "totalUploaded": 2,
    "totalSize": 8388608
  },
  "error": null
}
```

##### DELETE /api/v1/uploads/files
**Descrição**: Deleta arquivos do storage
**Autenticação**: Obrigatória

**Body**:
```json
{
  "files": [
    {
      "filename": "string (nome do arquivo no storage)",
      "url": "string (URL completa do arquivo)"
    }
  ]
}
```

**Exemplo de Requisição**:
```json
{
  "files": [
    {
      "filename": "1643723400000-image1.jpg",
      "url": "https://storage.com/uploads/images/1643723400000-image1.jpg"
    },
    {
      "filename": "1643723400000-contrato.pdf",
      "url": "https://storage.com/uploads/documents/1643723400000-contrato.pdf"
    }
  ]
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "deletedFiles": [
      {
        "filename": "1643723400000-image1.jpg",
        "status": "deleted"
      },
      {
        "filename": "1643723400000-contrato.pdf",
        "status": "deleted"
      }
    ],
    "totalDeleted": 2
  },
  "error": null
}
```

##### POST /api/uploads ou /api/v1/uploads
**Descrição**: Faz upload de arquivos (endpoint genérico)
**Autenticação**: Obrigatória

#### ⚖️ Contestações

##### GET /api/contestations ou /api/v1/contestations
**Descrição**: Lista contestações da empresa
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

#### 🔄 Sincronização

##### POST /api/sync ou /api/v1/sync
**Descrição**: Sincroniza dados pendentes do dispositivo móvel
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

**Body**:
```json
{
  "pendingInspections": [
    {
      "localId": "string (ID local temporário)",
      "empresaId": "string (obrigatório)",
      "vistoriadorId": "string (obrigatório)",
      "imovelId": "string (obrigatório)",
      "tipo": "string (entrada|saida|manutencao)",
      "status": "string",
      "dataVistoria": "string (ISO 8601)",
      "observacoes": "string",
      "fotos": [
        {
          "localPath": "string (caminho local)",
          "base64": "string (dados da imagem em base64)",
          "descricao": "string",
          "categoria": "string"
        }
      ],
      "checklists": [
        {
          "categoria": "string",
          "itens": [
            {
              "item": "string",
              "status": "string",
              "observacao": "string"
            }
          ]
        }
      ],
      "lastModified": "string (ISO 8601)"
    }
  ],
  "deviceInfo": {
    "deviceId": "string",
    "platform": "string (ios|android)",
    "appVersion": "string",
    "syncTimestamp": "string (ISO 8601)"
  }
}
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "syncedInspections": [
      {
        "localId": "local_123",
        "serverId": "inspection_456",
        "status": "synced",
        "uploadedPhotos": [
          {
            "localPath": "/local/photo1.jpg",
            "serverUrl": "https://storage.com/uploads/photo1.jpg"
          }
        ]
      }
    ],
    "failedInspections": [
      {
        "localId": "local_124",
        "error": "Validation failed: missing required field 'imovelId'",
        "retryable": true
      }
    ],
    "serverUpdates": [
      {
        "id": "inspection_789",
        "status": "Concluída",
        "lastModified": "2025-01-25T16:00:00Z",
        "action": "update"
      }
    ],
    "syncSummary": {
      "totalProcessed": 2,
      "successful": 1,
      "failed": 1,
      "serverUpdatesAvailable": 1
    }
  },
  "error": null
}
```

##### GET /api/v1/sync/status
**Descrição**: Verifica status de sincronização e atualizações disponíveis
**Autenticação**: Obrigatória

**Parâmetros de Query**:
- `lastSync`: Timestamp da última sincronização (ISO 8601)
- `deviceId`: ID do dispositivo para rastreamento

**Exemplo de Requisição**:
```
GET /api/v1/sync/status?lastSync=2025-01-25T10:00:00Z&deviceId=device_123
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "hasUpdates": true,
    "lastServerUpdate": "2025-01-25T16:30:00Z",
    "pendingUpdates": {
      "inspections": 3,
      "properties": 1,
      "users": 0,
      "notifications": 5
    },
    "syncRequired": true,
    "serverTime": "2025-01-25T17:00:00Z",
    "appVersion": {
      "current": "1.2.0",
      "minimum": "1.1.0",
      "latest": "1.2.1",
      "updateRequired": false
    }
  },
  "error": null
}
```

##### GET /api/v1/sync/delta
**Descrição**: Obtém mudanças incrementais desde a última sincronização
**Autenticação**: Obrigatória

**Parâmetros de Query**:
- `since`: Timestamp desde quando buscar mudanças (ISO 8601, obrigatório)
- `types`: Tipos de dados para sincronizar (opcional - inspections,properties,users,notifications)

**Exemplo de Requisição**:
```
GET /api/v1/sync/delta?since=2025-01-25T10:00:00Z&types=inspections,notifications
```

**Resposta de Sucesso (200)**:
```json
{
  "success": true,
  "data": {
    "inspections": {
      "created": [
        {
          "id": "inspection_789",
          "empresaId": "empresa_123",
          "vistoriadorId": "vistoriador_123",
          "status": "Pendente",
          "createdAt": "2025-01-25T15:30:00Z"
        }
      ],
      "updated": [
        {
          "id": "inspection_456",
          "status": "Concluída",
          "updatedAt": "2025-01-25T16:00:00Z"
        }
      ],
      "deleted": [
        {
          "id": "inspection_123",
          "deletedAt": "2025-01-25T14:00:00Z"
        }
      ]
    },
    "notifications": {
      "created": [
        {
          "id": "notification_789",
          "type": "inspection",
          "title": "Nova vistoria",
          "createdAt": "2025-01-25T16:30:00Z"
        }
      ],
      "updated": [],
      "deleted": []
    },
    "syncTimestamp": "2025-01-25T17:00:00Z"
  },
  "error": null
}
```

## 📋 Códigos de Resposta e Erros

### Códigos de Status HTTP

| Código | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 400 | Bad Request | Dados inválidos ou malformados |
| 401 | Unauthorized | Token de autenticação inválido ou ausente |
| 403 | Forbidden | Usuário não tem permissão para acessar o recurso |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito de dados (ex: email já existe) |
| 422 | Unprocessable Entity | Dados válidos mas não processáveis |
| 429 | Too Many Requests | Limite de rate limiting excedido |
| 500 | Internal Server Error | Erro interno do servidor |
| 503 | Service Unavailable | Serviço temporariamente indisponível |

### Estrutura de Resposta de Erro

Todas as respostas de erro seguem o padrão:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem de erro legível",
    "details": {
      "field": "Campo específico com erro",
      "value": "Valor que causou o erro",
      "expected": "Valor esperado"
    },
    "timestamp": "2025-01-25T17:00:00Z",
    "path": "/api/endpoint",
    "requestId": "req_123456789"
  }
}
```

### Códigos de Erro Específicos

#### Autenticação (AUTH_*)
- `AUTH_TOKEN_MISSING`: Token de autenticação não fornecido
- `AUTH_TOKEN_INVALID`: Token inválido ou expirado
- `AUTH_TOKEN_EXPIRED`: Token expirado
- `AUTH_INSUFFICIENT_PERMISSIONS`: Permissões insuficientes
- `AUTH_COMPANY_MISMATCH`: Usuário não pertence à empresa

#### Validação (VALIDATION_*)
- `VALIDATION_REQUIRED_FIELD`: Campo obrigatório ausente
- `VALIDATION_INVALID_FORMAT`: Formato inválido (email, telefone, etc.)
- `VALIDATION_INVALID_TYPE`: Tipo de dado inválido
- `VALIDATION_OUT_OF_RANGE`: Valor fora do intervalo permitido
- `VALIDATION_FILE_TOO_LARGE`: Arquivo excede tamanho máximo
- `VALIDATION_INVALID_FILE_TYPE`: Tipo de arquivo não permitido

#### Recursos (RESOURCE_*)
- `RESOURCE_NOT_FOUND`: Recurso não encontrado
- `RESOURCE_ALREADY_EXISTS`: Recurso já existe
- `RESOURCE_CONFLICT`: Conflito de estado do recurso
- `RESOURCE_DELETED`: Recurso foi deletado

#### Negócio (BUSINESS_*)
- `BUSINESS_INSPECTION_ALREADY_COMPLETED`: Vistoria já foi concluída
- `BUSINESS_INVALID_STATUS_TRANSITION`: Transição de status inválida
- `BUSINESS_PROPERTY_IN_USE`: Imóvel está sendo usado em vistoria ativa
- `BUSINESS_USER_INACTIVE`: Usuário está inativo

#### Sistema (SYSTEM_*)
- `SYSTEM_DATABASE_ERROR`: Erro de banco de dados
- `SYSTEM_EXTERNAL_SERVICE_ERROR`: Erro em serviço externo
- `SYSTEM_RATE_LIMIT_EXCEEDED`: Limite de requisições excedido
- `SYSTEM_MAINTENANCE`: Sistema em manutenção

### Exemplos de Respostas de Erro

#### Erro de Validação (400)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_REQUIRED_FIELD",
    "message": "O campo 'empresaId' é obrigatório",
    "details": {
      "field": "empresaId",
      "expected": "string",
      "received": "undefined"
    },
    "timestamp": "2025-01-25T17:00:00Z",
    "path": "/api/inspections",
    "requestId": "req_123456789"
  }
}
```

#### Erro de Autenticação (401)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AUTH_TOKEN_EXPIRED",
    "message": "Token de autenticação expirado",
    "details": {
      "expiredAt": "2025-01-25T16:00:00Z",
      "currentTime": "2025-01-25T17:00:00Z"
    },
    "timestamp": "2025-01-25T17:00:00Z",
    "path": "/api/inspections",
    "requestId": "req_123456789"
  }
}
```

#### Erro de Permissão (403)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "AUTH_INSUFFICIENT_PERMISSIONS",
    "message": "Usuário não tem permissão para acessar este recurso",
    "details": {
      "requiredRole": "admin",
      "userRole": "vistoriador",
      "resource": "companies"
    },
    "timestamp": "2025-01-25T17:00:00Z",
    "path": "/api/empresas",
    "requestId": "req_123456789"
  }
}
```

#### Erro de Recurso Não Encontrado (404)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Vistoria não encontrada",
    "details": {
      "resourceType": "inspection",
      "resourceId": "inspection_123",
      "empresaId": "empresa_456"
    },
    "timestamp": "2025-01-25T17:00:00Z",
    "path": "/api/inspections/inspection_123",
    "requestId": "req_123456789"
  }
}
```

## 🔒 Segurança e Isolamento de Dados

### Isolamento por Empresa
Todos os endpoints protegidos implementam isolamento de dados por empresa:

1. **Extração do empresaId**: Do token Firebase do usuário autenticado
2. **Filtro Automático**: Todas as consultas incluem `.where('empresaId', '==', empresaId)`
3. **Validação de Acesso**: Verificação se o usuário tem acesso aos dados solicitados

### Middleware de Segurança
- **CORS**: Configurado para origens específicas
- **Helmet**: Headers de segurança HTTP
- **Rate Limiting**: 100 requisições por 15 minutos por IP
- **Sanitização**: Limpeza de inputs maliciosos
- **Validação**: Schemas Zod para validação de entrada

### Logs de Auditoria
Todas as operações são logadas com:
- ID do usuário
- Empresa do usuário
- Ação realizada
- Timestamp
- IP de origem

## 🔧 Configuração de Custom Claims

### Como Setar Claims
1. **Autenticação**: Admin deve estar autenticado
2. **Endpoint**: POST `/api/users/set-claims`
3. **Payload**: UID do usuário, empresaId e role
4. **Validação**: Admin só pode setar claims para sua empresa

### Após Setar Claims
O usuário deve:
1. Fazer logout/login novamente, OU
2. Forçar atualização do token:
```javascript
await auth.currentUser?.getIdToken(true);
```

## 📱 Compatibilidade

### Mobile (Aplicativo)
- **Endpoints**: `/api/*` (legacy)
- **Autenticação**: Firebase Auth Token
- **Formato**: JSON

### Portal Web
- **Endpoints**: `/api/v1/*` (versionados)
- **Autenticação**: Firebase Auth Token
- **Formato**: JSON
- **Versionamento**: Suporte a múltiplas versões

## 🚀 Deploy e Monitoramento

### Plataforma
- **Hosting**: Render.com
- **Deploy**: Automático via Git (branch main)
- **Environment**: Production
- **Node.js**: v22.16.0

### Monitoramento
- **Health Check**: `/api/health`
- **Logs**: Winston (estruturados)
- **Métricas**: Uptime, memória, performance
- **Alertas**: Via logs de erro

## 🔍 Testes

### Script de Teste
Use o arquivo `test_api_production.js` para testar todos os endpoints:

```bash
node test_api_production.js
```

### Resultados Esperados
- **Health Check**: 200 OK
- **API Root**: 200 OK
- **Endpoints Protegidos**: 401 Unauthorized (sem token)
- **Documentação**: Acessível via Swagger UI

## 💡 Exemplos de Uso e Melhores Práticas

### Fluxo Completo de Vistoria

#### 1. Autenticação
```bash
# Login do vistoriador
curl -X POST https://grifo-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseToken": "eyJhbGciOiJSUzI1NiIs...",
    "empresaId": "empresa_123"
  }'
```

#### 2. Listar Vistorias Pendentes
```bash
# Buscar vistorias pendentes do vistoriador
curl -X GET "https://grifo-api.onrender.com/api/inspections?status=Pendente&vistoriadorId=vistoriador_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Iniciar Vistoria
```bash
# Atualizar status para "Em Andamento"
curl -X PUT https://grifo-api.onrender.com/api/inspections/inspection_123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Em Andamento"
  }'
```

#### 4. Upload de Fotos
```bash
# Upload de imagens da vistoria
curl -X POST https://grifo-api.onrender.com/api/v1/uploads/images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@sala.jpg" \
  -F "files=@cozinha.jpg" \
  -F "categoria=ambiente"
```

#### 5. Finalizar Vistoria
```bash
# Atualizar com dados completos e finalizar
curl -X PUT https://grifo-api.onrender.com/api/inspections/inspection_123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Concluída",
    "observacoes": "Vistoria realizada com sucesso",
    "fotos": [
      {
        "url": "https://firebasestorage.googleapis.com/v0/b/grifo-vistorias.appspot.com/o/uploads%2Fsala.jpg",
        "descricao": "Sala principal",
        "categoria": "ambiente"
      }
    ],
    "checklists": [
      {
        "categoria": "Elétrica",
        "itens": [
          {
            "item": "Tomadas funcionando",
            "status": "ok",
            "observacao": "Todas funcionando"
          }
        ]
      }
    ]
  }'
```

### Sincronização Offline (Mobile)

#### 1. Verificar Status de Sincronização
```bash
curl -X GET "https://grifo-api.onrender.com/api/v1/sync/status?lastSync=2025-01-25T10:00:00Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Sincronizar Dados Pendentes
```bash
curl -X POST https://grifo-api.onrender.com/api/v1/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pendingInspections": [
      {
        "localId": "local_123",
        "empresaId": "empresa_123",
        "vistoriadorId": "vistoriador_123",
        "imovelId": "property_123",
        "tipo": "entrada",
        "status": "Concluída",
        "fotos": [
          {
            "base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
            "descricao": "Foto offline"
          }
        ]
      }
    ],
    "deviceInfo": {
      "deviceId": "device_123",
      "platform": "android",
      "appVersion": "1.2.0"
    }
  }'
```

### Melhores Práticas

#### Autenticação
- **Sempre inclua o token JWT** no header `Authorization: Bearer TOKEN`
- **Renove tokens expirados** usando o endpoint `/api/auth/refresh`
- **Armazene tokens de forma segura** no dispositivo móvel

#### Paginação
- **Use paginação** para listas grandes: `?page=1&limit=20`
- **Limite máximo recomendado**: 100 itens por página
- **Monitore o campo `pagination`** na resposta

#### Upload de Arquivos
- **Comprima imagens** antes do upload para reduzir tempo
- **Use upload em lote** quando possível (até 10 imagens)
- **Valide tipos de arquivo** no cliente antes do upload
- **Implemente retry** para uploads que falharam

#### Tratamento de Erros
- **Sempre verifique o campo `success`** na resposta
- **Implemente retry** para erros 5xx
- **Trate erros 4xx** corrigindo os dados
- **Monitore rate limiting** (429) e implemente backoff

#### Sincronização Offline
- **Verifique conectividade** antes de sincronizar
- **Use sincronização incremental** com timestamps
- **Armazene dados localmente** para funcionamento offline
- **Implemente conflito de resolução** para dados modificados

#### Performance
- **Use filtros específicos** para reduzir payload
- **Cache dados frequentemente acessados**
- **Implemente lazy loading** para listas grandes
- **Monitore tamanho das respostas**

### Códigos de Exemplo (JavaScript)

#### Cliente API Básico
```javascript
class GrifoAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(method, endpoint, data = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data;
  }

  // Métodos específicos
  async getInspections(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request('GET', `/api/inspections?${params}`);
  }

  async updateInspection(id, data) {
    return this.request('PUT', `/api/inspections/${id}`, data);
  }

  async uploadImages(files, metadata = {}) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });

    const response = await fetch(`${this.baseURL}/api/v1/uploads/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    return response.json();
  }
}

// Uso
const api = new GrifoAPI('https://grifo-api.onrender.com', 'your-jwt-token');

// Listar vistorias pendentes
const pendingInspections = await api.getInspections({ 
  status: 'Pendente', 
  limit: 10 
});

// Atualizar vistoria
await api.updateInspection('inspection_123', {
  status: 'Concluída',
  observacoes: 'Finalizada com sucesso'
});
```

## 🔥 Configuração do Firebase

### Informações do Projeto Firebase

**Projeto**: `grifo-vistorias`
**URL do Console**: https://console.firebase.google.com/project/grifo-vistorias

### Serviços Utilizados

#### 1. Firebase Authentication
- **Provedores habilitados**:
  - Email/Password
  - Google Sign-In
  - Telefone (SMS)
- **Domínios autorizados**:
  - `grifovistorias.com`
  - `app.grifovistorias.com`
  - `portal.grifovistorias.com`
  - `localhost` (apenas desenvolvimento)

#### 2. Cloud Firestore
- **Modo**: Produção
- **Região**: `us-central1`
- **Regras de Segurança**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regra para empresas - apenas usuários da própria empresa
    match /empresas/{empresaId} {
      allow read, write: if request.auth != null && 
        request.auth.token.empresaId == empresaId;
    }
    
    // Regra para usuários - apenas o próprio usuário ou admin da empresa
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || 
         request.auth.token.role == 'admin');
    }
    
    // Regra para propriedades - filtradas por empresa
    match /propriedades/{propertyId} {
      allow read, write: if request.auth != null && 
        request.auth.token.empresaId == resource.data.empresaId;
    }
    
    // Regra para vistorias - filtradas por empresa
    match /vistorias/{inspectionId} {
      allow read, write: if request.auth != null && 
        request.auth.token.empresaId == resource.data.empresaId;
    }
  }
}
```

#### 3. Cloud Storage
- **Bucket**: `grifo-vistorias.appspot.com`
- **Regras de Segurança**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Uploads organizados por empresa
    match /uploads/{empresaId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.empresaId == empresaId;
    }
    
    // Imagens públicas (logos, etc.)
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
  }
}
```

#### 4. Cloud Functions
- **Região**: `us-central1`
- **Funções Implementadas**:
  - `setCustomClaims`: Define claims personalizados após registro
  - `processImageUpload`: Processa e otimiza imagens enviadas
  - `sendNotification`: Envia notificações push
  - `generateReport`: Gera relatórios em PDF

### Configuração de Custom Claims

O sistema utiliza custom claims para controle de acesso:

```javascript
// Exemplo de custom claims
{
  "empresaId": "empresa_123",
  "role": "vistoriador",
  "permissions": ["read:inspections", "write:inspections"],
  "isActive": true
}
```

### Variáveis de Ambiente Necessárias

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=grifo-vistorias
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@grifo-vistorias.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXXX\n-----END PRIVATE KEY-----\n"

# Firebase Storage
FIREBASE_STORAGE_BUCKET=grifo-vistorias.appspot.com

# Firebase Auth
FIREBASE_AUTH_DOMAIN=grifo-vistorias.firebaseapp.com
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Configuração do Cliente (Frontend)

#### Web/React
```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "grifo-vistorias.firebaseapp.com",
  projectId: "grifo-vistorias",
  storageBucket: "grifo-vistorias.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

#### Android
```json
// google-services.json (colocar em app/)
{
  "project_info": {
    "project_number": "123456789012",
    "project_id": "grifo-vistorias",
    "storage_bucket": "grifo-vistorias.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:123456789012:android:abcdef123456789012",
        "android_client_info": {
          "package_name": "com.grifo.vistorias"
        }
      }
    }
  ]
}
```

#### iOS
```plist
<!-- GoogleService-Info.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>PROJECT_ID</key>
	<string>grifo-vistorias</string>
	<key>STORAGE_BUCKET</key>
	<string>grifo-vistorias.appspot.com</string>
	<key>API_KEY</key>
	<string>AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</string>
	<key>BUNDLE_ID</key>
	<string>com.grifo.vistorias</string>
</dict>
</plist>
```

### Estrutura do Banco de Dados

#### Coleções Principais

```
📁 empresas/
  📄 {empresaId}
    - nome: string
    - cnpj: string
    - email: string
    - telefone: string
    - endereco: object
    - plano: string
    - ativo: boolean
    - criadoEm: timestamp

📁 usuarios/
  📄 {userId}
    - email: string
    - nome: string
    - role: string
    - empresaId: string
    - telefone: string
    - ativo: boolean
    - ultimoLogin: timestamp

📁 propriedades/
  📄 {propertyId}
    - empresaId: string
    - endereco: object
    - tipo: string
    - proprietario: object
    - caracteristicas: object
    - criadoEm: timestamp

📁 vistorias/
  📄 {inspectionId}
    - empresaId: string
    - propriedadeId: string
    - vistoriadorId: string
    - tipo: string
    - status: string
    - dataVistoria: timestamp
    - observacoes: string
    - fotos: array
    - checklists: array
    - criadoEm: timestamp
```

### Monitoramento e Logs

- **Firebase Console**: https://console.firebase.google.com/project/grifo-vistorias
- **Logs de Autenticação**: Firebase Console > Authentication > Users
- **Logs do Firestore**: Firebase Console > Firestore Database
- **Logs do Storage**: Firebase Console > Storage
- **Métricas de Uso**: Firebase Console > Analytics

### Backup e Recuperação

- **Backup automático**: Configurado via Firebase Console
- **Exportação de dados**: `gcloud firestore export gs://grifo-vistorias-backup`
- **Importação de dados**: `gcloud firestore import gs://grifo-vistorias-backup/[EXPORT_PREFIX]`

## 📞 Suporte

Para suporte técnico ou dúvidas sobre a API:
- **Documentação Interativa**: https://grifo-api.onrender.com/api-docs
- **Health Check**: https://grifo-api.onrender.com/api/health
- **Logs**: Disponíveis no dashboard do Render
- **Firebase Console**: https://console.firebase.google.com/project/grifo-vistorias

---

**Última atualização**: 31/07/2025
**Versão da API**: 1.0.0
**Status**: ✅ Produção Ativa