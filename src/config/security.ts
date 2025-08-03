import helmet from 'helmet';
// import { rateLimit } from 'express-rate-limit'; // Temporariamente desabilitado
import { Express, Request as ExpressRequest, Response, NextFunction } from 'express';
import cors from 'cors';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './firebase';
import logger from './logger';
import DOMPurify from 'isomorphic-dompurify';
import admin from 'firebase-admin';

// Extend the Express Request interface to include user property
export interface Request extends ExpressRequest {
  user?: { 
    id: string; 
    role: string; 
    empresaId: string; // Adicionar empresaId
  };
}

// Middleware para verificar se o usuário tem empresaId válido
export const requireEmpresa = (req: Request, res: Response, next: NextFunction) => {
  const empresaId = req.user?.empresaId;
  
  if (!empresaId || empresaId === 'default') {
    logger.warn(`Acesso negado - usuário ${req.user?.id} sem empresa associada`);
    return res.status(403).json({ 
      success: false,
      error: 'Usuário sem empresa associada. Entre em contato com o administrador.' 
    });
  }
  
  // Empresa validada com sucesso
  next();
};

import 'dotenv/config';

// Configuração do CORS
const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '';
const allowedOrigins = corsOriginsEnv.split(',').map(origin => origin.trim()).filter(origin => origin.length > 0);

// Log das origens permitidas para debug
logger.info(`Origens CORS permitidas: ${allowedOrigins.join(', ')}`);

export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Permitir requisições sem origin (health checks, Postman, etc.)
    if (!origin) {
      logger.debug('Requisição sem origin permitida (health check/Postman)');
      return callback(null, true);
    }
    
    // Verificar se a origem está na lista de origens permitidas
    if (allowedOrigins.length === 0) {
      logger.warn('Nenhuma origem CORS configurada - permitindo todas');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      logger.debug(`Origem CORS permitida: ${origin}`);
      callback(null, true);
    } else {
      logger.error(`Tentativa de acesso CORS de origem não permitida: ${origin}`);
      logger.error(`Origens permitidas: ${allowedOrigins.join(', ')}`);
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
};

// Configuração do rate limiter geral (temporariamente desabilitado)
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos por padrão
//   limit: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requisições por janela por padrão
//   standardHeaders: 'draft-8',
//   legacyHeaders: false,
//   message: {
//     success: false,
//     error: 'Muitas requisições, por favor tente novamente mais tarde.'
//   }
// });

// ==================== JWT CONFIGURATION ====================

// Configurações JWT
const JWT_SECRET = process.env.JWT_SECRET || 'grifo_default_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Interface para payload JWT
interface JWTPayload {
  uid: string;
  email?: string;
  role: string;
  empresaId: string;
  iat?: number;
  exp?: number;
}

// Interface para refresh token
interface RefreshTokenPayload {
  uid: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

/**
 * Gera um token JWT personalizado
 */
export const generateJWT = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    } as jwt.SignOptions);
    
    // JWT gerado com sucesso
    return token;
  } catch (error) {
    logger.error('Erro ao gerar JWT:', error);
    throw new Error('Falha ao gerar token de acesso');
  }
};

/**
 * Gera um refresh token
 */
export const generateRefreshToken = (uid: string): string => {
  try {
    const tokenId = crypto.randomBytes(32).toString('hex');
    const payload: RefreshTokenPayload = {
      uid,
      tokenId
    };
    
    const refreshToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN
    } as jwt.SignOptions);
    
    // Refresh token gerado com sucesso
    return refreshToken;
  } catch (error) {
    logger.error('Erro ao gerar refresh token:', error);
    throw new Error('Falha ao gerar refresh token');
  }
};

/**
 * Verifica e decodifica um JWT
 */
export const verifyJWT = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // JWT verificado com sucesso
    return decoded;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('JWT expirado');
      } else if (error.name === 'JsonWebTokenError') {
        logger.warn('JWT inválido');
      }
    } else {
      logger.error('Erro ao verificar JWT:', error);
    }
    return null;
  }
};

/**
 * Verifica um refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as RefreshTokenPayload;
    
    // Refresh token verificado com sucesso
    return decoded;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('Refresh token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        logger.warn('Refresh token inválido');
      }
    } else {
      logger.error('Erro ao verificar refresh token:', error);
    }
    return null;
  }
};

/**
 * Gera um par de tokens (access + refresh)
 */
export const generateTokenPair = (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
  const accessToken = generateJWT(payload);
  const refreshToken = generateRefreshToken(payload.uid);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN,
    tokenType: 'Bearer'
  };
};

/**
 * Middleware para autenticação JWT (alternativa ao Firebase)
 */
export const jwtAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Bypass para rotas públicas
  if (req.originalUrl.includes('/api/health') || req.originalUrl.includes('/api/auth')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação ausente. Inclua o header Authorization: Bearer <token>' 
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Formato de token inválido. Use: Authorization: Bearer <token>' 
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token.trim() === '') {
    return res.status(401).json({ 
      success: false, 
      error: 'Token vazio. Forneça um token JWT válido.' 
    });
  }

  try {
    const decoded = verifyJWT(token);
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido ou expirado. Faça login novamente.' 
      });
    }

    // Anexar dados do usuário à requisição
    req.user = {
      id: decoded.uid,
      role: decoded.role,
      empresaId: decoded.empresaId
    };

    // Usuário autenticado via JWT
    return next();

  } catch (error: unknown) {
    logger.error('Erro durante a verificação do JWT:', error);
    return res.status(401).json({ 
      success: false, 
      error: 'Token inválido. Faça login novamente.' 
    });
  }
};

/**
 * Extrai informações do token sem verificar
 */
export const decodeJWTWithoutVerification = (token: string): Record<string, unknown> | null => {
  try {
    const decoded = jwt.decode(token);
    if (typeof decoded === 'object' && decoded !== null) {
      return decoded as Record<string, unknown>;
    }
    return null;
  } catch (error) {
    logger.error('Erro ao decodificar JWT:', error);
    return null;
  }
};

/**
 * Verifica se um token está próximo do vencimento
 */
export const isTokenNearExpiry = (token: string, thresholdMinutes: number = 5): boolean => {
  try {
    const decoded = jwt.decode(token) as Record<string, unknown> | null;
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = (decoded.exp as number) - now;
    const thresholdSeconds = thresholdMinutes * 60;
    
    return timeUntilExpiry <= thresholdSeconds;
  } catch (error) {
    return true;
  }
};

// ==================== END JWT CONFIGURATION ====================

// Rate limiter mais restritivo para autenticação (temporariamente desabilitado)
// const authLimiter = rateLimit({
//   windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
//   limit: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20'), // 20 tentativas de auth por janela
//   standardHeaders: 'draft-8',
//   legacyHeaders: false,
//   message: {
//     success: false,
//     error: 'Muitas tentativas de autenticação. Aguarde 15 minutos.'
//   }
// });

// Middleware de sanitização de entrada
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitizar body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitizar query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query) as any;
  }
  
  next();
};

// Função auxiliar para sanitizar objetos recursivamente
const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj.trim());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitizar a chave também
      const cleanKey = DOMPurify.sanitize(key);
      sanitized[cleanKey] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

// Middleware de log de auditoria
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log apenas para operações sensíveis
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      logger.info(`Audit: ${req.method} ${req.originalUrl}`, {
        userId: req.user?.id,
        empresaId: req.user?.empresaId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Função para configurar os middlewares de segurança
export const configureSecurityMiddleware = (app: Express): void => {
  // Aplicar CORS
  app.use(cors(corsOptions));
  
  // Aplicar Helmet para segurança de cabeçalhos HTTP
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
  
  // Aplicar rate limiting para todas as rotas (temporariamente desabilitado)
  // app.use(limiter);
  
  // Rate limiting específico para rotas de autenticação (temporariamente desabilitado)
  // app.use('/api/auth', authLimiter);
  
  // Middleware de sanitização
  app.use(sanitizeInput);
  
  // Middleware de auditoria
  app.use(auditLogger);
  
  // Configurações adicionais de segurança
  app.disable('x-powered-by'); // Remover cabeçalho X-Powered-By
  
  // Middleware para detectar tentativas de injeção
  app.use((req: Request, res: Response, next: NextFunction) => {
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /\bselect\b.*\bfrom\b/gi,
      /\bunion\b.*\bselect\b/gi,
      /\bdrop\b.*\btable\b/gi
    ];
    
    const checkForInjection = (obj: any): boolean => {
      if (typeof obj === 'string') {
        return suspiciousPatterns.some(pattern => pattern.test(obj));
      }
      
      if (Array.isArray(obj)) {
        return obj.some(checkForInjection);
      }
      
      if (obj && typeof obj === 'object') {
        return Object.values(obj).some(checkForInjection);
      }
      
      return false;
    };
    
    if (checkForInjection(req.body) || checkForInjection(req.query)) {
      logger.warn(`Tentativa de injeção detectada`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        query: req.query
      });
      
      return res.status(400).json({
        success: false,
        error: 'Entrada inválida detectada'
      });
    }
    
    next();
  });
};

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Tentativa de acesso sem token de autenticação ou mal formatado.');
    return res.status(401).send('Token ausente ou mal formatado.');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid } = decodedToken;

    // Buscar dados do usuário no Firestore para obter role e empresaId
    if (!db) {
      logger.error('Database não inicializado');
      return res.status(500).send('Erro interno do servidor.');
    }
    const userDoc = await db.collection('usuarios').doc(uid).get();
    if (!userDoc.exists) {
      logger.error(`Usuário não encontrado no Firestore: ${uid}`);
      return res.status(403).send('Usuário não autorizado.');
    }

    const userData = userDoc.data();
    const role = userData?.role || 'user'; // 'user' como role padrão
    const empresaId = userData?.empresaId;

    if (!empresaId) {
      logger.error(`empresaId não encontrado para o usuário: ${uid}`);
      return res.status(403).send('Usuário sem empresa associada.');
    }

    // Montar o objeto de usuário para a requisição
    req.user = {
      id: uid,
      role: role,
      empresaId: empresaId,
    };

    // Token Firebase verificado com sucesso
    next();
  } catch (err) {
    logger.error('Erro ao verificar token Firebase:', err);
    return res.status(403).send('Token inválido ou expirado.');
  }
}