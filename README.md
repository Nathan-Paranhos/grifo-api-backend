# Grifo API Backend - Supabase Edge Functions

## ⚠️ Importante: Projeto Supabase

Este é um projeto **Supabase Edge Functions**, não uma aplicação Node.js tradicional. As funções devem ser deployadas diretamente no Supabase, não em plataformas como Render.

## 🚀 Deploy Correto

### Opção 1: Deploy no Supabase (Recomendado)
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Linkar ao projeto
supabase link --project-ref YOUR_PROJECT_REF

# Deploy das funções
supabase functions deploy
```

### Opção 2: Deploy no Render (Alternativo)
Se você quiser usar o Render, este projeto está configurado com um package.json básico.

### Configuração de Variáveis de Ambiente

Configure as seguintes variáveis no painel do Render:

```bash
# Server Configuration
PORT=10000
NODE_ENV=production

# Database (configure com sua instância PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secrets (gere chaves seguras)
JWT_SECRET=your_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_secure_refresh_secret_here
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# CORS Origins (adicione seus domínios)
CORS_ORIGINS=https://your-frontend-domain.com

# Firebase Configuration
FIREBASE_CREDENTIALS=your_firebase_service_account_json
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket

# Security
BYPASS_AUTH=false
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Estrutura do Projeto

```
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Database Schema
├── .env.production         # Template de produção
├── .env.example           # Template de exemplo
└── docker-compose.yml     # Para desenvolvimento local
```

### Funcionalidades

- ✅ **API RESTful**: Endpoints completos para vistorias
- ✅ **Autenticação JWT**: Sistema seguro de autenticação
- ✅ **Upload de Arquivos**: Integração com Firebase Storage
- ✅ **Rate Limiting**: Proteção contra abuso
- ✅ **CORS**: Configuração flexível de origens
- ✅ **Logging**: Sistema de logs estruturado
- ✅ **Validação**: Schemas Zod para validação de dados
- ✅ **Edge Functions**: Funções serverless com Supabase

### Desenvolvimento Local

1. Clone o repositório:
```bash
git clone https://github.com/Nathan-Paranhos/grifo-api-backend.git
cd grifo-api-backend
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env.development
```

3. Inicie os serviços com Docker:
```bash
docker-compose up -d
```

### Migrações do Banco

O arquivo `supabase/migrations/001_initial_schema.sql` contém o schema completo do banco de dados.

**Importante**: Os dados de seed devem ser adicionados manualmente em produção por questões de segurança.

### Segurança

- ❌ Sem dados mockados ou de teste
- ❌ Sem credenciais hardcoded
- ❌ Sem dados de seed em produção
- ✅ Configuração via variáveis de ambiente
- ✅ Rate limiting ativo
- ✅ CORS configurado
- ✅ Validação de entrada

### Deploy

1. Conecte este repositório ao Render
2. Configure as variáveis de ambiente
3. O deploy será automático a cada push na branch `main`

### Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
