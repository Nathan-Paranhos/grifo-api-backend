# Grifo API Backend

<div align="center">
  <h3>🏢 Sistema de Gestão de Vistorias Imobiliárias</h3>
  <p>API REST robusta e escalável para o ecossistema Grifo</p>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-2.55+-orange.svg)](https://supabase.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
  [![Deploy](https://img.shields.io/badge/Deploy-Render-purple.svg)](https://render.com/)
</div>

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Deploy](#-deploy)
- [Testes](#-testes)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## 🎯 Visão Geral

A **Grifo API** é o backend do sistema de gestão de vistorias imobiliárias, oferecendo:

- 🏢 **Multi-tenant**: Isolamento completo por empresa via slug
- 🔐 **Autenticação JWT**: Sistema seguro com refresh tokens
- 📊 **Supabase Integration**: PostgreSQL + Auth + Storage
- 🚀 **Performance**: Rate limiting, compressão e cache
- 📝 **Documentação**: Swagger/OpenAPI integrado
- 🔍 **Monitoramento**: Logs estruturados com Winston
- 🛡️ **Segurança**: Helmet, CORS, validação de dados

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Portal Web    │    │   App Mobile    │    │   Integrações   │
│   (Next.js)     │    │ (React Native)  │    │  (Google Drive) │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Grifo API            │
                    │   (Node.js + Express)     │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │       Supabase            │
                    │ PostgreSQL + Auth + Files │
                    └───────────────────────────┘
```

### Estrutura Multi-tenant

- **Isolamento por Slug**: Cada empresa possui um slug único
- **RLS (Row Level Security)**: Políticas de segurança no banco
- **Middleware de Tenant**: Resolução automática do tenant
- **Dados Isolados**: Completa separação entre empresas

## 🛠️ Tecnologias

### Core
- **Node.js** 18+ - Runtime JavaScript
- **Express.js** 4.18+ - Framework web
- **Supabase** 2.55+ - Backend-as-a-Service
- **PostgreSQL** - Banco de dados relacional

### Segurança
- **JWT** - Autenticação stateless
- **Bcrypt** - Hash de senhas
- **Helmet** - Headers de segurança
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - Proteção contra spam

### Utilitários
- **Winston** - Sistema de logs
- **Multer** - Upload de arquivos
- **Sharp** - Processamento de imagens
- **Zod** - Validação de schemas
- **Swagger** - Documentação da API

### Desenvolvimento
- **ESLint** - Linting de código
- **Prettier** - Formatação de código
- **Jest** - Testes unitários
- **Nodemon** - Hot reload

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ e npm 8+
- Conta no Supabase
- Git

### Clonagem e Instalação

```bash
# Clone o repositório
git clone https://github.com/Nathan-Paranhos/grifo-api-backend.git
cd grifo-api-backend

# Instale as dependências
npm install

# Copie o arquivo de ambiente
cp .env.example .env

# Configure as variáveis de ambiente (veja seção Configuração)
# Edite o arquivo .env com suas credenciais
```

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Configure o arquivo `.env` com base no `.env.example`:

```bash
# Configurações básicas
NODE_ENV=development
PORT=3000
JWT_SECRET=sua-chave-jwt-super-secreta

# Supabase (obrigatório)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# CORS (ajuste para produção)
CORS_ORIGIN=http://localhost:3001,http://localhost:19006
```

### 2. Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrações SQL (disponíveis no projeto principal)
3. Configure as políticas RLS
4. Obtenha as chaves de API

### 3. Estrutura do Banco

Principais tabelas:
- `companies` - Empresas (tenants)
- `users` - Usuários do sistema
- `properties` - Imóveis
- `inspections` - Vistorias
- `contestations` - Contestações
- `uploads` - Arquivos
- `notifications` - Notificações

## 🎮 Uso

### Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
npm run dev

# Com debug habilitado
npm run dev:debug

# Execute os testes
npm test

# Execute linting
npm run lint

# Formate o código
npm run format
```

### Produção

```bash
# Inicie o servidor de produção
npm start

# Verifique a saúde da API
npm run health
```

### Scripts Disponíveis

- `npm start` - Inicia servidor de produção
- `npm run dev` - Servidor de desenvolvimento
- `npm test` - Executa testes
- `npm run lint` - Verifica código
- `npm run format` - Formata código
- `npm run check` - Lint + format + tests
- `npm run health` - Verifica saúde da API

## 📡 API Endpoints

### Base URL
- **Desenvolvimento**: `http://localhost:3000/api`
- **Produção**: `https://grifo-api.onrender.com/api`

### Autenticação
```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### Empresas (Companies)
```http
GET    /api/companies
POST   /api/companies
GET    /api/companies/:slug
PUT    /api/companies/:slug
DELETE /api/companies/:slug
```

### Usuários (Users)
```http
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### Imóveis (Properties)
```http
GET    /api/properties
POST   /api/properties
GET    /api/properties/:id
PUT    /api/properties/:id
DELETE /api/properties/:id
```

### Vistorias (Inspections)
```http
GET    /api/inspections
POST   /api/inspections
GET    /api/inspections/:id
PUT    /api/inspections/:id
DELETE /api/inspections/:id
POST   /api/inspections/:id/finalize
```

### Contestações (Contestations)
```http
GET    /api/contestations
POST   /api/contestations
GET    /api/contestations/:id
PUT    /api/contestations/:id
DELETE /api/contestations/:id
```

### Uploads
```http
POST   /api/uploads
GET    /api/uploads/:id
DELETE /api/uploads/:id
```

### Utilitários
```http
GET /api/health     # Status da API
GET /api/docs       # Documentação Swagger
GET /api/metrics    # Métricas da aplicação
```

### Autenticação

Todos os endpoints (exceto `/health`, `/docs` e `/auth/login|register`) requerem autenticação via JWT:

```http
Authorization: Bearer <seu-jwt-token>
X-Tenant-Slug: <slug-da-empresa>
```

## 🚀 Deploy

### Deploy no Render (Recomendado)

1. **Conecte o repositório**:
   - Acesse [Render](https://render.com)
   - Conecte sua conta GitHub
   - Selecione o repositório

2. **Configure o serviço**:
   - Tipo: Web Service
   - Runtime: Node
   - Build Command: `npm ci`
   - Start Command: `npm start`
   - Health Check: `/api/health`

3. **Variáveis de ambiente**:
   ```bash
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=<gere-uma-chave-segura>
   SUPABASE_URL=<sua-url-supabase>
   SUPABASE_ANON_KEY=<sua-chave-anonima>
   SUPABASE_SERVICE_ROLE_KEY=<sua-chave-service>
   CORS_ORIGIN=<dominio-do-frontend>
   ```

4. **Deploy automático**:
   - O Render fará deploy automático a cada push na branch `main`
   - Monitore os logs durante o deploy

### Deploy com Docker

```bash
# Build da imagem
docker build -t grifo-api .

# Execute o container
docker run -p 3000:3000 --env-file .env grifo-api
```

### Deploy Manual

```bash
# Em um servidor Linux/Ubuntu
sudo apt update
sudo apt install nodejs npm

# Clone e configure
git clone <repo-url>
cd grifo-api-backend
npm ci --production

# Configure .env e inicie
npm start
```

### Verificação do Deploy

```bash
# Teste a API
curl https://sua-api.onrender.com/api/health

# Resposta esperada:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Testes com coverage
npm run test:coverage

# Apenas testes de integração
npm run test:integration
```

### Estrutura de Testes

```
tests/
├── unit/           # Testes unitários
├── integration/    # Testes de integração
├── fixtures/       # Dados de teste
└── helpers/        # Utilitários de teste
```

### Exemplo de Teste

```javascript
// tests/unit/auth.test.js
const request = require('supertest')
const app = require('../../src/app')

describe('Auth Endpoints', () => {
  test('POST /api/auth/login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      })
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('token')
  })
})
```

## 📊 Monitoramento

### Logs

```bash
# Visualizar logs em tempo real
npm run logs

# Logs de erro
npm run logs:error

# Logs são salvos em:
logs/
├── app.log         # Logs gerais
├── error.log       # Logs de erro
└── access.log      # Logs de acesso
```

### Métricas

Acesse `/api/metrics` para ver:
- Uptime da aplicação
- Uso de memória
- Número de requests
- Tempo de resposta médio

### Health Check

```bash
# Verificar saúde da API
curl https://grifo-api.onrender.com/api/health

# Resposta:
{
  "status": "ok",
  "database": "connected",
  "uptime": 3600,
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB"
  }
}
```

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
src/
├── controllers/     # Controladores da API
├── middleware/      # Middlewares customizados
├── models/         # Modelos de dados
├── routes/         # Definição de rotas
├── services/       # Lógica de negócio
├── utils/          # Utilitários
├── config/         # Configurações
└── server.js       # Ponto de entrada
```

### Padrões de Código

- **ESLint**: Configuração Standard
- **Prettier**: Formatação automática
- **Commits**: Conventional Commits
- **Branches**: GitFlow

### Adicionando Novos Endpoints

1. Crie o controlador em `src/controllers/`
2. Adicione as rotas em `src/routes/`
3. Implemente a lógica em `src/services/`
4. Adicione testes em `tests/`
5. Documente no Swagger

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes

- Siga os padrões de código estabelecidos
- Adicione testes para novas funcionalidades
- Mantenha a documentação atualizada
- Use commits semânticos

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Nathan Paranhos**
- GitHub: [@Nathan-Paranhos](https://github.com/Nathan-Paranhos)
- Email: nathan@grifo.com

## 🙏 Agradecimentos

- [Supabase](https://supabase.com) - Backend-as-a-Service
- [Render](https://render.com) - Hospedagem
- [Express.js](https://expressjs.com) - Framework web
- Comunidade open source

---

<div align="center">
  <p>Feito com ❤️ para o ecossistema Grifo</p>
  <p>🏢 Transformando a gestão de vistorias imobiliárias</p>
</div>