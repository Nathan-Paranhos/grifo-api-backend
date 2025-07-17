import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Express, Request as ExpressRequest, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as firebase from './firebase';
import logger from './logger';

// Extend the Express Request interface to include user property
interface Request extends ExpressRequest {
  user?: { 
    id: string; 
    role: string; 
    empresaId: string; // Adicionar empresaId
  };
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

// Middleware de autenticação com Firebase Admin SDK
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Bypass para rotas públicas como health check
  if (req.originalUrl.includes('/api/health')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token de autenticação ausente ou mal formatado.' });
  }

  const token = authHeader.split(' ')[1];

  // Em desenvolvimento, verificar se é um token de desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    // Token de desenvolvimento
    if (token === process.env.DEV_TOKEN || token === 'dev-token-123') {
      req.user = {
        id: '4YDC4naAFnWituMELMef0Sd',
        role: 'admin',
        empresaId: 'empresa-teste-123'
      };
      logger.info('🧪 Usando token de desenvolvimento para testes');
      return next();
    }
    
    // Se BYPASS_AUTH estiver habilitado, pular autenticação
    if (process.env.BYPASS_AUTH === 'true') {
      req.user = {
        id: '4YDC4naAFnWituMELMef0Sd',
        role: 'admin',
        empresaId: 'empresa-teste-123'
      };
      logger.info('🔓 Autenticação bypassed para desenvolvimento');
      return next();
    }
  }

  try {
    if (!firebase.firebaseInitialized) {
      logger.error('Firebase Admin SDK não inicializado. A autenticação não pode prosseguir.');
      return res.status(500).json({ success: false, error: 'Erro interno no servidor: serviço de autenticação indisponível.' });
    }

    const decodedToken = await firebase.verifyFirebaseToken(token);
    if (!decodedToken) {
      return res.status(401).json({ success: false, error: 'Token inválido ou expirado.' });
    }

    // Extrair empresaId e outros dados do token
    const { uid, role, empresaId } = decodedToken;

    if (!empresaId) {
      logger.warn(`Token do usuário ${uid} não contém a claim 'empresaId'.`);
      return res.status(403).json({ success: false, error: 'Acesso negado: empresa não identificada.' });
    }

    // Anexar dados do usuário à requisição
    req.user = {
      id: uid,
      role: role || 'vistoriador', // Define um papel padrão se não houver
      empresaId: empresaId
    };

    return next();

  } catch (error: any) {
    logger.error('Erro durante a verificação do token:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, error: 'Token expirado.' });
    }
    return res.status(401).json({ success: false, error: 'Token inválido.' });
  }
};