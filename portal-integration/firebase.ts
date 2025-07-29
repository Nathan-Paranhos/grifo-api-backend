import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getMessaging, getToken, Messaging } from 'firebase/messaging';

// Firebase Web SDK - Configuração Oficial de Produção
const firebaseConfig = {
  apiKey: "AIzaSyDRj2kodgFUW2-N1Boa5nP5IZYVg-HaJME",
  authDomain: "banco-visionaria.firebaseapp.com",
  databaseURL: "https://banco-visionaria-default-rtdb.firebaseio.com",
  projectId: "banco-visionaria",
  storageBucket: "banco-visionaria.firebasestorage.app",
  messagingSenderId: "806439611518",
  appId: "1:806439611518:web:591fc6ca38cb4459737c2f",
  measurementId: "G-NZKQKQYZVF"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth
export const auth: Auth = getAuth(app);

// Inicializar Messaging (opcional para notificações push)
let messaging: Messaging | null = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase Messaging não disponível:', error);
}

// Chave VAPID para notificações push web (opcional)
const VAPID_KEY = 'BNcV8bkNP0aR5fXJsgMWAKboOUWDG0S3m5jmKdgQNdZIB6ZjJuhHTMQGhe0qb_PTsGWxP2-Y8b0bySCwiglOx0';

/**
 * Solicita permissão para notificações push e retorna o token
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn('Firebase Messaging não está disponível');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });
      console.log('Token de notificação obtido:', token);
      return token;
    } else {
      console.log('Permissão para notificações negada');
      return null;
    }
  } catch (error) {
    console.error('Erro ao obter token de notificação:', error);
    return null;
  }
};

export { messaging };
export default app;