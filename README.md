# Grifo API Backend

API backend para o aplicativo Grifo Vistorias, desenvolvida com Node.js, Express e TypeScript. Integrada com Firebase Authentication para autenticação segura.

## Estrutura do Projeto

```
grifo-api-backend/
├── src/
│   ├── index.ts           # Ponto de entrada da aplicação
│   ├── config/            # Configurações da aplicação
│   │   ├── firebaseAdmin.ts # Configuração do Firebase Admin SDK
│   │   ├── logger.ts      # Configuração de logs
│   │   └── security.ts    # Middlewares de segurança
│   ├── routes/            # Rotas da API
│   │   ├── contestation.ts # Rotas para contestação de vistorias
│   │   ├── dashboard.ts   # Rotas para estatísticas do dashboard
│   │   ├── health.ts      # Rota de health check
│   │   ├── inspections.ts # Rotas para gerenciamento de vistorias
│   │   ├── properties.ts  # Rotas para gerenciamento de imóveis
│   │   └── sync.ts        # Rota para sincronização de dados offline
│   └── utils/             # Utilitários
│       └── validation.ts  # Validação de requisições
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Endpoints da API

- **GET /api/health**: Verifica o status da API
- **GET /api/dashboard/stats**: Obtém estatísticas para o dashboard
- **GET /api/inspections**: Lista vistorias
- **POST /api/inspections**: Cria uma nova vistoria
- **GET /api/properties**: Lista imóveis
- **POST /api/sync**: Sincroniza vistorias pendentes
- **POST /api/contestations**: Registra uma contestação para uma vistoria
- **GET /api/contestations**: Lista contestações
- **GET /api/contestations/:id**: Obtém detalhes de uma contestação
- **PATCH /api/contestations/:id/status**: Atualiza o status de uma contestação

## Requisitos

- Node.js 14+
- npm ou yarn

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev

# Compilar para produção
npm run build

# Iniciar em modo produção
npm start
```

## Desenvolvimento

A API estará disponível em `http://localhost:3000`.

## Deployment

Esta API pode ser facilmente implantada no Render.com:

1. Faça upload do código para um repositório GitHub
2. No Render.com, crie um novo Web Service
3. Conecte ao repositório GitHub
4. Configure:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node.js
5. Configure as variáveis de ambiente necessárias (veja abaixo)

A API estará disponível em `https://grifo-api.onrender.com`.

## Autenticação

A API suporta dois métodos de autenticação:

1. **Firebase Authentication**: Tokens JWT gerados pelo Firebase Authentication são verificados usando o Firebase Admin SDK.
2. **JWT Padrão**: Como fallback, a API também suporta tokens JWT padrão.

### Fluxo de Autenticação

1. O cliente (app móvel ou portal web) autentica com Firebase Authentication
2. O cliente obtém um token ID do Firebase
3. O cliente inclui o token no cabeçalho de autorização das requisições: `Authorization: Bearer <token>`
4. A API verifica o token usando o Firebase Admin SDK
5. Se a verificação falhar, a API tenta verificar como um JWT padrão

### Variáveis de Ambiente

Crie os arquivos `.env.development` e `.env.production` com as seguintes variáveis:

```
# Server Configuration
PORT=3000
NODE_ENV=development|production

# CORS Configuration
CORS_ORIGIN=https://portal.grifovistorias.com,android-app://com.grifo.vistorias

# Firebase Configuration
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

# Firebase Admin SDK (para verificação de tokens)
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Security
JWT_SECRET=
JWT_EXPIRES_IN=1d
BYPASS_AUTH=false  # Definir como true apenas em desenvolvimento
```