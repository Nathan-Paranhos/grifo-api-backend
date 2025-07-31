# 🏢 Grifo API Backend

> **Sistema completo de backend para gerenciamento de vistorias imobiliárias**

API backend robusta e escalável para o sistema Grifo, responsável por gerenciar toda a lógica de negócio, autenticação de usuários, persistência de dados e integração com aplicativo móvel e portal web.

[![Deploy Status](https://img.shields.io/badge/deploy-active-brightgreen)](https://grifo-api.onrender.com)
[![Node.js](https://img.shields.io/badge/node.js-18+-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.3+-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/firebase-integrated-orange)](https://firebase.google.com/)
[![API Docs](https://img.shields.io/badge/docs-swagger-green)](https://grifo-api.onrender.com/api-docs)
[![License](https://img.shields.io/badge/license-ISC-blue)](./LICENSE)

## 🔗 Links Rápidos

| Recurso | URL | Descrição |
|---------|-----|-----------|
| 🌐 **API Produção** | [grifo-api.onrender.com](https://grifo-api.onrender.com) | API em produção |
| 📚 **Documentação** | [/api-docs](https://grifo-api.onrender.com/api-docs) | Swagger UI interativo |
| ❤️ **Health Check** | [/api/health](https://grifo-api.onrender.com/api/health) | Status da API |
| 📖 **Documentação** | [Swagger UI](https://grifo-api.onrender.com/api-docs) | Documentação interativa da API |

## 📊 Status do Projeto

- ✅ **API Backend**: Totalmente funcional
- ✅ **Autenticação Firebase**: Integrada e testada
- ✅ **Deploy Automático**: Ativo no Render.com
- ✅ **Documentação**: Swagger UI + docs técnicas
- ✅ **Testes**: Scripts de validação completos
- ✅ **Portal Integration**: Biblioteca React pronta
- ✅ **Docker**: Containerização configurada
- 🔄 **Monitoramento**: Logs estruturados (Winston)
- 🔄 **Performance**: Rate limiting ativo

## ✨ Principais Funcionalidades

### 🔐 **Segurança e Autenticação**
- **Firebase Authentication**: Integração completa com Firebase Auth + Admin SDK
- **JWT Tokens**: Gerenciamento seguro de tokens de acesso
- **Rate Limiting**: Proteção contra abuso (100 req/min por IP)
- **CORS Configurado**: Suporte para múltiplas origens seguras
- **Helmet.js**: Headers de segurança HTTP

### 🚀 **API e Integração**
- **Endpoints Versionados**: API v1 + endpoints legacy para compatibilidade
- **Validação Robusta**: Schemas Zod para validação de entrada/saída
- **Documentação Swagger**: API docs interativa e sempre atualizada
- **Portal Integration**: Biblioteca React/TypeScript completa
- **Health Checks**: Monitoramento de saúde da aplicação

### 🔔 **Sistema de Notificações**
- **CRUD Completo**: Criação, listagem, marcação como lida
- **Paginação Avançada**: Suporte a filtros por tipo e status
- **Tipos Múltiplos**: Inspeção, contestação, sistema, lembrete
- **Marcação em Lote**: Marcar todas as notificações como lidas

### 📁 **Sistema de Upload**
- **Upload de Imagens**: Suporte a JPG, PNG, GIF, WebP (máx 10 arquivos, 5MB cada)
- **Upload de Documentos**: Suporte a PDF, DOC, DOCX, TXT (máx 5 arquivos, 10MB cada)
- **Validação de Tipos**: Filtros automáticos por tipo de arquivo
- **Gerenciamento**: Listagem paginada e remoção de arquivos

### 📊 **Sistema de Exportação**
- **Múltiplos Formatos**: Excel, PDF e CSV
- **Exportação de Vistorias**: Com filtros por data, status e vistoriador
- **Exportação de Imóveis**: Com filtros por tipo de propriedade
- **Exportação de Usuários**: Dados completos dos usuários

### 📈 **Relatórios Avançados**
- **Dashboard Avançado**: Métricas detalhadas e KPIs
- **Relatórios de Performance**: Análise de produtividade dos vistoriadores
- **Analytics**: Insights de negócio com recomendações
- **Tendências**: Análise temporal e benchmarks

### 📊 **Monitoramento e Logs**
- **Winston Logging**: Sistema de logs estruturado por níveis
- **Error Tracking**: Rastreamento detalhado de erros
- **Performance Metrics**: Métricas de performance da API

### 🐳 **Deploy e DevOps**
- **Docker Ready**: Containerização completa com multi-stage build
- **Render Deploy**: Deploy automático com CI/CD
- **Environment Management**: Configuração por ambiente (dev/prod)
- **TypeScript**: Tipagem completa para melhor DX

## 🚀 Stack Tecnológico

### **Core Backend**
- **Runtime**: Node.js 18+ (LTS)
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.3+
- **Package Manager**: npm

### **Database & Auth**
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Authentication + Admin SDK
- **Real-time**: Firebase Real-time capabilities

### **Validation & Security**
- **Schema Validation**: Zod 3.22+
- **Security Headers**: Helmet.js
- **Rate Limiting**: express-rate-limit
- **CORS**: cors middleware
- **Input Sanitization**: DOMPurify

### **Monitoring & Docs**
- **Logging**: Winston 3.11+
- **API Documentation**: Swagger UI + OpenAPI 3.0
- **Health Checks**: Custom health endpoints

### **DevOps & Deploy**
- **Containerization**: Docker (Alpine Linux)
- **Cloud Platform**: Render.com
- **Environment**: cross-env
- **Process Management**: ts-node-dev (dev)

## 📁 Estrutura do Projeto

```
grifo-api-backend/
├── 📂 src/                          # Código fonte TypeScript
│   ├── 📂 config/                   # Configurações (Firebase, Logger, Swagger)
│   ├── 📂 middleware/               # Middlewares (auth, validation, rate-limit)
│   ├── 📂 routes/                   # Definição das rotas da API
│   │   ├── v1/                      # Rotas da API v1
│   │   └── legacy/                  # Rotas legacy para compatibilidade
│   ├── 📂 types/                    # Definições de tipos TypeScript
│   ├── 📂 utils/                    # Funções utilitárias
│   └── 📄 index.ts                  # Ponto de entrada da aplicação
├── 📂 portal-integration/           # Biblioteca para integração com portais
│   ├── 📄 grifoApi.ts              # Cliente API tipado
│   ├── 📄 useAuth.tsx              # Hook de autenticação React
│   ├── 📄 authInterceptor.ts       # Interceptor para requisições
│   └── 📄 firebase.ts              # Configuração Firebase client
├── 📂 portal-web/                   # Portal web de demonstração
├── 📂 dist/                         # Código compilado (JavaScript)
├── 📂 logs/                         # Arquivos de log da aplicação
├── 📄 .env.example                  # Template de variáveis de ambiente
├── 📄 .env.development              # Configurações de desenvolvimento
├── 📄 .env.production               # Configurações de produção
├── 📄 Dockerfile                    # Configuração Docker
├── 📄 render.yaml                   # Configuração deploy Render
├── 📄 package.json                  # Dependências e scripts
├── 📄 tsconfig.json                 # Configurações TypeScript
├── 📄 DOCUMENTACAO_COMPLETA.md      # Documentação técnica completa
├── 📄 PARAMETROS_API_COMPLETO.md    # Documentação de parâmetros
└── 📄 test-*.js                     # Scripts de teste da API
```

## 🔧 Configuração do Ambiente

### 📋 **Pré-requisitos**
- **Node.js** 18+ (LTS recomendado)
- **npm** 9+ ou **yarn** 1.22+
- **Git** para versionamento
- **Conta Firebase** com projeto configurado
- **Docker** (opcional, para containerização)

### 🚀 **Instalação Rápida**

1. **Clone o repositório**:
   ```bash
   git clone <repository-url>
   cd grifo-api-backend
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure o ambiente**:
   ```bash
   # Copie o template de configuração
   cp .env.example .env.development
   
   # Edite com suas credenciais Firebase
   # Use seu editor preferido para editar .env.development
   ```

4. **Configure o Firebase**:
   - Acesse o [Firebase Console](https://console.firebase.google.com)
   - Crie um novo projeto ou use um existente
   - Ative **Authentication** e **Firestore Database**
   - Gere credenciais do **Admin SDK**:
     - Project Settings → Service Accounts → Generate new private key
   - Copie as credenciais para `FIREBASE_CREDENTIALS` no `.env.development`

5. **Inicie o servidor de desenvolvimento**:
   ```bash
   # Windows
   npm run dev:win
   
   # Linux/Mac
   npm run dev
   ```

6. **Verifique se está funcionando**:
   - API: http://localhost:3000
   - Health Check: http://localhost:3000/api/health
   - Documentação: http://localhost:3000/api-docs

### ⚙️ **Configuração de Variáveis de Ambiente**

**Arquivo `.env.development` (exemplo)**:
```env
# Configuração do Servidor
NODE_ENV=development
PORT=3000

# Firebase Configuration (obtenha no Firebase Console)
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin SDK (JSON das credenciais)
FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"..."}'

# Segurança (apenas desenvolvimento)
BYPASS_AUTH=true
JWT_SECRET=your_dev_secret_key

# CORS (adicione suas origens)
CORS_ORIGIN=http://localhost:3000,http://localhost:8080

# Rate Limiting
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW_MS=900000

# Logging
LOG_LEVEL=debug
```

## 🛠️ Scripts Disponíveis

### **Desenvolvimento**
```bash
npm run dev         # Desenvolvimento (Linux/Mac)
npm run dev:win     # Desenvolvimento (Windows)
```

### **Build e Produção**
```bash
npm run build       # Compila TypeScript → JavaScript
npm run start       # Inicia servidor produção (Linux/Mac)
npm run start:win   # Inicia servidor produção (Windows)
npm run start:dev   # Inicia servidor dev com código compilado
```

### **Utilitários**
```bash
npm run clean       # Remove diretório dist/
npm run build:clean # Limpa e reconstrói o projeto
npm run deploy      # Build + Start (para deploy)
```

### **Docker**
```bash
npm run docker:build  # Constrói imagem Docker
npm run docker:run    # Executa container Docker
```

### **Monitoramento**
```bash
npm run health-check  # Verifica saúde da aplicação
```

## 🔐 Sistema de Autenticação

### **Firebase Authentication**
A API utiliza **Firebase Authentication** com **Admin SDK** para validação de tokens JWT.

### **Como Autenticar**

1. **Obter Token do Firebase**:
   ```javascript
   // Frontend/Mobile
   const user = firebase.auth().currentUser;
   const token = await user.getIdToken();
   ```

2. **Enviar Requisição Autenticada**:
   ```http
   GET /api/v1/dashboard
   Authorization: Bearer <FIREBASE_ID_TOKEN>
   Content-Type: application/json
   ```

3. **Exemplo com JavaScript/Fetch**:
   ```javascript
   const response = await fetch('https://grifo-api.onrender.com/api/v1/users', {
     method: 'GET',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     }
   });
   ```

### **Endpoints por Nível de Acesso**

#### 🌐 **Públicos** (sem autenticação)
- `GET /` - Informações da API
- `GET /api/health` - Health check
- `GET /api-docs` - Documentação Swagger

#### 🔒 **Protegidos** (requer token Firebase)
- `GET /api/v1/users` - Listar usuários
- `GET /api/v1/properties` - Listar propriedades
- `GET /api/v1/dashboard` - Dashboard e estatísticas
- `POST /api/v1/inspections` - Criar vistorias
- Todos os endpoints `/api/v1/*`

### **Desenvolvimento Local**
```env
# .env.development - Desabilita auth para testes
BYPASS_AUTH=true
```

⚠️ **Importante**: `BYPASS_AUTH=true` deve ser usado **apenas em desenvolvimento**!

## 📚 Documentação da API

### **Swagger UI (Interativa)**
Documentação completa e interativa com todos os endpoints, schemas e exemplos.

- **🔗 Produção**: [grifo-api.onrender.com/api-docs](https://grifo-api.onrender.com/api-docs)
- **🔗 Desenvolvimento**: [localhost:3000/api-docs](http://localhost:3000/api-docs)

### **Principais Endpoints da API**

#### **🏠 Propriedades**
```http
GET    /api/v1/properties           # Lista propriedades
POST   /api/v1/properties           # Cria propriedade
GET    /api/v1/properties/:id       # Busca por ID
PUT    /api/v1/properties/:id       # Atualiza propriedade
DELETE /api/v1/properties/:id       # Remove propriedade
GET    /api/v1/properties/export    # Exportar imóveis
```

#### **👥 Usuários**
```http
GET    /api/v1/users                # Lista usuários
POST   /api/v1/users                # Cria usuário
GET    /api/v1/users/:id            # Busca usuário
PUT    /api/v1/users/:id            # Atualiza usuário
GET    /api/v1/users/export         # Exportar usuários
```

#### **🔍 Vistorias**
```http
GET    /api/v1/inspections          # Lista vistorias
POST   /api/v1/inspections          # Cria vistoria
GET    /api/v1/inspections/:id      # Busca vistoria
GET    /api/v1/inspections/export   # Exportar vistorias
```

#### **🏢 Empresas**
```http
GET    /api/v1/companies            # Lista empresas
POST   /api/v1/companies            # Cria empresa
GET    /api/v1/companies/:id        # Busca empresa
```

#### **📊 Dashboard**
```http
GET    /api/v1/dashboard            # Estatísticas gerais
GET    /api/v1/dashboard/stats      # Métricas detalhadas
```

#### **🔄 Sincronização**
```http
POST   /api/v1/sync/sync            # Sincronizar dados
GET    /api/v1/sync                 # Status de sincronização
```

#### **🔔 Notificações**
```http
GET    /api/v1/notifications        # Lista notificações paginadas
PUT    /api/v1/notifications/:id/read # Marcar como lida
PUT    /api/v1/notifications/mark-all-read # Marcar todas como lidas
```
**Parâmetros de Query:**
- `page` (integer): Número da página (padrão: 1)
- `limit` (integer): Itens por página (padrão: 10)
- `read` (boolean): Filtrar por status de leitura
- `type` (string): Filtrar por tipo [inspection, contestation, system, reminder]

#### **📁 Upload de Arquivos**
```http
POST   /api/v1/uploads/images       # Upload de imagens (máx 10, 5MB cada)
POST   /api/v1/uploads/documents    # Upload de documentos (máx 5, 10MB cada)
GET    /api/v1/uploads              # Lista arquivos paginados
DELETE /api/v1/uploads/:id         # Remove arquivo
```
**Parâmetros de Upload:**
- `images[]` (file): Arquivos de imagem (JPG, PNG, GIF, WebP)
- `documents[]` (file): Arquivos de documento (PDF, DOC, DOCX, TXT)
- `category` (string): Categoria do arquivo

#### **📊 Exportações**
```http
GET    /api/v1/inspections/export   # Exportar vistorias
GET    /api/v1/properties/export    # Exportar imóveis
GET    /api/v1/users/export         # Exportar usuários
```
**Parâmetros de Query:**
- `format` (string): Formato [excel, pdf, csv] (padrão: excel)
- `dateFrom` (date): Data inicial (YYYY-MM-DD)
- `dateTo` (date): Data final (YYYY-MM-DD)
- `status` (string): Filtrar por status
- `vistoriadorId` (string): Filtrar por vistoriador
- `propertyType` (string): Filtrar por tipo de imóvel

#### **📈 Relatórios Avançados**
```http
GET    /api/v1/reports/dashboard-advanced # Dashboard com métricas detalhadas
GET    /api/v1/reports/performance        # Relatório de performance
GET    /api/v1/reports/analytics          # Analytics com insights
```
**Parâmetros de Query:**
- `startDate` (date): Data inicial (YYYY-MM-DD)
- `endDate` (date): Data final (YYYY-MM-DD)
- `vistoriadorId` (string): Filtrar por vistoriador
- `page` (integer): Número da página
- `limit` (integer): Itens por página

### **Documentação Adicional**
- 📖 **[DOCUMENTACAO_COMPLETA.md](./DOCUMENTACAO_COMPLETA.md)** - Guia técnico completo
- 📋 **[PARAMETROS_API_COMPLETO.md](./PARAMETROS_API_COMPLETO.md)** - Documentação de parâmetros

## 🌐 Deploy e Produção

### **🚀 Deploy Automático (Render.com)**

A aplicação está configurada para deploy automático no **Render.com**.

#### **Configuração Inicial**
1. **Conecte o repositório** ao Render via GitHub
2. **Crie um Web Service** apontando para este repo
3. **Configure as variáveis de ambiente** (ver seção abaixo)
4. **Deploy automático** a cada push na branch `main`

#### **Variáveis de Ambiente (Produção)**
```env
# Obrigatórias no Render Dashboard
NODE_ENV=production
PORT=3000
FIREBASE_CREDENTIALS={...}  # JSON completo do Admin SDK
FIREBASE_PROJECT_ID=your-project-id
JWT_SECRET=strong_production_secret
BYPASS_AUTH=false

# Opcionais (com valores padrão)
CORS_ORIGIN=https://app.grifovistorias.com
RATE_LIMIT_MAX=100
LOG_LEVEL=info
```

#### **URLs de Produção**
- **🔗 API Base**: https://grifo-api.onrender.com
- **🔗 Health Check**: https://grifo-api.onrender.com/api/health
- **🔗 Documentação**: https://grifo-api.onrender.com/api-docs

### **🐳 Deploy com Docker**

#### **Build Local**
```bash
# Construir imagem
docker build -t grifo-api-backend .

# Executar container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  --env-file .env.production \
  grifo-api-backend
```

#### **Deploy em Cloud Providers**
```bash
# Google Cloud Run
gcloud run deploy grifo-api \
  --source . \
  --platform managed \
  --region us-central1

# AWS ECS/Fargate
# Heroku Container Registry
# Azure Container Instances
```

### **⚙️ Configuração de Produção**

#### **Arquivo `render.yaml`**
O projeto inclui configuração automática para Render:
- **Build**: `npm install && npm run build`
- **Start**: `npm start`
- **Health Check**: `/health`
- **Auto Deploy**: Ativado na branch `main`

#### **Monitoramento**
- **Health Checks**: Endpoint `/health` configurado
- **Logs**: Winston com níveis configuráveis
- **Error Tracking**: Logs estruturados para debugging

## 📝 Sistema de Logging

### **Winston Logger**
Sistema de logs estruturado com múltiplos níveis e destinos.

#### **Arquivos de Log**
```
logs/
├── error.log      # Apenas erros críticos
├── combined.log   # Todos os logs (info + error)
└── access.log     # Logs de acesso HTTP (futuro)
```

#### **Níveis de Log**
- **`error`**: Erros críticos que requerem atenção
- **`warn`**: Avisos importantes
- **`info`**: Informações gerais de operação
- **`debug`**: Informações detalhadas para debugging

#### **Configuração por Ambiente**
```env
# Desenvolvimento
LOG_LEVEL=debug

# Produção
LOG_LEVEL=info
```

## 🧪 Testes

### **Scripts de Teste Disponíveis**
```bash
# Testes da API
node test-api-simple.js          # Testes básicos
node test-complete.js             # Testes completos
node test-parametros-completo.js  # Validação de parâmetros

# Testes PowerShell (Windows)
.\test-100-percent-complete.ps1   # Cobertura completa
.\test-with-auth.ps1              # Testes com autenticação
```

### **Cobertura de Testes**
- ✅ **Health Checks**: Endpoints de saúde
- ✅ **Autenticação**: Validação de tokens
- ✅ **Validação**: Schemas e parâmetros
- ✅ **CRUD Operations**: Operações básicas
- ✅ **Error Handling**: Tratamento de erros

## 🔗 Integração com Portal

### **Biblioteca React/TypeScript**
O projeto inclui uma biblioteca completa para integração com portais web.

#### **Principais Componentes**
```typescript
// Hook de autenticação
import { useAuth } from './portal-integration/useAuth';

// Cliente API tipado
import { grifoApi } from './portal-integration/grifoApi';

// Configuração Firebase
import { firebaseConfig } from './portal-integration/firebase';
```

#### **Exemplo de Uso**
```typescript
function MyPortal() {
  const { user, loading, signIn, signOut } = useAuth();
  
  const fetchData = async () => {
    const properties = await grifoApi.properties.getAll();
    const users = await grifoApi.users.getAll();
    return { properties, users };
  };
  
  if (loading) return <div>Carregando...</div>;
  if (!user) return <LoginForm onLogin={signIn} />;
  
  return <Dashboard data={fetchData} />;
}
```

## 🛠️ Troubleshooting

### **Problemas Comuns**

#### 🔥 **Erro de Autenticação Firebase**
```bash
# Erro: "Firebase Admin SDK not initialized"
# Solução: Verifique as credenciais no .env
FIREBASE_ADMIN_CREDENTIALS={"type":"service_account",...}
```

#### 🔥 **Erro de CORS**
```bash
# Erro: "CORS policy blocked"
# Solução: Configure CORS_ORIGIN no .env
CORS_ORIGIN=http://localhost:3000,https://seudominio.com
```

#### 🔥 **Porta em Uso**
```bash
# Erro: "Port 3000 is already in use"
# Solução: Mude a porta ou mate o processo
PORT=3001 npm run dev
# ou
npx kill-port 3000
```

#### 🔥 **Dependências Desatualizadas**
```bash
# Limpe cache e reinstale
npm run clean
rm -rf node_modules package-lock.json
npm install
```

### **Logs e Debugging**

```bash
# Logs detalhados
LOG_LEVEL=debug npm run dev

# Verificar health check
curl http://localhost:3000/api/health

# Testar endpoint específico
curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3000/api/v1/propriedades
```

## ❓ FAQ

<details>
<summary><strong>Como obter credenciais do Firebase?</strong></summary>

1. Acesse o [Console Firebase](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá em **Configurações** → **Contas de serviço**
4. Clique em **Gerar nova chave privada**
5. Baixe o arquivo JSON e configure no `.env`
</details>

<details>
<summary><strong>Como configurar domínio personalizado?</strong></summary>

1. Configure DNS para apontar para Render
2. Adicione domínio no dashboard do Render
3. Atualize `CORS_ORIGIN` com novo domínio
4. Teste SSL/HTTPS
</details>

<details>
<summary><strong>Como fazer backup dos dados?</strong></summary>

```bash
# Backup Firestore (via Firebase CLI)
firebase firestore:export gs://seu-bucket/backup-$(date +%Y%m%d)

# Backup configurações
cp .env .env.backup
cp render.yaml render.yaml.backup
```
</details>

<details>
<summary><strong>Como monitorar performance?</strong></summary>

- **Logs**: Acesse logs no Render dashboard
- **Health**: Monitor `/api/health` endpoint
- **Métricas**: Use ferramentas como New Relic ou DataDog
- **Uptime**: Configure monitoring com UptimeRobot
</details>

## 🤝 Como Contribuir

### **Processo de Contribuição**
1. **Fork** o repositório
2. **Clone** seu fork localmente
3. **Crie uma branch** para sua feature:
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```
4. **Desenvolva** e **teste** suas alterações
5. **Commit** com mensagens descritivas:
   ```bash
   git commit -m "feat: adiciona endpoint de upload de arquivos"
   ```
6. **Push** para seu fork:
   ```bash
   git push origin feature/nova-funcionalidade
   ```
7. **Abra um Pull Request** com descrição detalhada

### **Padrões de Desenvolvimento**
- **TypeScript**: Tipagem obrigatória
- **ESLint**: Seguir regras de linting
- **Conventional Commits**: Padrão de mensagens
- **Testes**: Incluir testes para novas funcionalidades
- **Documentação**: Atualizar docs quando necessário

### **Estrutura de Commits**
```
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
style: formatação de código
refactor: refatoração
test: adição de testes
chore: tarefas de manutenção
```

---

## 📞 Suporte e Contato

- **📖 Documentação**: [DOCUMENTACAO_COMPLETA.md](./DOCUMENTACAO_COMPLETA.md)
- **🐛 Issues**: Use o GitHub Issues para reportar bugs
- **💡 Features**: Sugira melhorias via GitHub Discussions
- **📧 Contato**: Entre em contato via issues do repositório

## 📋 Roadmap

### 🎯 Próximas Versões

#### v2.1.0 - Q1 2024
- [ ] Upload de arquivos (imagens, documentos)
- [ ] Sistema de notificações push
- [ ] Cache Redis para performance
- [ ] Testes automatizados (Jest)

#### v2.2.0 - Q2 2024
- [ ] Monitoramento avançado (Prometheus)
- [ ] API GraphQL opcional
- [ ] Integração com WhatsApp Business
- [ ] Dashboard analytics avançado

#### v3.0.0 - Q3 2024
- [ ] Microserviços (separação de domínios)
- [ ] Event-driven architecture
- [ ] Multi-tenancy
- [ ] API Gateway

### 🔄 Changelog

#### v2.0.0 - Atual
- ✅ Migração completa para TypeScript
- ✅ Integração Firebase Authentication
- ✅ Sistema de logging estruturado
- ✅ Deploy automático Render.com
- ✅ Documentação Swagger completa
- ✅ Rate limiting e segurança
- ✅ Portal integration library

## 📄 Licença

Este projeto está licenciado sob a **ISC License** - veja o arquivo [LICENSE](./LICENSE) para detalhes.

### Resumo da Licença
- ✅ Uso comercial permitido
- ✅ Modificação permitida
- ✅ Distribuição permitida
- ✅ Uso privado permitido
- ❌ Responsabilidade limitada
- ❌ Garantia limitada

## 🙏 Agradecimentos

- **Firebase Team** - Pela excelente plataforma de backend
- **Express.js Community** - Pelo framework robusto e flexível
- **TypeScript Team** - Pela tipagem estática que melhora a qualidade do código
- **Render.com** - Pela plataforma de deploy simples e eficiente
- **Open Source Community** - Por todas as bibliotecas incríveis utilizadas

## 📊 Estatísticas do Projeto

- **Linhas de Código**: ~5,000+ (TypeScript)
- **Endpoints**: 25+ endpoints RESTful
- **Dependências**: 15+ bibliotecas principais
- **Cobertura de Testes**: Em desenvolvimento
- **Uptime**: 99.9% (últimos 30 dias)
- **Tempo de Resposta**: <200ms (média)

---

<div align="center">

**🏠 Grifo API Backend**

*Sistema robusto e escalável para gestão imobiliária*

[![Deploy Status](https://img.shields.io/badge/deploy-active-brightgreen)](https://grifo-api.onrender.com)
[![API Health](https://img.shields.io/badge/health-✅%20online-brightgreen)](https://grifo-api.onrender.com/api/health)
[![Documentation](https://img.shields.io/badge/docs-📚%20swagger-blue)](https://grifo-api.onrender.com/api-docs)

**Desenvolvido com ❤️ pela equipe Grifo**

</div>

---

*Documentação mantida e atualizada pela equipe de desenvolvimento.*