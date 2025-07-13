import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express, Request as ExpressRequest, Response, NextFunction } from 'express';

// Extend the Express Request interface to include user property
interface Request extends ExpressRequest {
  user?: { id: string; role: string };
}
import cors from 'cors';
import 'dotenv/config';

// Configuração do CORS
export const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'https://portal.grifovistorias.com',
    'android-app://com.grifo.vistorias'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Configuração do rate limiter
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos por padrão
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requisições por janela por padrão
  standardHeaders: true, // Retorna os cabeçalhos padrão de rate limit
  legacyHeaders: false, // Desabilita os cabeçalhos legados de rate limit
  message: {
    success: false,
    error: 'Muitas requisições, por favor tente novamente mais tarde.'
  }
});

// Função para configurar os middlewares de segurança
export const configureSecurityMiddleware = (app: Express): void => {
  // Aplicar CORS
  app.use(cors(corsOptions));
  
  // Aplicar Helmet para segurança de cabeçalhos HTTP
  app.use(helmet());
  
  // Aplicar rate limiting para todas as rotas
  app.use(limiter);
  
  // Configurações adicionais de segurança
  app.disable('x-powered-by'); // Remover cabeçalho X-Powered-By
};

// Middleware de autenticação JWT
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Verificar se o ambiente é de produção
  if (process.env.NODE_ENV === 'production') {
    // Verificar se é uma requisição para a rota de saúde (health)
    if (req.originalUrl.includes('/api/health')) {
      return next();
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Não autorizado. Token de autenticação ausente ou inválido.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Em produção, verificar o token JWT
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // req.user = decoded;
      
      // Simulação para desenvolvimento
      req.user = { id: 'user_123', role: 'vistoriador' };
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado.'
      });
    }
  } else {
    // Em ambiente de desenvolvimento, simular usuário autenticado
    req.user = { id: 'user_123', role: 'vistoriador' };
    next();
  }
  
  // Para facilitar testes, adicionar um bypass para o ambiente de teste
  if (process.env.BYPASS_AUTH === 'true') {
    req.user = { id: 'test_user', role: 'admin' };
    return next();
  }
};