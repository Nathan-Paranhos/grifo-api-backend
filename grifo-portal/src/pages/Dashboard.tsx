import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
} from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { firestore } from '../config/firebase';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ inspections: 0, pending: 0, properties: 0, surveyors: 0 });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    // @ts-ignore
    if (!currentUser || !currentUser.empresaId) return;

    const fetchStats = async () => {
      // @ts-ignore
      const inspectionsQuery = query(collection(firestore, 'vistorias'), where('empresaId', '==', currentUser.empresaId));
      // @ts-ignore
      const propertiesQuery = query(collection(firestore, 'imoveis'), where('empresaId', '==', currentUser.empresaId));
      // @ts-ignore
      const usersQuery = query(collection(firestore, 'usuarios'), where('empresaId', '==', currentUser.empresaId));

      const [inspectionsSnap, propertiesSnap, usersSnap] = await Promise.all([
        getDocs(inspectionsQuery),
        getDocs(propertiesQuery),
        getDocs(usersQuery),
      ]);

      const pendingInspections = inspectionsSnap.docs.filter(doc => doc.data().status === 'pendente').length;
      const surveyors = usersSnap.docs.filter(doc => doc.data().role === 'vistoriador').length;

      setStats({
        inspections: inspectionsSnap.size,
        pending: pendingInspections,
        properties: propertiesSnap.size,
        surveyors: surveyors,
      });
    };

    const fetchRecentActivities = async () => {
      const activitiesQuery = query(
        collection(firestore, 'vistorias'),
        // @ts-ignore
        where('empresaId', '==', currentUser.empresaId),
        orderBy('dataConclusao', 'desc'),
        limit(5)
      );
      const activitiesSnap = await getDocs(activitiesQuery);
      setRecentActivities(activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchStats();
    fetchRecentActivities();
  }, [currentUser]);

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-black p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-400">Total de Vistorias</h3>
          <p className="text-3xl font-bold text-dourado mt-2">{stats.inspections}</p>
        </div>
        <div className="bg-black p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-400">Pendências</h3>
          <p className="text-3xl font-bold text-yellow-500 mt-2">{stats.pending}</p>
        </div>
        <div className="bg-black p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-400">Imóveis</h3>
          <p className="text-3xl font-bold text-green-500 mt-2">{stats.properties}</p>
        </div>
        <div className="bg-black p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-400">Vistoriadores</h3>
          <p className="text-3xl font-bold text-blue-500 mt-2">{stats.surveyors}</p>
        </div>
      </div>

      <div className="mt-8 bg-black p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-400 mb-4">Atividades Recentes</h3>
          <ul className="space-y-3">
          {recentActivities.map(activity => (
            <li key={activity.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-md hover:bg-gray-700">
              <div>
                <p className="font-medium text-gray-300">{activity.tipoVistoria} - {activity.imovelEndereco}</p>
                <p className="text-sm text-gray-500">Concluída em: {new Date(activity.dataConclusao.seconds * 1000).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${activity.status === 'concluida' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                {activity.status}
              </span>
            </li>
          ))}
        </ul>
        </div>
    </Layout>
  );
};

export default Dashboard;