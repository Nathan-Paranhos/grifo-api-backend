import * as admin from 'firebase-admin';
import 'dotenv/config';
import logger from './logger';

let db: admin.firestore.Firestore | undefined;
let firebaseInitialized = false;

export const initializeFirebase = async (): Promise<void> => {
  if (firebaseInitialized) {
    logger.info('Firebase already initialized.');
    return;
  }

  try {
    const credentialsJson = process.env.FIREBASE_CREDENTIALS;
    if (!credentialsJson) {
      logger.warn('FIREBASE_CREDENTIALS environment variable not set. Continuing without Firebase.');
      return;
    }

    const serviceAccount = JSON.parse(credentialsJson);
    
    // Verificar se as credenciais são de teste/desenvolvimento
    if (serviceAccount.private_key === 'test-private-key' || 
        serviceAccount.project_id === 'test-project-id' || 
        serviceAccount.client_email === 'test@test.com') {
      logger.warn('Firebase credentials appear to be test/development credentials. Initializing Firebase with mock configuration.');
      
      // Inicializar Firebase com configuração mock para desenvolvimento
      try {
        admin.initializeApp({
          projectId: 'mock-project-id',
          // Usar configuração mínima para desenvolvimento
        });
        firebaseInitialized = true;
        logger.info('Firebase initialized with mock configuration for development.');
      } catch (error) {
        logger.warn('Failed to initialize Firebase with mock configuration. Continuing without Firebase.');
        firebaseInitialized = false;
      }
      return;
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      logger.info('Firebase Admin SDK initialized successfully.');
    } else {
      logger.info('Firebase Admin SDK was already initialized.');
    }

    db = admin.firestore();
    firebaseInitialized = true;

  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK.', error);
    logger.warn('Continuing without Firebase. Some features may not be available.');
    // Não re-throw o erro para permitir que o servidor continue
  }
};

// Função para verificar um token do Firebase
export const verifyFirebaseToken = async (
  token: string
): Promise<admin.auth.DecodedIdToken | null> => {
  if (!firebaseInitialized) {
    logger.warn('Tentativa de verificar token Firebase, mas o SDK não está inicializado');
    return null;
  }

  try {
    // Verificar se o token não está vazio
    if (!token || token.trim() === '') {
      logger.warn('Token vazio fornecido para verificação');
      return null;
    }

    // Verificar o token com o Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token, true); // checkRevoked = true
    
    logger.debug('Token Firebase verificado com sucesso:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      exp: new Date(decodedToken.exp * 1000).toISOString()
    });
    
    return decodedToken;
  } catch (error: unknown) {
    logger.error('Erro ao verificar token Firebase:', {
      error: error instanceof Error ? error.message : String(error),
      code: error && typeof error === 'object' && 'code' in error ? (error as any).code : undefined,
      tokenPrefix: token.substring(0, 20) + '...'
    });
    
    // Re-throw o erro para que o middleware possa tratá-lo adequadamente
    throw error;
  }
};

// Função para obter a instância do Firestore
export const getDb = (): admin.firestore.Firestore => {
  if (!firebaseInitialized || !db) {
    throw new Error('Firebase não foi inicializado ou não está disponível em modo desenvolvimento.');
  }
  return db;
};

// Função para obter a instância do Firestore de forma segura (retorna null se não inicializado)
export const getDbSafe = (): admin.firestore.Firestore | null => {
  if (!firebaseInitialized || !db) {
    return null;
  }
  return db;
};

// Função para setar custom claims no Firebase
export const setCustomClaims = async (uid: string, empresaId: string, role: 'admin' | 'user') => {
  if (!firebaseInitialized) {
    throw new Error('Firebase Admin SDK não está inicializado');
  }

  try {
    await admin.auth().setCustomUserClaims(uid, {
      empresaId,
      role,
    });

    logger.info(`✔ Claims setados para o UID ${uid}: empresaId=${empresaId}, role=${role}`);
    return { success: true, message: 'Claims setados com sucesso' };
  } catch (error: unknown) {
    logger.error('❌ Erro ao setar custom claims:', {
      uid,
      empresaId,
      role,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

// Função para verificar se o Firebase foi inicializado
export const isFirebaseInitialized = (): boolean => {
  return firebaseInitialized;
};

export { admin, db, firebaseInitialized };
