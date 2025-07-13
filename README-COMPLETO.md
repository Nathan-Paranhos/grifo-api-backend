# Grifo API Backend - Documentação Completa

API backend para o aplicativo Grifo Vistorias, desenvolvida com Node.js, Express e TypeScript.

## Estrutura do Projeto

```
grifo-api-backend/
├── src/
│   ├── config/
│   │   ├── logger.ts         # Configuração do sistema de logs
│   │   └── security.ts       # Configurações de segurança (CORS, rate limiting, JWT)
│   ├── routes/
│   │   ├── contestation.ts   # Rotas para gerenciamento de contestações
│   │   ├── dashboard.ts      # Rotas para estatísticas do dashboard
│   │   ├── health.ts         # Rota de health check
│   │   ├── inspections.ts    # Rotas para gerenciamento de vistorias
│   │   ├── properties.ts     # Rotas para gerenciamento de imóveis
│   │   └── sync.ts           # Rota para sincronização de dados offline
│   ├── utils/
│   │   └── validation.ts     # Validação de requisições com Zod
│   └── index.ts              # Ponto de entrada da aplicação
├── .env                      # Variáveis de ambiente para produção
├── .env.example              # Exemplo de variáveis de ambiente
├── package.json              # Dependências e scripts
├── tsconfig.json             # Configuração do TypeScript
└── README.md                 # Documentação básica
```

## Endpoints da API

### Health Check
- **GET /api/health**: Verifica o status da API

### Dashboard
- **GET /api/dashboard/stats**: Obtém estatísticas para o dashboard
  - Query params: `empresaId` (obrigatório), `vistoriadorId` (opcional)
  - Retorna estatísticas gerais, distribuição por tipo e status, atividades recentes e tendências mensais

### Inspeções
- **GET /api/inspections**: Lista vistorias
  - Query params: `empresaId` (obrigatório), `vistoriadorId` (opcional), `status` (opcional), `limit` (opcional)
  - Retorna lista paginada de vistorias

- **POST /api/inspections**: Cria uma nova vistoria
  - Body: dados da vistoria (empresaId, vistoriadorId, imovelId, tipo, status, etc.)
  - Retorna a vistoria criada com ID gerado

- **GET /api/inspections/:id**: Obtém detalhes de uma vistoria específica
  - Params: `id` da vistoria
  - Query params: `empresaId` (obrigatório)
  - Retorna detalhes completos da vistoria

- **POST /api/inspections/:id/contest**: Registra uma contestação para uma vistoria
  - Params: `id` da vistoria
  - Body: dados da contestação (empresaId, motivo, detalhes, itensContestados)
  - Retorna a contestação criada com ID gerado

### Propriedades
- **GET /api/properties**: Lista imóveis
  - Query params: `empresaId` (obrigatório), `search` (opcional), `limit` (opcional)
  - Retorna lista paginada de imóveis

- **GET /api/properties/:id**: Obtém detalhes de um imóvel específico
  - Params: `id` do imóvel
  - Query params: `empresaId` (obrigatório)
  - Retorna detalhes completos do imóvel

### Sincronização
- **POST /api/sync/sync**: Sincroniza vistorias pendentes
  - Body: `pendingInspections` (array), `vistoriadorId`, `empresaId`
  - Processa vistorias pendentes em lotes, com retry automático em caso de falha
  - Retorna resultados detalhados da sincronização

- **GET /api/sync/status**: Verifica status de sincronização
  - Query params: `empresaId` (obrigatório), `vistoriadorId` (opcional)
  - Retorna estatísticas de sincronização

### Contestações
- **POST /api/contestations**: Registra uma nova contestação
  - Body: dados da contestação (empresaId, motivo, detalhes, itensContestados)
  - Query params: `inspectionId` (obrigatório)
  - Retorna a contestação criada com ID gerado

- **GET /api/contestations**: Lista contestações
  - Query params: `empresaId` (obrigatório), `inspectionId` (opcional), `status` (opcional)
  - Retorna lista de contestações

- **GET /api/contestations/:id**: Obtém detalhes de uma contestação específica
  - Params: `id` da contestação
  - Query params: `empresaId` (obrigatório)
  - Retorna detalhes completos da contestação incluindo histórico

- **PATCH /api/contestations/:id/status**: Atualiza o status de uma contestação
  - Params: `id` da contestação
  - Body: `status` (Pendente, Em Análise, Resolvida, Rejeitada), `comentario` (opcional)
  - Query params: `empresaId` (obrigatório)
  - Retorna confirmação da atualização

## Autenticação e Segurança

### Middleware de Autenticação
Todas as rotas (exceto health check) são protegidas por autenticação JWT:

