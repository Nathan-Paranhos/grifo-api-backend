import helmet from 'helmet';
// import { rateLimit } from 'express-rate-limit'; // Temporariamente desabilitado
import { Express, Request as ExpressRequest, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as firebase from './firebase';
import { db } from './firebase';
import logger from './logger';
import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

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
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'https://portal.grifovistorias.com',
      'https://app.grifovistorias.com',
      'android-app://com.grifo.vistorias',
      'https://grifo-api.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Permitir requisições sem origin (ex: Postman, aplicativos móveis)
    if (!origin) return callback(null, true);
    
    // Verificar se a origin está na lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Permitir localhost em desenvolvimento
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    return callback(new Error('Não permitido pelo CORS'), false);
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