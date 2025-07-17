import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import dashboardService from '../services/dashboardService';
import inspectionService from '../services/inspectionService';
import userService from '../services/userService';
import propertyService from '../services/propertyService';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ 
    total: 0, 
    pendentes: 0, 
    concluidas: 0, 
    emAndamento: 0,
    properties: 0, 
    surveyors: 0 
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Busca dados em paralelo para melhor performance
        const [dashboardStats, recentInspections, propertyCount, surveyorCount] = await Promise.all([
          dashboardService.getDashboardStats(),
          inspectionService.getInspections({ limit: 5 }),
          propertyService.getPropertyCount(),
          userService.getSurveyorCount()
        ]);
        
        // Ordena por data de criação (mais recentes primeiro)
        const sortedInspections = recentInspections
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        
        setStats({
          total: dashboardStats.total,
          pendentes: dashboardStats.pendentes,
          concluidas: dashboardStats.concluidas,
          emAndamento: dashboardStats.emAndamento,
          properties: propertyCount,
          surveyors: surveyorCount
        });
        
        setRecentActivities(sortedInspections);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dourado"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-black p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-400">Total de Vistorias</h3>
            <p className="text-3xl font-bold text-dourado mt-2">{stats.total}</p>
          </div>
          <div className="bg-black p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-400">Pendentes</h3>
            <p className="text-3xl font-bold text-yellow-500 mt-2">{stats.pendentes}</p>
          </div>
          <div className="bg-black p-6 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-400">Em Andamento</h3>
            <p className="text-3xl font-bold text-blue-500 mt-2">{stats.emAndamento}</p>
          </div>
          <div className="bg-black p-6 rounded-lg border border-gray-700">
             <h3 className="text-lg font-semibold text-gray-400">Concluídas</h3>
             <p className="text-3xl font-bold text-green-500 mt-2">{stats.concluidas}</p>
           </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
           <div className="bg-black p-6 rounded-lg border border-gray-700">
             <h3 className="text-lg font-semibold text-gray-400">Propriedades</h3>
             <p className="text-3xl font-bold text-purple-500 mt-2">{stats.properties}</p>
           </div>
           <div className="bg-black p-6 rounded-lg border border-gray-700">
             <h3 className="text-lg font-semibold text-gray-400">Vistoriadores</h3>
             <p className="text-3xl font-bold text-cyan-500 mt-2">{stats.surveyors}</p>
           </div>
         </div>
      )}

      <div className="mt-8 bg-black p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-400 mb-4">Atividades Recentes</h3>
          <ul className="space-y-3">
          {recentActivities.length > 0 ? recentActivities.map(activity => (
            <li key={activity.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-md hover:bg-gray-700">
              <div>
                <p className="font-medium text-gray-300">{activity.tipo} - {activity.imovel?.endereco || 'Endereço não informado'}</p>
                <p className="text-sm text-gray-500">Criada em: {new Date(activity.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                activity.status === 'Finalizado' ? 'bg-green-900 text-green-300' : 
                activity.status === 'Em Andamento' ? 'bg-blue-900 text-blue-300' :
                'bg-yellow-900 text-yellow-300'
              }`}>
                {activity.status}
              </span>
            </li>
          )) : (
            <li className="text-center text-gray-500 py-4">
              Nenhuma atividade recente encontrada
            </li>
          ))}
        </ul>
        </div>
    </Layout>
  );
};

export default Dashboard;