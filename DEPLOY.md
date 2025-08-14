# 🚀 Deploy Guide - API Grifo Vistorias

Guia completo para fazer deploy da API Grifo Vistorias no Render via GitHub.

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Render](https://render.com)
- Projeto Supabase configurado
- Variáveis de ambiente preparadas

## 🔧 Preparação do Repositório

### 1. Criar Repositório no GitHub

```bash
# No diretório da API
git init
git add .
git commit -m "Initial commit: API Grifo Vistorias"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/grifo-api.git
git push -u origin main
```

### 2. Estrutura de Arquivos Essenciais

Certifique-se de que estes arquivos estão no repositório:

```
api/
├── src/                 # Código fonte
├── tests/              # Testes automatizados
├── package.json        # Dependências e scripts
├── .env.example        # Exemplo de variáveis de ambiente
├── .gitignore          # Arquivos ignorados pelo Git
├── render.yaml         # Configuração do Render
├── README.md           # Documentação da API
├── DEPLOY.md           # Este guia de deploy
└── Dockerfile          # Container Docker (opcional)
```

## 🌐 Deploy no Render

### Método 1: Deploy Automático via GitHub (Recomendado)

#### 1. Conectar GitHub ao Render

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte sua conta GitHub se ainda não conectou
4. Selecione o repositório `grifo-api`
5. Configure os seguintes campos:

```yaml
Name: grifo-api
Environment: Node
Region: Oregon (US West)
Branch: main
Root Directory: (deixe vazio se a API está na raiz)
Build Command: npm install
Start Command: npm start
```

#### 2. Configurar Variáveis de Ambiente

No painel do Render, vá em **Environment** e adicione:

```bash
# Aplicação
NODE_ENV=production
PORT=10000
API_VERSION=1.0.0
APP_NAME=Grifo API
APP_URL=https://grifo-api.onrender.com

# Segurança
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Supabase
SUPABASE_URL=https://fsvwifbvehdhlufauahj.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# CORS
CORS_ORIGIN=https://grifo-portal.vercel.app,https://grifo-app.expo.dev

# Rate Limiting
RATE_LIMIT=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

#### 3. Deploy

1. Clique em **"Create Web Service"**
2. O Render fará o build e deploy automaticamente
3. Aguarde o processo completar (5-10 minutos)
4. Acesse a URL fornecida para testar

### Método 2: Deploy via render.yaml

Se você tem o arquivo `render.yaml` configurado:

1. No Render Dashboard, clique em **"New +"** → **"Blueprint"**
2. Conecte o repositório GitHub
3. O Render lerá automaticamente o `render.yaml`
4. Configure apenas as variáveis de ambiente sensíveis

## 🔄 CI/CD Automático

### Auto-Deploy

O Render monitora automaticamente a branch `main`. Qualquer push acionará:

1. **Build automático** com `npm install`
2. **Testes** (se configurados)
3. **Deploy** com `npm start`
4. **Health Check** em `/api/health`

### Configuração de Branches

```yaml
# render.yaml
services:
  - type: web
    name: grifo-api
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: npm start
    autoDeploy: true
    branch: main  # Branch monitorada
```

### Preview Deploys

Para branches de feature:

```yaml
previewsEnabled: true
previewsExpireAfterDays: 7
```

## 🧪 Testes Automatizados

### Configurar GitHub Actions (Opcional)

Crie `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
      env:
        NODE_ENV: test
        JWT_SECRET: test_secret
```

## 📊 Monitoramento

### Health Check

O Render monitora automaticamente:
- **Endpoint**: `/api/health`
- **Intervalo**: 30 segundos
- **Timeout**: 10 segundos

### Logs

Acesse logs em tempo real:
```bash
# Via Render Dashboard
Dashboard → Seu Serviço → Logs

# Via Render CLI
render logs -s grifo-api
```

### Métricas

- **CPU/Memory**: Dashboard do Render
- **Response Time**: Health check endpoint
- **Error Rate**: Logs de aplicação

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Build Falha
```bash
# Verificar package.json
npm install  # Local

# Verificar Node.js version
node --version
```

#### 2. Variáveis de Ambiente
```bash
# Verificar se todas estão configuradas
curl https://grifo-api.onrender.com/api/health
```

#### 3. Conexão Supabase
```bash
# Testar endpoint de auth
curl -X POST https://grifo-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Comandos Úteis

```bash
# Restart do serviço
render services restart grifo-api

# Ver status
render services list

# Deploy manual
render deploy -s grifo-api
```

## 🔐 Segurança

### Variáveis Sensíveis

❌ **NUNCA** commite:
- `.env`
- Chaves de API
- Senhas
- Tokens JWT

✅ **SEMPRE** use:
- `.env.example` (sem valores reais)
- Variáveis de ambiente do Render
- Secrets do GitHub (para CI/CD)

### HTTPS

O Render fornece HTTPS automaticamente:
- Certificado SSL gratuito
- Renovação automática
- Redirecionamento HTTP → HTTPS

## 📚 Recursos Adicionais

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Custom Domains](https://render.com/docs/custom-domains)

## 🆘 Suporte

Em caso de problemas:

1. **Logs**: Verifique logs no Dashboard
2. **Health Check**: Teste `/api/health`
3. **Variáveis**: Confirme configuração
4. **GitHub**: Verifique último commit
5. **Render Status**: [status.render.com](https://status.render.com)

---

**✅ API pronta para produção!**

Após seguir este guia, sua API estará:
- 🚀 Deployada no Render
- 🔄 Com CI/CD automático
- 📊 Monitorada e logada
- 🔐 Segura e configurada
- 📱 Pronta para Portal Web e App Mobile