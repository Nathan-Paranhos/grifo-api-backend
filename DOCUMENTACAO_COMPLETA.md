# 📚 Documentação Completa do Sistema Grifo API

## 🎯 Visão Geral

O **Grifo API** é um backend completo para gerenciamento de propriedades e usuários, integrado com Firebase para autenticação. O sistema está hospedado no Render e usa Node.js com Express, TypeScript e inclui integração completa para portais web.

### 🚀 Status Atual
- **Servidor**: Ativo em https://grifo-api.onrender.com
- **Autenticação**: Firebase Admin SDK configurado, middleware ativo
- **Endpoints**: API v1 completa com validação Zod
- **Documentação**: Swagger disponível em `/api-docs`
- **Portal Integration**: Biblioteca completa para React/TypeScript
- **Logging**: Sistema Winston configurado
- **Segurança**: Rate limiting e validação robusta

### ✅ Funcionalidades Implementadas
- ✅ **API Backend Completa**: Endpoints v1 e legacy funcionando
- ✅ **Autenticação Firebase**: Admin SDK + middleware de segurança
- ✅ **Portal Integration**: Biblioteca React com hooks e interceptors
- ✅ **Documentação Swagger**: API docs interativa
- ✅ **Validação de Dados**: Sistema Zod para entrada/saída
- ✅ **Logging Avançado**: Winston com níveis configuráveis
- ✅ **Deploy Automático**: Render com CI/CD
- ✅ **TypeScript**: Tipagem completa em todo o projeto
- ✅ **Rate Limiting**: Proteção contra abuso
- ✅ **CORS Configurado**: Suporte para múltiplas origens
- ✅ **Health Check**: Monitoramento de saúde da API

### 🎯 Próximas Melhorias
1. **Expansão de Funcionalidades**:
   - Implementar upload de arquivos/imagens
   - Sistema de notificações em tempo real
   - Cache Redis para performance

2. **Monitoramento Avançado**:
   - Métricas de performance
   - Alertas automáticos
   - Dashboard de monitoramento

3. **Testes Automatizados**:
   - Testes unitários completos
   - Testes de integração
   - CI/CD com testes automáticos

## 🛠 Configuração e Uso

### 1. Configuração Inicial

#### Requisitos
- Node.js 18+ 
- npm ou yarn
- Conta Firebase com projeto configurado
- Git para versionamento

#### Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd grifo-api-backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.development
# Edite .env.development com suas credenciais
```

#### Configuração Firebase
1. Crie um projeto no Firebase Console
2. Ative Authentication e Firestore
3. Gere credenciais do Admin SDK
4. Configure as variáveis no arquivo `.env.development`

### 2. Desenvolvimento Local

#### Rodando o Servidor
```bash
# Desenvolvimento (Windows)
npm run dev:win

# Desenvolvimento (Linux/Mac)
npm run dev

