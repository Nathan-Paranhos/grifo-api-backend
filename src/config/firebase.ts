import * as admin from 'firebase-admin';
import 'dotenv/config';
import logger from './logger';

let db: admin.firestore.Firestore | undefined;
let firebaseInitialized = false;

export const initializeFirebase = (): Promise<admin.firestore.Firestore | null> => {
  return new Promise((resolve, reject) => {
    if (firebaseInitialized && db) {
      return resolve(db);
    }

    try {
      if (admin.apps.length === 0) {
        const credentialsJson = process.env.FIREBASE_CREDENTIALS;
        if (!credentialsJson) {
          logger.warn('Firebase credentials não configuradas. Continuando sem Firebase.');
          firebaseInitialized = false;
          return resolve(null);
        }

        try {
          const serviceAccount = JSON.parse(credentialsJson);

          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          });

          logger.info('Firebase Admin SDK inicializado com sucesso via variável de ambiente.');
          
          db = admin.firestore();
          firebaseInitialized = true;
          resolve(db);
        } catch (firebaseError) {
          logger.warn('Erro ao inicializar Firebase. Continuando sem Firebase:', firebaseError);
          firebaseInitialized = false;
          return resolve(null);
        }
      } else {
        db = admin.firestore();
        firebaseInitialized = true;
        resolve(db);
      }
    } catch (error) {
      logger.error(
        'Erro ao inicializar Firebase Admin SDK. Verifique a variável FIREBASE_CREDENTIALS.',
        error
      );
      logger.warn('A autenticação usará apenas JWT.');
      logger.warn('Continuando sem Firebase.');
      firebaseInitialized = false;
      return resolve(null);
    }
  });
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

export { admin, db, firebaseInitialized };
