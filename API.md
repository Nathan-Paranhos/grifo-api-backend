# 📚 Documentação Completa da API Grifo

> **Sistema de Backend para Gerenciamento de Vistorias Imobiliárias**

## 🌐 Informações Gerais

- **URL de Produção**: https://grifo-api.onrender.com
- **Versão**: 1.0.0
- **Ambiente**: Production
- **Documentação Interativa**: https://grifo-api.onrender.com/api-docs
- **Health Check**: https://grifo-api.onrender.com/api/health

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
- `role`: Papel do usuário (`admin` ou `user`)

### Fluxo de Autenticação
1. **Login no Firebase**: O cliente faz login via Firebase Auth
2. **Obtenção do Token**: Cliente obtém o ID Token do Firebase
3. **Requisição à API**: Inclui o token no header `Authorization`
4. **Verificação**: API verifica o token com Firebase Admin SDK
5. **Extração de Claims**: API extrai `empresaId` e `role` do token
6. **Isolamento de Dados**: Todas as consultas são filtradas por `empresaId`

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
    "legacy": [
      "/api/dashboard",
      "/api/inspections",
      "/api/properties",
      "/api/sync",
      "/api/contestations",
      "/api/users",
      "/api/empresas",
      "/api/notifications",
      "/api/uploads",
      "/api/exports",
      "/api/reports"
    ],
    "v1": [
      "/api/v1/dashboard",
      "/api/v1/inspections",
      "/api/v1/properties",
      "/api/v1/sync",
      "/api/v1/contestations",
      "/api/v1/users",
      "/api/v1/empresas",
      "/api/v1/notifications",
      "/api/v1/uploads",
      "/api/v1/exports",
      "/api/v1/reports"
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

##### GET /api/users ou /api/v1/users
**Descrição**: Lista usuários da empresa
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

**Parâmetros de Query**:
- `role`: Filtrar por papel (admin, vistoriador, usuario)
- `ativo`: Filtrar por status ativo (true/false)
- `limit`: Limite de resultados
- `page`: Página para paginação

##### GET /api/users/:id ou /api/v1/users/:id
**Descrição**: Obtém detalhes de um usuário específico
**Autenticação**: Obrigatória
**Restrição**: Apenas usuários da mesma empresa

##### POST /api/users ou /api/v1/users
**Descrição**: Cria um novo usuário
**Autenticação**: Obrigatória
**Permissão**: Apenas administradores

**Body**:
```json
{
  "nome": "string",
  "email": "string",
  "role": "admin|vistoriador|usuario",
  "ativo": true
}
```

##### PUT /api/users/:id ou /api/v1/users/:id
**Descrição**: Atualiza um usuário existente
**Autenticação**: Obrigatória
**Permissão**: Apenas administradores

##### POST /api/users/set-claims
**Descrição**: Define custom claims para um usuário no Firebase
**Autenticação**: Obrigatória
**Permissão**: Apenas administradores
**Restrição**: Admin só pode setar claims para sua própria empresa

**Body**:
```json
{
  "uid": "string",
  "empresaId": "string",
  "role": "admin|user"
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

#### 🏢 Empresas

##### GET /api/empresas ou /api/v1/empresas
**Descrição**: Lista empresas
**Autenticação**: Obrigatória
**Comportamento**:
- **Admin**: Pode ver todas as empresas
- **User**: Vê apenas sua própria empresa

#### 🏠 Propriedades

##### GET /api/properties ou /api/v1/properties
**Descrição**: Lista propriedades da empresa
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

##### POST /api/properties ou /api/v1/properties
**Descrição**: Cria uma nova propriedade
**Autenticação**: Obrigatória

##### GET /api/properties/:id ou /api/v1/properties/:id
**Descrição**: Obtém detalhes de uma propriedade
**Autenticação**: Obrigatória
**Restrição**: Apenas propriedades da mesma empresa

##### PUT /api/properties/:id ou /api/v1/properties/:id
**Descrição**: Atualiza uma propriedade
**Autenticação**: Obrigatória

#### 🔍 Vistorias

##### GET /api/inspections ou /api/v1/inspections
**Descrição**: Lista vistorias da empresa
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

##### POST /api/inspections ou /api/v1/inspections
**Descrição**: Cria uma nova vistoria
**Autenticação**: Obrigatória

##### GET /api/inspections/:id ou /api/v1/inspections/:id
**Descrição**: Obtém detalhes de uma vistoria
**Autenticação**: Obrigatória
**Restrição**: Apenas vistorias da mesma empresa

##### PUT /api/inspections/:id ou /api/v1/inspections/:id
**Descrição**: Atualiza uma vistoria
**Autenticação**: Obrigatória

#### 📊 Dashboard

##### GET /api/dashboard ou /api/v1/dashboard
**Descrição**: Dados do dashboard da empresa
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

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

#### 📁 Uploads

##### POST /api/uploads ou /api/v1/uploads
**Descrição**: Faz upload de arquivos
**Autenticação**: Obrigatória

#### ⚖️ Contestações

##### GET /api/contestations ou /api/v1/contestations
**Descrição**: Lista contestações da empresa
**Autenticação**: Obrigatória
**Filtros**: Por `empresaId` do usuário autenticado

#### 🔄 Sincronização

##### POST /api/sync ou /api/v1/sync
**Descrição**: Sincroniza dados
**Autenticação**: Obrigatória

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

## 📞 Suporte

Para suporte técnico ou dúvidas sobre a API:
- **Documentação Interativa**: https://grifo-api.onrender.com/api-docs
- **Health Check**: https://grifo-api.onrender.com/api/health
- **Logs**: Disponíveis no dashboard do Render

---

**Última atualização**: 31/07/2025
**Versão da API**: 1.0.0
**Status**: ✅ Produção Ativa