# Build para produção
npm run build
npm start
```

#### Acessando a API
- **API Base**: http://localhost:3000
- **Documentação Swagger**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/api/health

### 3. Integração com Portal Web

O projeto inclui uma biblioteca completa para integração com portais React:

```typescript
// Exemplo de uso
import { useAuth, grifoApi } from './portal-integration';

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();
  
  const fetchProperties = async () => {
    const properties = await grifoApi.properties.getAll();
    return properties;
  };
  
  // Componente automaticamente gerencia autenticação
}
```

#### Funcionalidades da Integração
- 🔐 **Hook useAuth**: Gerenciamento completo de autenticação
- 🔄 **Auto-refresh**: Renovação automática de tokens
- 📡 **API Service**: Cliente tipado para todas as rotas
- 🛡️ **Interceptors**: Tratamento automático de erros de auth
- 📝 **TypeScript**: Tipagem completa para melhor DX

### 4. API Endpoints

#### 🌐 Endpoints Públicos
```
GET  /                    # Informações da API
GET  /api/health          # Status do sistema
GET  /api-docs            # Documentação Swagger
GET  /api/v1/health       # Health check v1
```

#### 🔒 Endpoints Protegidos (Requer `Authorization: Bearer <token>`)

**Propriedades**
```
GET    /api/v1/properties           # Lista todas as propriedades
POST   /api/v1/properties           # Cria nova propriedade
GET    /api/v1/properties/:id       # Busca propriedade por ID
PUT    /api/v1/properties/:id       # Atualiza propriedade
DELETE /api/v1/properties/:id       # Remove propriedade
```

**Usuários**
```
GET    /api/v1/users                # Lista usuários
GET    /api/v1/users/:id            # Busca usuário por ID
PUT    /api/v1/users/:id            # Atualiza usuário
```

**Dashboard**
```
GET    /api/v1/dashboard            # Estatísticas gerais
GET    /api/v1/dashboard/stats      # Métricas detalhadas
```

**Vistorias**
```
GET    /api/v1/inspections          # Lista vistorias
POST   /api/v1/inspections          # Cria nova vistoria
GET    /api/v1/inspections/:id      # Busca vistoria por ID
```

**Empresas**
```
GET    /api/v1/companies            # Lista empresas
POST   /api/v1/companies            # Cria nova empresa
```

#### 🔄 Endpoints Legacy (Compatibilidade)
```
GET    /api/properties              # Lista propriedades (legacy)
GET    /api/users                   # Lista usuários (legacy)
GET    /api/dashboard               # Dashboard (legacy)
```

### 5. Autenticação e Segurança

#### Como Autenticar
1. **Frontend/Mobile**: Use Firebase Auth para login
2. **Obter Token**: `await user.getIdToken()`
3. **Enviar Requisição**: Header `Authorization: Bearer <token>`

#### Exemplo de Requisição
```javascript
const token = await firebase.auth().currentUser.getIdToken();

