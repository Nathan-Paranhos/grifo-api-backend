import { Link } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/outline'

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-extrabold text-primary-500 tracking-widest">404</h1>
          <div className="bg-primary-100 text-primary-800 px-3 py-1 text-sm rounded-md inline-block mt-4">
            Página não encontrada
          </div>
        </div>
        
        <p className="text-gray-600 mb-8">
          Desculpe, a página que você está procurando não existe ou foi movida para outro endereço.
        </p>
        
        <div className="flex flex-col space-y-4 items-center">
          <Link 
            to="/" 
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors duration-300 flex items-center justify-center"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Voltar para a página inicial
          </Link>
          
          <Link 
            to="/dashboard" 
            className="px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-md transition-colors duration-300"
          >
            Ir para o Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound;