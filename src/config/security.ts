import helmet from 'helmet';
// import { rateLimit } from 'express-rate-limit'; // Temporariamente desabilitado
import { Express, Request as ExpressRequest, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as firebase from './firebase';
import { db } from './firebase';
import logger from './logger';
import validator from 'validator';
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
  
  logger.debug(`Empresa validada: ${empresaId} para usuário ${req.user?.id}`);
  next();
};

import 'dotenv/config';

// Configuração do CORS
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
      'https://portal.grifovistorias.com',
      'https://app.grifovistorias.com',
      'https://grifo-portal.netlify.app',
      'https://grifo-portal-v1.netlify.app',
      'https://visio-portal.netlify.app',
      'https://www.visio-portal.com',
      'https://www.grifo-portal.com',
      'android-app://com.grifo.vistorias',
      'https://grifo-api.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:4173'
    ];
    
    // Log da origin para debug
    logger.debug(`CORS check - Origin: ${origin}`);
    logger.debug(`CORS check - Allowed origins: ${allowedOrigins.join(', ')}`);
    
    // Permitir requisições sem origin (ex: Postman, aplicativos móveis)
    if (!origin) {
      logger.debug('CORS: Permitindo requisição sem origin');
      return callback(null, true);
    }
    
    // Verificar se a origin está na lista permitida
    if (allowedOrigins.includes(origin)) {
      logger.debug(`CORS: Origin permitida: ${origin}`);
      return callback(null, true);
    }
    
    // Permitir localhost em desenvolvimento
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      logger.debug(`CORS: Localhost permitido em desenvolvimento: ${origin}`);
      return callback(null, true);
    }
    
    // Permitir Netlify previews em desenvolvimento e produção
    if (origin.includes('netlify.app')) {
      logger.debug(`CORS: Netlify preview permitido: ${origin}`);
      return callback(null, true);
    }
    
    logger.error(`CORS BLOQUEADO para origin: ${origin}`);
    logger.error(`CORS - Origins permitidos: ${allowedOrigins.join(', ')}`);
    logger.error(`CORS - NODE_ENV: ${process.env.NODE_ENV}`);
    logger.error(`CORS - CORS_ORIGINS env: ${process.env.CORS_ORIGINS}`);
    return callback(new Error(`CORS policy: Origin ${origin} not allowed`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Para suportar navegadores legados
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
    
    logger.debug(`JWT gerado para usuário ${payload.uid}`);
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
    
    logger.debug(`Refresh token gerado para usuário ${uid}`);
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
    
    logger.debug(`JWT verificado para usuário ${decoded.uid}`);
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('JWT expirado');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('JWT inválido');
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
    
    logger.debug(`Refresh token verificado para usuário ${decoded.uid}`);
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Refresh token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('Refresh token inválido');
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

    logger.debug(`Usuário autenticado via JWT: ${decoded.uid}`);
    return next();

  } catch (error: any) {
    logger.error('Erro durante a verificação do JWT:', error);
    return res.status(401).json({ 
      success: false, 
      error: 'Token inválido. Faça login novamente.' 
    });
  }
};

/**
 * Extrai informações do token sem verificar (para debug)
 */
export const decodeJWTWithoutVerification = (token: string): any => {
  try {
    return jwt.decode(token);
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
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
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
    req.query = sanitizeObject(req.query);
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
    const sanitized: any = {};
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

// Middleware de autenticação com Firebase Admin SDK
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Bypass para rotas públicas como health check
  if (req.originalUrl.includes('/api/health')) {
    return next();
  }

  // Bypass de autenticação para desenvolvimento/teste
  if (process.env.BYPASS_AUTH === 'true') {
    logger.warn('BYPASS_AUTH ativado - pulando autenticação');
    req.user = {
      id: 'dev-user',
      role: 'admin',
      empresaId: 'dev-empresa'
    };
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
      error: 'Token vazio. Forneça um token Firebase válido.' 
    });
  }

  try {
    if (!firebase.firebaseInitialized) {
      logger.error('Firebase Admin SDK não inicializado. A autenticação não pode prosseguir.');
      return res.status(500).json({ 
        success: false, 
        error: 'Erro interno no servidor: serviço de autenticação indisponível.' 
      });
    }

    const decodedToken = await firebase.verifyFirebaseToken(token);
    if (!decodedToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido ou expirado. Gere um novo token Firebase.' 
      });
    }

    // Extrair dados do token
    const { uid } = decodedToken;
    let { role, empresaId } = decodedToken;

    // Log para debug
    logger.debug(`Token decodificado para usuário ${uid}:`, {
      uid,
      role: role || 'não definido',
      empresaId: empresaId || 'não definido'
    });

    // Se não tiver empresaId no token, buscar no Firestore
    if (!empresaId || !role) {
      try {
        const userDoc = await db?.collection('usuarios').doc(uid).get();
        if (userDoc && userDoc.exists) {
          const userData = userDoc.data();
          empresaId = empresaId || userData?.empresaId || 'default';
          role = role || userData?.role || 'admin';
          logger.info(`Dados do usuário obtidos do Firestore: ${uid}, role: ${role}, empresaId: ${empresaId}`);
        } else {
          // Usar valores padrão se o documento não existir
          empresaId = empresaId || 'default';
          role = role || 'admin';
          logger.warn(`Documento do usuário ${uid} não encontrado, usando valores padrão`);
        }
      } catch (firestoreError) {
        logger.warn(`Erro ao buscar dados do usuário ${uid} no Firestore:`, firestoreError);
        // Usar valores padrão em caso de erro
        empresaId = empresaId || 'default';
        role = role || 'admin';
      }
    }

    // Anexar dados do usuário à requisição
    req.user = {
      id: uid,
      role: role,
      empresaId: empresaId
    };

    logger.debug(`Usuário autenticado: ${uid}, role: ${role}, empresaId: ${empresaId}`);
    return next();

  } catch (error: any) {
    logger.error('Erro durante a verificação do token:', {
      error: error.message,
      code: error.code,
      token: token.substring(0, 20) + '...' // Log apenas os primeiros caracteres por segurança
    });
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expirado. Faça login novamente para obter um novo token.' 
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token revogado. Faça login novamente.' 
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token Firebase inválido. Verifique se está usando o token correto.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      error: 'Token inválido ou expirado. Faça login novamente.' 
    });
  }
};