fetch('https://grifo-api.onrender.com/api/v1/properties', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### Configurações de Segurança
- **Rate Limiting**: 100 req/min por IP
- **CORS**: Configurado para origens específicas
- **Validação**: Zod para todos os inputs
- **Bypass Auth**: `BYPASS_AUTH=true` apenas em desenvolvimento

### 6. Troubleshooting

#### Erros Comuns
- **401 Unauthorized**: Token ausente/inválido/expirado
- **403 Forbidden**: Token válido mas sem permissões
- **429 Too Many Requests**: Rate limit excedido
- **500 Internal Server Error**: Erro no servidor (verifique logs)

#### Debug e Logs
- **Desenvolvimento**: Logs detalhados no console
- **Produção**: Logs no Render Console
- **Níveis**: error, warn, info, debug
- **Formato**: JSON estruturado com timestamps

#### Soluções Rápidas
```bash
# Verificar status da API
curl https://grifo-api.onrender.com/api/health

# Testar endpoint protegido
curl -H "Authorization: Bearer <token>" \
     https://grifo-api.onrender.com/api/v1/properties

# Verificar logs localmente
npm run dev:win
# Logs aparecem no terminal
```

## 📂 Estrutura do Projeto

```
grifo-api-backend/
├── src/                          # Código fonte principal
│   ├── config/                   # Configurações (Firebase, DB)
│   ├── middleware/               # Middlewares (auth, cors, etc)
│   ├── routes/                   # Rotas da API (v1, legacy)
│   ├── types/                    # Tipos TypeScript
│   ├── utils/                    # Utilitários e helpers
│   └── index.ts                  # Ponto de entrada da aplicação
├── portal-integration/           # 🆕 Biblioteca para portais React
│   ├── README.md                 # Documentação da integração
│   ├── index.ts                  # Exports principais
│   ├── useAuth.tsx               # Hook de autenticação
│   ├── grifoApi.ts               # Cliente da API tipado
│   ├── authInterceptor.ts        # Interceptor de autenticação
│   ├── firebase.ts               # Configuração Firebase
│   ├── example.tsx               # Exemplo de uso
│   └── tsconfig.json             # Config TypeScript específica
├── logs/                         # Logs da aplicação (gitignored)
├── dist/                         # Build de produção (gitignored)
├── .env.development              # Variáveis de desenvolvimento
├── .env.production               # Variáveis de produção
├── .env.example                  # Template de variáveis
├── package.json                  # Dependências e scripts
├── tsconfig.json                 # Configuração TypeScript
├── render.yaml                   # Configuração de deploy Render
├── Dockerfile                    # Container Docker
├── .gitignore                    # Arquivos ignorados pelo Git
├── README.md                     # Documentação básica
└── DOCUMENTACAO_COMPLETA.md      # Esta documentação
```

### 🔧 Tecnologias Utilizadas

**Backend Core**
- **Node.js** 18+ com **Express.js**
- **TypeScript** para tipagem estática
- **Firebase Admin SDK** para autenticação
- **Zod** para validação de schemas
- **Winston** para logging estruturado

**Segurança e Performance**
- **express-rate-limit** para rate limiting
- **cors** para controle de origem
- **helmet** para headers de segurança
- **compression** para otimização

**Desenvolvimento**
- **ts-node-dev** para hot reload
- **cross-env** para variáveis de ambiente
- **swagger-ui-express** para documentação

**Deploy e Infraestrutura**
- **Render** para hospedagem
- **Docker** para containerização
- **GitHub** para versionamento

## 🚀 Deploy e Produção

### Deploy Automático (Render)
1. **Push para GitHub**: Deploy automático no `main`
2. **Build**: `npm run build` executado automaticamente
3. **Start**: `npm start` inicia o servidor
4. **URL**: https://grifo-api.onrender.com

### Deploy Manual (Docker)
```bash
# Build da imagem
docker build -t grifo-api .

# Executar container
docker run -p 3000:3000 --env-file .env.production grifo-api
```

### Variáveis de Ambiente Necessárias
```bash
# Servidor
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGINS=https://meuportal.com,https://app.grifo.com

# Firebase
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CREDENTIALS={"type":"service_account",...}

# Segurança
JWT_SECRET=your_super_secret_key
JWT_EXPIRATION=24h
BYPASS_AUTH=false

# Logging
LOG_LEVEL=info
```

## 🎯 Próximos Passos

### Curto Prazo (1-2 semanas)
1. **Testes Automatizados**
   - Implementar Jest para testes unitários
   - Testes de integração para endpoints
   - Coverage mínimo de 80%

2. **Melhorias de Performance**
   - Implementar cache Redis
   - Otimizar queries do Firestore
   - Compressão de respostas

### Médio Prazo (1-2 meses)
3. **Funcionalidades Avançadas**
   - Upload de arquivos/imagens
   - Sistema de notificações
   - Relatórios em PDF
   - Integração com APIs externas

4. **Monitoramento e Observabilidade**
   - Métricas de performance (Prometheus)
   - Alertas automáticos
   - Dashboard de monitoramento
   - Health checks avançados

### Longo Prazo (3+ meses)
5. **Escalabilidade**
   - Microserviços
   - Load balancing
   - Database sharding
   - CDN para assets

6. **Segurança Avançada**
   - OAuth2 completo
   - Auditoria de ações
   - Criptografia de dados sensíveis
   - Compliance LGPD

## 📞 Suporte e Recursos

- **Documentação API**: https://grifo-api.onrender.com/api-docs
- **Status da API**: https://grifo-api.onrender.com/api/health
- **Logs de Produção**: Render Console
- **Firebase Console**: Para gerenciar autenticação
- **GitHub Repository**: Para issues e contribuições

---

**Última atualização**: $(date)
**Versão da API**: v1.0.0
**Status**: ✅ Produção Estável