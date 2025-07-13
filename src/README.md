# Grifo API Backend - Documentação de Código

Este documento descreve a estrutura e implementação do código da API backend do Grifo Vistorias.

## Estrutura de Diretórios

```
src/
├── config/
│   ├── logger.ts         # Configuração do sistema de logs
│   └── security.ts       # Configurações de segurança (CORS, rate limiting, JWT)
├── routes/
│   ├── contestation.ts   # Rotas para gerenciamento de contestações
│   ├── dashboard.ts      # Rotas para estatísticas do dashboard
│   ├── health.ts         # Rota de health check
│   ├── inspections.ts    # Rotas para gerenciamento de vistorias
│   ├── properties.ts     # Rotas para gerenciamento de imóveis
│   └── sync.ts           # Rota para sincronização de dados offline
├── utils/
│   └── validation.ts     # Validação de requisições com Zod
└── index.ts              # Ponto de entrada da aplicação
```

## Módulos Principais

### 1. Configuração (`config/`)

#### Logger (`logger.ts`)

Implementa um sistema de logs estruturado usando Winston:

- Níveis de log personalizados: error, warn, info, http, debug
- Formato de timestamp padronizado
- Saída colorida no console
- Arquivos de log separados para erros e logs combinados
- Rotação de arquivos de log por tamanho

#### Segurança (`security.ts`)

Implementa configurações de segurança:

- CORS: Configuração de origens permitidas
- Rate Limiting: Proteção contra abuso da API
- Helmet: Configuração de cabeçalhos HTTP de segurança
- Middleware de autenticação JWT: Validação de tokens

### 2. Rotas (`routes/`)

#### Health Check (`health.ts`)

Rota simples para verificar o status da API:

- GET /api/health: Retorna status da API e informações básicas

#### Dashboard (`dashboard.ts`)

Rota para obter estatísticas do dashboard:

- GET /api/dashboard/stats: Retorna estatísticas gerais, distribuição por tipo e status, atividades recentes e tendências mensais
- Suporta filtragem por empresa e vistoriador

#### Inspeções (`inspections.ts`)

Rotas para gerenciamento de vistorias:

- GET /api/inspections: Lista vistorias com filtragem e paginação
- POST /api/inspections: Cria uma nova vistoria
- GET /api/inspections/:id: Obtém detalhes de uma vistoria específica
- POST /api/inspections/:id/contest: Registra uma contestação para uma vistoria específica

#### Propriedades (`properties.ts`)

Rotas para gerenciamento de imóveis:

- GET /api/properties: Lista imóveis com filtragem e paginação
- GET /api/properties/:id: Obtém detalhes de um imóvel específico

#### Sincronização (`sync.ts`)

Rotas para sincronização de dados offline:

- POST /api/sync/sync: Sincroniza vistorias pendentes com processamento em lotes e retry automático
- GET /api/sync/status: Verifica status de sincronização

#### Contestações (`contestation.ts`)

Rotas para gerenciamento de contestações de vistorias:

- POST /api/contestations: Registra uma nova contestação para uma vistoria
- GET /api/contestations: Lista contestações com filtragem por vistoria e status
- GET /api/contestations/:id: Obtém detalhes de uma contestação específica
- PATCH /api/contestations/:id/status: Atualiza o status de uma contestação

### 3. Utilitários (`utils/`)

#### Validação (`validation.ts`)

Implementa validação de requisições usando Zod:

- Esquemas de validação para parâmetros comuns, inspeções, sincronização e contestações
- Middleware para validar corpo, query e parâmetros de requisições
- Tratamento de erros de validação com mensagens detalhadas

### 4. Ponto de Entrada (`index.ts`)

Configura e inicia o servidor Express:

- Configuração de middleware (JSON, URL encoding, segurança)
- Registro de rotas
- Middleware de logging para requisições HTTP
- Tratamento centralizado de erros
- Tratamento de rotas não encontradas (404)
- Inicialização do servidor
- Tratamento de exceções não capturadas

## Padrões de Implementação

### Estrutura de Resposta

Todas as respostas seguem um formato padronizado:

```typescript
// Resposta de sucesso
{
  success: true,
  data: { ... },  // Dados da resposta
  message?: string // Mensagem opcional
}

// Resposta de erro
{
  success: false,
  error: string,   // Mensagem de erro
  details?: any    // Detalhes do erro (opcional)
}
```

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

### Logging

Utilização consistente de logs em diferentes níveis:

```typescript
// Exemplo de uso de logs
logger.debug(`Solicitação de propriedades para empresaId: ${empresaId}`);
logger.info(`Retornando ${filteredProperties.length} propriedades`);
logger.warn('Tentativa de acessar propriedade sem fornecer empresaId');
logger.error(`Erro ao buscar propriedades: ${error}`);
```

### Tratamento de Erros

Tratamento consistente de erros em todas as rotas:

```typescript
try {
  // Lógica da rota
} catch (error) {
  logger.error(`Erro ao processar requisição: ${error}`);
  return res.status(500).json({
    success: false,
    error: 'Erro ao processar a solicitação'
  });
}
```

