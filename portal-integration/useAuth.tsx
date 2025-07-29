import * as React from 'react';
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth } from './firebase';
import { grifoApi } from './grifoApi';

/**
 * Tipos para o contexto de autenticação
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  getIdToken: () => Promise<string | null>;
}

/**
 * Contexto de autenticação
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook personalizado para usar o contexto de autenticação
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

/**
 * Props do AuthProvider
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de autenticação
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Converte User do Firebase para AuthUser
   */
  const convertFirebaseUser = (firebaseUser: User): AuthUser => {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      emailVerified: firebaseUser.emailVerified
    };
  };

  /**
   * Limpa erros
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Obtém o ID token do usuário atual
   */
  const getIdToken = useCallback(async (): Promise<string | null> => {
    try {
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken(true);
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter ID token:', error);
      return null;
    }
  }, []);

  /**
   * Função de login
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Verificar se o email foi verificado
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        throw new Error('Por favor, verifique seu email antes de fazer login.');
      }
      
      // O usuário será definido automaticamente pelo onAuthStateChanged
      console.log('Login realizado com sucesso');
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Tratar diferentes tipos de erro
      let errorMessage = 'Erro ao fazer login';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Usuário desabilitado';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde';
          break;
        default:
          errorMessage = error.message || 'Erro desconhecido';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Função de logout
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await signOut(auth);
      console.log('Logout realizado com sucesso');
    } catch (error: any) {
      console.error('Erro no logout:', error);
      setError('Erro ao fazer logout');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Função para resetar senha
   */
  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      console.log('Email de reset de senha enviado');
    } catch (error: any) {
      console.error('Erro ao enviar email de reset:', error);
      
      let errorMessage = 'Erro ao enviar email de reset';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        default:
          errorMessage = error.message || 'Erro desconhecido';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Função para alterar senha
   */
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      setError(null);
      
      if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error('Usuário não autenticado');
      }
      
      // Reautenticar o usuário
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Alterar a senha
      await updatePassword(auth.currentUser, newPassword);
      
      console.log('Senha alterada com sucesso');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      
      let errorMessage = 'Erro ao alterar senha';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Senha atual incorreta';
          break;
        case 'auth/weak-password':
          errorMessage = 'Nova senha muito fraca';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'É necessário fazer login novamente para alterar a senha';
          break;
        default:
          errorMessage = error.message || 'Erro desconhecido';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Efeito para monitorar mudanças no estado de autenticação
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(convertFirebaseUser(firebaseUser));
          console.log('Usuário autenticado:', firebaseUser.email);
        } else {
          setUser(null);
          console.log('Usuário não autenticado');
        }
      } catch (error) {
        console.error('Erro ao processar mudança de autenticação:', error);
        setError('Erro na autenticação');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Valor do contexto
   */
  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    resetPassword,
    changePassword,
    clearError,
    getIdToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para verificar se o usuário está autenticado
 */
export const useAuthState = () => {
  const { user, loading, isAuthenticated } = useAuth();
  return { user, loading, isAuthenticated };
};

/**
 * Hook para ações de autenticação
 */
export const useAuthActions = () => {
  const { login, logout, resetPassword, changePassword, clearError, getIdToken } = useAuth();
  return { login, logout, resetPassword, changePassword, clearError, getIdToken };
};

export default useAuth;