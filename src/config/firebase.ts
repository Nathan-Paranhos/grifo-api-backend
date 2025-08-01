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
      throw new Error('FIREBASE_CREDENTIALS environment variable not set.');
    }

    const serviceAccount = JSON.parse(credentialsJson);

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
    throw error; // Re-throw the error to be caught by the caller
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
  } catch (error: any) {
    logger.error('Erro ao verificar token Firebase:', {
      error: error.message,
      code: error.code,
      tokenPrefix: token.substring(0, 20) + '...'
    });
    
    // Re-throw o erro para que o middleware possa tratá-lo adequadamente
    throw error;
  }
};

// Função para obter a instância do Firestore
export const getDb = (): admin.firestore.Firestore => {
  if (!db) {
    throw new Error('Firestore não foi inicializado. Chame initializeFirebase() primeiro.');
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
  } catch (error: any) {
    logger.error('❌ Erro ao setar custom claims:', {
      uid,
      empresaId,
      role,
      error: error.message
    });
    throw error;
  }
};

export { admin, db, firebaseInitialized };
