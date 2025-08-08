# Grifo API Backend

API backend completa para Grifo Vistorias usando Supabase como backend-as-a-service.

## 🚀 Funcionalidades

- ✅ **REST API** completa com endpoints para empresas, usuários, imóveis, vistorias e contestações
- ✅ **RPC Functions** para dashboard KPIs e estatísticas de uso
- ✅ **Edge Functions** para criação de tenants e operações especializadas
- ✅ **GraphQL Proxy** com suporte a queries e mutations
- ✅ **Storage API** para upload e gerenciamento de arquivos
- ✅ **Autenticação JWT** com middleware de segurança
- ✅ **Multi-tenant** com Row Level Security (RLS)
- ✅ **CORS** configurado para múltiplos domínios
- ✅ **Rate Limiting** para proteção contra abuso
- ✅ **Tratamento de Erros** robusto e informativo
- ✅ **Documentação Swagger** integrada

## 🛠 Tecnologias

- **Node.js** + **Express.js**
- **Supabase** (PostgreSQL + Auth + Storage + Edge Functions)
- **JWT** para autenticação
- **Multer** para upload de arquivos
- **CORS** para cross-origin requests
- **Swagger UI** para documentação

## 📁 Estrutura do Projeto

```
grifo-mobile/
├── index.js                 # Servidor principal
├── package.json            # Dependências
├── .env.example           # Variáveis de ambiente (exemplo)
├── .env.development       # Variáveis de desenvolvimento
├── .env.production        # Variáveis de produção
├── render.yaml            # Configuração do Render
├── docker-compose.yml     # Docker para desenvolvimento
└── supabase/
    ├── config.toml        # Configuração do Supabase
    ├── functions/         # Edge Functions
    │   ├── create-tenant/
    │   ├── dashboard-kpis/
    │   ├── usage-stats/
    │   ├── assign-role/
    │   └── docs/          # Documentação Swagger
    └── migrations/
        └── 001_initial_schema.sql
```

## ⚙️ Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/Nathan-Paranhos/grifo-api-backend.git
cd grifo-api-backend
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env.development`:

```bash
cp .env.example .env.development
```

Edite o arquivo `.env.development` com suas credenciais do Supabase:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
JWT_SECRET=seu-jwt-secret
```

### 4. Execute o servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

O servidor estará disponível em:
- **Desenvolvimento**: `http://localhost:3000`
- **Produção**: `http://localhost:10000`
- **Documentação**: `/functions/v1/docs`

## 📚 Documentação da API

Acesse a documentação interativa Swagger em:
- **Local**: `http://localhost:10000/functions/v1/docs`
- **Produção**: `https://grifo-api.onrender.com/functions/v1/docs`

## 🔗 Endpoints Principais

### Health Check
- `GET /health` - Verifica se a API está funcionando
- `GET /api` - Informações sobre a API
- `GET /` - Página inicial com links úteis

### REST API
- `GET /rest/v1/empresas` - Lista empresas
- `POST /rest/v1/empresas` - Cria empresa
- `PATCH /rest/v1/empresas` - Atualiza empresa
- `GET /rest/v1/usuarios` - Lista usuários
- `POST /rest/v1/usuarios` - Cria usuário
- `GET /rest/v1/imoveis` - Lista imóveis
- `GET /rest/v1/vistorias` - Lista vistorias
- `GET /rest/v1/contestacoes` - Lista contestações

### RPC Functions
- `POST /rest/v1/rpc/dashboard_kpis` - KPIs do dashboard
- `POST /rest/v1/rpc/usage_stats` - Estatísticas de uso

### Edge Functions
- `POST /functions/v1/create_tenant` - Cria novo tenant
- `POST /functions/v1/assign_role` - Atribui role a usuário
- `GET /functions/v1/docs` - Documentação Swagger

### GraphQL
- `POST /graphql/v1` - Endpoint GraphQL

### Storage
- `POST /storage/v1/object/:bucket/*` - Upload de arquivos
- `GET /storage/v1/object/list/:bucket` - Lista arquivos

## 🔐 Autenticação

A API usa JWT para autenticação. Inclua o token no header:

```
Authorization: Bearer seu-jwt-token
```

Ou use a service role key:

```
apikey: sua-service-role-key
Authorization: Bearer sua-service-role-key
```

## 🚀 Deploy no Render

### Configuração Automática

O projeto está configurado para deploy automático no Render usando o arquivo `render.yaml`.

### Passos para Deploy:

1. **Conecte seu repositório ao Render**
2. **Configure as variáveis de ambiente obrigatórias:**

```env
# Supabase (OBRIGATÓRIO)
SUPABASE_URL=https://seu-projeto-ref.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# JWT (OBRIGATÓRIO)
JWT_SECRET=seu-jwt-secret-super-seguro

# Configurações automáticas (já no render.yaml)
NODE_ENV=production
PORT=10000
CORS_ORIGINS=https://grifo-portal-v1.netlify.app,https://app.grifovistorias.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOG_LEVEL=info
BYPASS_AUTH=false
PORTAL_ENABLED=true
```

### Como obter as credenciais do Supabase:

1. **SUPABASE_URL**: [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API → Project URL
2. **SUPABASE_ANON_KEY**: Settings → API → Project API keys → `anon` `public`
3. **SUPABASE_SERVICE_ROLE_KEY**: Settings → API → Project API keys → `service_role` `secret` ⚠️ **Marque como Secret no Render**

### Deploy das Edge Functions:

```bash
# Instalar Supabase CLI
npm install -g @supabase/cli

# Login no Supabase
supabase login

# Deploy da documentação
supabase functions deploy docs

# Deploy de todas as functions
supabase functions deploy
```

## 🐳 Docker

```bash
docker-compose up -d
```

## 🔧 Desenvolvimento

### Supabase Local

```bash
# Instalar Supabase CLI
npm install -g @supabase/cli

# Iniciar Supabase local
supabase start

# Deploy das Edge Functions
supabase functions deploy
```

### Estrutura de Dados

O banco de dados possui as seguintes tabelas principais:

- `empresas` - Dados das empresas (tenants)
- `usuarios` - Usuários do sistema
- `imoveis` - Imóveis cadastrados
- `vistorias` - Vistorias realizadas
- `contestacoes` - Contestações de vistorias

Todas as tabelas implementam RLS (Row Level Security) para isolamento multi-tenant.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte, entre em contato com a equipe Grifo ou abra uma issue no GitHub.

---

**🔗 Links Úteis:**
- [Portal Grifo](https://grifo-portal-v1.netlify.app)
- [App Grifo](https://app.grifovistorias.com)
- [API Produção](https://grifo-api.onrender.com)
- [Documentação](https://grifo-api.onrender.com/functions/v1/docs)