### Isolamento Multi-empresa

Validação de `empresaId` em todas as rotas:

```typescript
if (!empresaId) {
  logger.warn('Tentativa de acessar recurso sem fornecer empresaId');
  return res.status(400).json({
    success: false,
    error: 'empresaId é obrigatório'
  });
}
```

## Implementações Avançadas

### Retry com Backoff Exponencial

Implementado na sincronização para maior resiliência:

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries: number; initialDelay: number; maxDelay: number; factor: number }
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay, factor } = options;
  let lastError: Error = new Error('Unknown error occurred');
  let delay = initialDelay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        break;
      }
      
      logger.info('Operation failed, retrying', { 
        attempt: attempt + 1, 
        maxRetries, 
        delay,
        error: lastError.message 
      });
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Calcular próximo delay com backoff exponencial
      delay = Math.min(delay * factor, maxDelay);
    }
  }
  
  throw lastError;
};
```

### Processamento em Lotes

Implementado na sincronização para melhor performance:

```typescript
// Processar inspeções em lotes para melhor performance
const BATCH_SIZE = 5;
const batches = [];

for (let i = 0; i < pendingInspections.length; i += BATCH_SIZE) {
  batches.push(pendingInspections.slice(i, i + BATCH_SIZE));
}

logger.info('Processing in batches', { batchCount: batches.length, batchSize: BATCH_SIZE });

// Processar cada lote sequencialmente
for (const batch of batches) {
  // Processar inspeções do lote em paralelo para melhor performance
   const batchPromises = batch.map(async (inspection: any) => {
    // Processamento de cada inspeção
  });
  
  // Aguardar todas as promessas do lote
  const batchResults = await Promise.all(batchPromises);
}
```

### Medição de Performance

Utilitário para medir performance de operações:

```typescript
const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: any
): Promise<T> => {
  const startTime = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - startTime;
    logger.info(`Performance: ${operation} completed in ${durationMs}ms`, { ...metadata });
    return result;
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Performance: ${operation} failed in ${durationMs}ms`, { ...metadata, error: errorMessage });
    throw error;
  }
};
```

## Implementações Futuras

### Integração com Notificações

Implementar sistema de notificações para contestações:

```typescript
/**
 * @desc Envia notificação quando uma contestação é registrada ou atualizada
 */
async function sendContestationNotification(contestation: any, type: 'new' | 'update') {
  try {
    // Buscar tokens de dispositivos para notificação
    // Em produção: const userDevices = await db.collection('devices').where('empresaId', '==', contestation.empresaId).get();
    // const tokens = userDevices.docs.map(doc => doc.data().token);
    
    const notificationTitle = type === 'new' 
      ? 'Nova Contestação Registrada' 
      : 'Contestação Atualizada';
      
    const notificationBody = type === 'new'
      ? `Uma nova contestação foi registrada para a vistoria ${contestation.inspectionId}`
      : `A contestação da vistoria ${contestation.inspectionId} foi atualizada para ${contestation.status}`;
    
    logger.info(`Enviando notificação: ${notificationTitle}`, { contestationId: contestation.id });
    
    // Em produção: await admin.messaging().sendMulticast({
    //   tokens,
    //   notification: {
    //     title: notificationTitle,
    //     body: notificationBody
    //   },
    //   data: {
    //     contestationId: contestation.id,
    //     type: type === 'new' ? 'NEW_CONTESTATION' : 'CONTESTATION_UPDATE'
    //   }
    // });
    
    return true;
  } catch (error) {
    logger.error(`Erro ao enviar notificação: ${error}`);
    return false;
  }
}
```

### Relatórios de Contestações

```typescript
/**
 * @route GET /api/reports/contestations
 * @desc Gera relatório de contestações por período
 */
router.get('/contestations',
  authMiddleware,
  validateRequest({ query: reportQuerySchema }),
  async (req: Request, res: Response) => {
    try {
      const { empresaId, startDate, endDate, format = 'json' } = req.query;
      
      logger.debug(`Gerando relatório de contestações para empresa ${empresaId}`);
      
      // Buscar contestações no período
      // Em produção: implementar consulta ao Firestore com filtros de data
      
      // Gerar estatísticas
      const stats = {
        total: 0,
        porStatus: { Pendente: 0, 'Em Análise': 0, Resolvida: 0, Rejeitada: 0 },
        tempoMedioResolucao: 0,
        motivosMaisComuns: []
      };
      
      // Formatar saída de acordo com o formato solicitado (json, csv, pdf)
      
      return res.status(200).json({
        success: true,
        data: { stats, contestations: [] }
      });
    } catch (error) {
      logger.error(`Erro ao gerar relatório: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Erro ao gerar relatório de contestações'
      });
    }
  }
);
```

## Integração com Firebase

A API está preparada para integração com Firebase:

- **Authentication**: Para autenticação JWT
- **Firestore**: Para armazenamento de dados
- **Storage**: Para armazenamento de fotos e arquivos

A implementação atual simula essas integrações para desenvolvimento, mas a estrutura está pronta para conectar com serviços reais do Firebase em produção.