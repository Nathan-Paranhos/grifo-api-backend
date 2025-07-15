import * as admin from 'firebase-admin';
import 'dotenv/config';
import logger from './logger';

let db: admin.firestore.Firestore | undefined;
let firebaseInitialized = false;

export const initializeFirebase = (): Promise<admin.firestore.Firestore> => {
  return new Promise((resolve, reject) => {
    if (firebaseInitialized && db) {
      return resolve(db);
    }

    try {
      if (admin.apps.length === 0) {
        const credentialsJson = process.env.FIREBASE_CREDENTIALS;
        if (!credentialsJson) {
          throw new Error('Variável de ambiente FIREBASE_CREDENTIALS não definida.');
        }

        const serviceAccount = JSON.parse(credentialsJson);

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });

        logger.info('Firebase Admin SDK inicializado com sucesso via variável de ambiente.');
      }

      db = admin.firestore();
      firebaseInitialized = true;
      resolve(db);
    } catch (error) {
      logger.error(
        'Erro ao inicializar Firebase Admin SDK. Verifique a variável FIREBASE_CREDENTIALS.',
        error
      );
      logger.warn('A autenticação usará apenas JWT.');
      reject(error);
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
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    logger.error('Erro ao verificar token Firebase:', error);
    return null;
  }
};

export { admin, db, firebaseInitialized };
