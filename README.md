# Grifo API Backend

API backend para o aplicativo Grifo Vistorias, desenvolvida com Node.js, Express e TypeScript.

## Estrutura do Projeto

```
grifo-api-backend/
├── src/
│   ├── index.ts           # Ponto de entrada da aplicação
│   └── routes/            # Rotas da API
│       ├── contestation.ts # Rotas para contestação de vistorias
│       ├── dashboard.ts   # Rotas para estatísticas do dashboard
│       ├── health.ts      # Rota de health check
│       ├── inspections.ts # Rotas para gerenciamento de vistorias
│       ├── properties.ts  # Rotas para gerenciamento de imóveis
│       └── sync.ts        # Rota para sincronização de dados offline
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

A API estará disponível em `https://grifo-api.onrender.com`.