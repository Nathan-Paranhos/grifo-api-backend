import * as admin from 'firebase-admin';
import 'dotenv/config';
import logger from './logger';
import * as path from 'path';

let db: admin.firestore.Firestore | undefined;
let firebaseInitialized = false;

export const initializeFirebase = (): Promise<admin.firestore.Firestore> => {
  return new Promise((resolve, reject) => {
    if (firebaseInitialized && db) {
      return resolve(db);
    }

    try {
      if (admin.apps.length === 0) {
        const serviceAccountPath = path.resolve(__dirname, '../../firebase-credentials.json');

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
        logger.info('Firebase Admin SDK inicializado com sucesso a partir do arquivo de credenciais.');
      }

      db = admin.firestore();
      firebaseInitialized = true;
      resolve(db);
    } catch (error) {
      logger.error('Erro ao inicializar Firebase Admin SDK a partir do arquivo de credenciais. Verifique se o arquivo "firebase-credentials.json" existe e está no formato correto.', error);
      logger.warn('A autenticação usará apenas JWT.');
      reject(error);
    }
  });
};

// Função para verificar um token do Firebase
export const verifyFirebaseToken = async (token: string): Promise<admin.auth.DecodedIdToken | null> => {
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

export {
  admin,
  db,
  firebaseInitialized,
};