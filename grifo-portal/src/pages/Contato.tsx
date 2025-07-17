import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { ExclamationCircleIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

type FormValues = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const Contato = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError('');

    try {
      // Simulando envio para API
      // Processar dados do formulário
       // Implementar envio do formulário de contato

      // Em produção, aqui seria feita uma chamada para a API
      // await api.post('/contato', data);

      // Simulando um delay de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));

      setIsSuccess(true);
      reset();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-primary hover:text-primary-dark font-medium">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Voltar para a página inicial
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="lg:grid lg:grid-cols-2">
            {/* Informações de contato */}
            <div className="bg-primary py-16 px-6 sm:px-10 lg:col-span-1 xl:p-12">
              <h3 className="text-2xl font-extrabold text-white">Informações de Contato</h3>
              <p className="mt-4 text-lg text-gray-200 max-w-3xl">
                Entre em contato conosco para mais informações sobre nossos serviços de vistorias imobiliárias.
              </p>
              <dl className="mt-8 space-y-6">
                <dt><span className="sr-only">Endereço</span></dt>
                <dd className="flex text-base text-gray-200">
                  <svg className="flex-shrink-0 w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="ml-3">Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100</span>
                </dd>
                <dt><span className="sr-only">Telefone</span></dt>
                <dd className="flex text-base text-gray-200">
                  <svg className="flex-shrink-0 w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="ml-3">(11) 4002-8922</span>
                </dd>
                <dt><span className="sr-only">Email</span></dt>
                <dd className="flex text-base text-gray-200">
                  <svg className="flex-shrink-0 w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="ml-3">contato@grifovistorias.com.br</span>
                </dd>
              </dl>
              <div className="mt-12">
                <h3 className="text-xl font-extrabold text-white">Horário de Atendimento</h3>
                <p className="mt-2 text-base text-gray-200">
                  Segunda a Sexta: 9h às 18h<br />
                  Sábado: 9h às 13h
                </p>
              </div>
            </div>
            
            {/* Formulário de contato */}
            <div className="py-10 px-6 sm:px-10 lg:col-span-1 xl:p-12">
              <h3 className="text-2xl font-extrabold text-gray-900">Envie-nos uma mensagem</h3>
              <p className="mt-2 text-gray-500">
                Preencha o formulário abaixo e entraremos em contato o mais breve possível.
              </p>
              
              {isSuccess ? (
                <div className="mt-8 rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Mensagem enviada com sucesso!</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Agradecemos seu contato. Nossa equipe retornará em breve.</p>
                      </div>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setIsSuccess(false)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Enviar nova mensagem
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="form-label">Nome completo</label>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        id="name"
                        autoComplete="name"
                        className={`form-input ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        {...register('name', { required: 'Nome é obrigatório' })}
                      />
                      {errors.name && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="form-label">Email</label>
                    <div className="mt-1 relative">
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        className={`form-input ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        {...register('email', { 
                          required: 'Email é obrigatório',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido'
                          }
                        })}
                      />
                      {errors.email && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="form-label">Telefone</label>
                    <div className="mt-1 relative">
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        className={`form-input ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        {...register('phone', { 
                          required: 'Telefone é obrigatório',
                          pattern: {
                            value: /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/,
                            message: 'Telefone inválido'
                          }
                        })}
                      />
                      {errors.phone && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="message" className="form-label">Mensagem</label>
                    <div className="mt-1 relative">
                      <textarea
                        id="message"
                        rows={4}
                        className={`form-textarea ${errors.message ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        {...register('message', { required: 'Mensagem é obrigatória' })}
                      />
                      {errors.message && (
                        <div className="absolute top-0 right-0 pr-3 pt-3 flex items-start pointer-events-none">
                          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                    )}
                  </div>
                  
                  {error && (
                    <div className="sm:col-span-2 rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">{error}</h3>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar mensagem'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contato;