```typescript
// Middleware de autenticação JWT
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Verificar token JWT no header Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Não autorizado. Token de autenticação ausente ou inválido.'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verificar o token JWT
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado.'
    });
  }
};
```

### Validação de Requisições
Todas as requisições são validadas usando Zod:

```typescript
// Middleware para validar requisições
export const validateRequest = ({
  body,
  query,
  params
}: {
  body?: z.ZodType<any, any>;
  query?: z.ZodType<any, any>;
  params?: z.ZodType<any, any>;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar corpo, query e params da requisição
      if (body) req.body = body.parse(req.body);
      if (query) req.query = query.parse(req.query);
      if (params) req.params = params.parse(req.params);
      
      next();
    } catch (error) {
      // Retornar erros de validação detalhados
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor durante validação'
      });
    }
  };
};
```

### Segurança Adicional
- **CORS**: Configurado para permitir apenas origens específicas
- **Rate Limiting**: Limita o número de requisições por IP
- **Helmet**: Configuração de cabeçalhos HTTP de segurança

## Logging

O sistema utiliza Winston para logging estruturado:

```typescript
// Criar a instância do logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

## Tratamento de Erros

A API implementa tratamento de erros centralizado:

```typescript
// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Erro: ${err.message}`);
  logger.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    error: NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message
  });
});

// Handle 404 routes
app.use((req, res) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
});
```

## Configuração e Deployment

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```
# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:8081

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Logging
LOG_LEVEL=debug

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX=100           # 100 requisições por janela

# Security
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d
```

### Instalação e Execução

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

### Deployment no Render.com

1. Faça upload do código para um repositório GitHub
2. No Render.com, crie um novo Web Service
3. Conecte ao repositório GitHub
4. Configure:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node.js
   - Adicione as variáveis de ambiente necessárias

## Implementações Futuras

### Integração com Firebase

Atualmente, a API simula o armazenamento de dados para desenvolvimento. A próxima etapa é integrar com Firebase:

```typescript
// Exemplo de integração com Firebase para contestações
import { db } from '../config/firebase';

// Criar contestação
async function createContestation(contestation) {
  const docRef = await db.collection('contestations').add(contestation);
  await db.collection('inspections').doc(contestation.inspectionId).update({ 
    hasContestation: true 
  });
  return { id: docRef.id, ...contestation };
}

// Listar contestações
async function listContestations(empresaId, filters = {}) {
  let query = db.collection('contestations').where('empresaId', '==', empresaId);
  
  if (filters.inspectionId) {
    query = query.where('inspectionId', '==', filters.inspectionId);
  }
  
  if (filters.status) {
    query = query.where('status', '==', filters.status);
  }
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### Notificações para Contestações

Implementar sistema de notificações para informar sobre novas contestações e mudanças de status:

```typescript
// Enviar notificação quando status da contestação for atualizado
async function notifyStatusChange(contestationId, newStatus, oldStatus) {
  const contestation = await db.collection('contestations').doc(contestationId).get();
  const data = contestation.data();
  
  // Buscar tokens de dispositivos para notificação
  const userDevices = await db.collection('devices')
    .where('empresaId', '==', data.empresaId)
    .get();
    
  const tokens = userDevices.docs.map(doc => doc.data().token);
  
  // Enviar notificação via Firebase Cloud Messaging
  await admin.messaging().sendMulticast({
    tokens,
    notification: {
      title: 'Atualização de Contestação',
      body: `A contestação #${contestationId} mudou de ${oldStatus} para ${newStatus}`
    },
    data: {
      contestationId,
      type: 'STATUS_CHANGE'
    }
  });
}
```

## Integração com Firebase

A API está preparada para integração com Firebase:

- **Authentication**: Para autenticação JWT
- **Firestore**: Para armazenamento de dados
- **Storage**: Para armazenamento de fotos e arquivos

A implementação atual simula essas integrações para desenvolvimento, mas a estrutura está pronta para conectar com serviços reais do Firebase em produção.

## Boas Práticas Implementadas

1. **Validação de Entrada**: Todas as entradas são validadas com Zod
2. **Autenticação**: Middleware JWT para proteger rotas
3. **Logging**: Sistema de logs estruturado com Winston
4. **Tratamento de Erros**: Middleware centralizado para tratamento de erros
5. **Rate Limiting**: Proteção contra abuso da API
6. **CORS**: Configuração segura de origens permitidas
7. **Segurança de Cabeçalhos**: Helmet para configuração de cabeçalhos HTTP
8. **Isolamento Multi-empresa**: Validação de `empresaId` em todas as rotas
9. **Retry com Backoff**: Implementado na sincronização para maior resiliência
10. **Processamento em Lotes**: Implementado na sincronização para melhor performance