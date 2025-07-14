import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../services/authService';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao tentar fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 bg-black p-10 rounded-xl shadow-lg border border-gray-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-dourado">Grifo Vistorias</h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Acesse sua conta para gerenciar vistorias
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-900 bg-opacity-50 p-4">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}

          <div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-dourado hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-dourado disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Aguarde...' : 'Entrar com Google'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;