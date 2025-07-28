# Documentação de Rotas da API Grifo - Portal

Esta documentação detalha todas as rotas disponíveis na API Grifo para integração com o portal web.

## Base URL
- **Produção**: `https://grifo-api.onrender.com`
- **Desenvolvimento**: `http://localhost:3006`

## Autenticação

Todas as rotas protegidas requerem autenticação via Firebase Auth Token:

```
Authorization: Bearer <firebase_auth_token>
```

## Estrutura de Versionamento

- **Portal Web**: Use endpoints `/api/v1/*` (versionados)
- **App Mobile**: Usa endpoints `/api/*` (legacy)

## Rotas Públicas

### Health Check

#### `GET /api/health`
Verifica o status da API.

**Resposta:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": "3600 segundos",
  "services": {
    "firebase": "connected",
    "database": "available"
  },
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB"
  }
}
```

#### `GET /`
Informações gerais da API e endpoints disponíveis.

**Resposta:**
```json
{
  "message": "Grifo API Backend",
  "version": "1.0.0",
  "environment": "production",
  "endpoints": {
    "public": ["/api/health"],
    "legacy": ["/api/dashboard", "/api/inspections", ...],
    "v1": ["/api/v1/dashboard", "/api/v1/inspections", ...]
  },
  "authentication": {
    "required": "Firebase Auth Token",
    "header": "Authorization: Bearer <token>"
  },
  "documentation": "/api-docs"
}
```

#### `GET /api-docs`
Documentação interativa Swagger da API.

## Rotas Protegidas (Portal)

### Dashboard

#### `GET /api/v1/dashboard`
Obtém estatísticas gerais do dashboard.

**Query Parameters:**
- `vistoriadorId` (opcional): Filtrar por vistoriador específico

**Resposta:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total": 150,
      "pendentes": 25,
      "concluidas": 100,
      "emAndamento": 25
    }
  }
}
```

#### `GET /api/v1/dashboard/stats`
Estatísticas detalhadas do dashboard.

**Query Parameters:**
- `vistoriadorId` (opcional): Filtrar por vistoriador específico

**Resposta:** Mesma estrutura do endpoint anterior.

### Vistorias/Inspeções

#### `GET /api/v1/inspections`
Lista todas as vistorias da empresa.

**Query Parameters:**
- `status` (opcional): Filtrar por status (Pendente, Em Andamento, Concluída)
- `vistoriadorId` (opcional): Filtrar por vistoriador
- `dataInicio` (opcional): Data de início (YYYY-MM-DD)
- `dataFim` (opcional): Data de fim (YYYY-MM-DD)
- `limit` (opcional): Limite de resultados (padrão: 50)

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "inspection_123",
      "status": "Concluída",
      "dataVistoria": "2024-01-15T10:00:00.000Z",
      "vistoriadorId": "user_456",
      "propriedadeId": "prop_789",
      "tipo": "Residencial",
      "createdAt": "2024-01-15T08:00:00.000Z"
    }
  ],
  "metadata": {
    "total": 1,
    "page": 1,
    "limit": 50
  }
}
```

#### `GET /api/v1/inspections/:id`
Obtém detalhes de uma vistoria específica.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "inspection_123",
    "status": "Concluída",
    "dataVistoria": "2024-01-15T10:00:00.000Z",
    "vistoriadorId": "user_456",
    "propriedadeId": "prop_789",
    "tipo": "Residencial",
    "observacoes": "Vistoria realizada com sucesso",
    "fotos": [
      {
        "url": "https://storage.googleapis.com/...",
        "descricao": "Fachada principal"
      }
    ],
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Propriedades

#### `GET /api/v1/properties`
Lista todas as propriedades da empresa.

**Query Parameters:**
- `search` (opcional): Buscar por endereço ou nome do proprietário
- `limit` (opcional): Limite de resultados (padrão: 50)

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prop_789",
      "enderecoCompleto": "Rua das Flores, 123 - Centro - São Paulo/SP",
      "proprietario": {
        "nome": "João Silva",
        "email": "joao@email.com",
        "telefone": "(11) 99999-9999"
      },
      "tipo": "Residencial",
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "metadata": {
    "total": 1,
    "page": 1,
    "limit": 50
  }
}
```

#### `GET /api/v1/properties/:id`
Obtém detalhes de uma propriedade específica.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "prop_789",
    "enderecoCompleto": "Rua das Flores, 123 - Centro - São Paulo/SP",
    "proprietario": {
      "nome": "João Silva",
      "email": "joao@email.com",
      "telefone": "(11) 99999-9999"
    },
    "tipo": "Residencial",
    "detalhes": {
      "area": "120m²",
      "quartos": 3,
      "banheiros": 2
    },
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

### Usuários

#### `GET /api/v1/users`
Lista todos os usuários da empresa.

