import { auth, firestore } from '../config/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // After successful login, check if user exists in Firestore
    const userDoc = await getDoc(doc(firestore, 'usuarios', user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return { ...user, ...userData };
    } else {
      // If user does not exist in Firestore, sign them out and throw an error
      await signOut(auth);
      throw new Error('Usuário não cadastrado no sistema.');
    }
  } catch (error) {
    console.error("Erro ao fazer login com o Google:", error);
    throw error;
  }
};

export const handleSignOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }
};