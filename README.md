# Grifo API Backend

API backend para o sistema de vistorias Grifo, desenvolvida em Node.js com TypeScript e Express.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **TypeScript** - Linguagem tipada
- **Express** - Framework web
- **Firebase Admin SDK** - Autenticação e banco de dados
- **Winston** - Sistema de logs
- **Swagger** - Documentação da API

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações (Firebase, Logger, Swagger)
├── middleware/      # Middlewares de autenticação
├── routes/          # Rotas da API
├── types/           # Definições de tipos TypeScript
├── utils/           # Utilitários (validação, resposta)
└── index.ts         # Arquivo principal
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.development` baseado no `.env.example`:

```env
NODE_ENV=development
PORT=3000
FIREBASE_PROJECT_ID=seu-projeto-id
DEV_TOKEN=seu-token-dev
```

### Instalação

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start
```

## 📚 API Endpoints

### Público
- `GET /health` - Status da API

### Protegidos (Requer autenticação)
- `GET /api/v1/dashboard` - Estatísticas do dashboard
- `GET /api/v1/inspections` - Lista de inspeções
- `POST /api/v1/inspections` - Criar inspeção
- `GET /api/v1/properties` - Lista de propriedades
- `GET /api/v1/users` - Lista de usuários
- `POST /api/v1/sync` - Sincronização de dados
- `GET /api/v1/contestations` - Contestações
- `GET /api/v1/companies` - Empresas

## 🔐 Autenticação

A API utiliza Firebase Authentication com ID Tokens:

```javascript
// Cabeçalho de autorização
Authorization: Bearer <ID_TOKEN>
```

## 🌐 Deploy

### Render.com

O projeto está configurado para deploy automático no Render.com através do arquivo `render.yaml`.

### Variáveis de Ambiente de Produção

- `NODE_ENV=production`
- `PORT=10000`
- `FIREBASE_PROJECT_ID`
- Credenciais do Firebase Admin SDK

## 📝 Logs

Os logs são gerenciados pelo Winston e salvos em:
- `logs/error.log` - Apenas erros
- `logs/combined.log` - Todos os logs
- `logs/all.log` - Backup completo

## 🔍 Documentação da API

A documentação Swagger está disponível em:
- Desenvolvimento: `http://localhost:3000/api-docs`
- Produção: `https://grifo-api.onrender.com/api-docs`

## 🛠️ Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run dev:win` - Executa em modo desenvolvimento (Windows)
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Executa em modo produção
- `npm run start:win` - Executa em modo produção (Windows)

## 📞 Suporte

Para dúvidas ou problemas, consulte os logs da aplicação ou verifique o status dos endpoints através do health check.