**Query Parameters:**
- `role` (opcional): Filtrar por papel (admin, vistoriador, cliente)
- `ativo` (opcional): Filtrar por status ativo (true/false)
- `limit` (opcional): Limite de resultados

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_456",
      "name": "Maria Santos",
      "email": "maria@grifo.com",
      "role": "vistoriador",
      "ativo": true,
      "phone": "(11) 88888-8888",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "lastLogin": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

#### `GET /api/v1/users/:id`
Obtém detalhes de um usuário específico.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "user_456",
    "name": "Maria Santos",
    "email": "maria@grifo.com",
    "role": "vistoriador",
    "ativo": true,
    "phone": "(11) 88888-8888",
    "empresaId": "empresa_123",
    "permissions": ["view_inspections", "create_inspections"],
    "createdAt": "2024-01-01T10:00:00.000Z",
    "lastLogin": "2024-01-15T09:00:00.000Z"
  }
}
```

### Empresas

#### `GET /api/v1/empresas`
Lista todas as empresas (apenas para admins).

**Query Parameters:**
- `ativo` (opcional): Filtrar por status ativo (true/false)
- `limit` (opcional): Limite de resultados

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "empresa_123",
      "name": "Grifo Vistorias Ltda",
      "cnpj": "12.345.678/0001-90",
      "email": "contato@grifo.com",
      "phone": "(11) 3333-3333",
      "ativo": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `GET /api/v1/empresas/:id`
Obtém detalhes de uma empresa específica.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "empresa_123",
    "name": "Grifo Vistorias Ltda",
    "cnpj": "12.345.678/0001-90",
    "email": "contato@grifo.com",
    "phone": "(11) 3333-3333",
    "address": {
      "street": "Av. Paulista, 1000",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310-100"
    },
    "ativo": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Contestações

#### `GET /api/v1/contestations`
Lista todas as contestações da empresa.

**Query Parameters:**
- `status` (opcional): Filtrar por status
- `limit` (opcional): Limite de resultados

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "contest_123",
      "inspectionId": "inspection_456",
      "status": "Pendente",
      "motivo": "Discordância com avaliação",
      "descricao": "Cliente não concorda com o resultado",
      "createdAt": "2024-01-15T14:00:00.000Z",
      "inspection": {
        "id": "inspection_456",
        "dataVistoria": "2024-01-15T10:00:00.000Z"
      }
    }
  ]
}
```

#### `GET /api/v1/contestations/:id`
Obtém detalhes de uma contestação específica.

#### `PUT /api/v1/contestations/:id/status`
Atualiza o status de uma contestação.

**Body:**
```json
{
  "status": "Aprovada",
  "resposta": "Contestação procedente, vistoria será refeita"
}
```

### Sincronização

#### `GET /api/v1/sync`
Obtém informações de sincronização.

**Query Parameters:**
- `empresaId`: ID da empresa
- `vistoriadorId` (opcional): ID do vistoriador

**Resposta:**
```json
{
  "success": true,
  "data": {
    "lastSyncTimestamp": "2024-01-15T12:00:00.000Z",
    "pendingCount": 2,
    "syncedCount": 25,
    "errorCount": 0,
    "syncSuccessRate": 98,
    "averageSyncTimeMs": 750,
    "deviceInfo": {
      "lastDevice": "SM-A515F",
      "appVersion": "1.2.3",
      "networkType": "wifi"
    }
  },
  "metadata": {
    "timestamp": "2024-01-15T15:00:00.000Z"
  }
}
```

#### `POST /api/v1/sync`
Sincroniza dados do dispositivo móvel com o servidor.

**Body:**
```json
{
  "pendingInspections": [
    {
      "id": "local_123",
      "tipo": "Residencial",
      "status": "Concluída",
      "fotos": [...],
      "observacoes": "..."
    }
  ],
  "vistoriadorId": "user_456",
  "empresaId": "empresa_123"
}
```

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autorizado (token inválido/ausente)
- `403` - Acesso negado
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor
- `503` - Serviço indisponível

## Estrutura de Resposta Padrão

### Sucesso
```json
{
  "success": true,
  "data": { ... },
  "metadata": { ... }
}
```

### Erro
```json
{
  "success": false,
  "error": "Mensagem de erro",
  "code": "ERROR_CODE"
}
```

## Autenticação Firebase

Para obter o token de autenticação:

1. Faça login no Firebase Auth
2. Obtenha o `idToken` do usuário autenticado
3. Use o token no header: `Authorization: Bearer <idToken>`

## Rate Limiting

A API possui limitação de taxa:
- **Geral**: 100 requisições por 15 minutos por IP
- **Sync**: 10 requisições por 15 minutos por usuário

## CORS

A API está configurada para aceitar requisições dos seguintes domínios:
- `http://localhost:3000`
- `https://portal.grifovistorias.com`
- `https://grifovistorias.com`

## Logs e Monitoramento

Todas as requisições são logadas com:
- Método HTTP e URL
- Status de resposta
- Tempo de resposta
- IP do cliente
- User-Agent

## Suporte

Para dúvidas sobre a API:
- Email: dev@grifovistorias.com
- Documentação Swagger: `/api-docs`
- Status da API: `/api/health`