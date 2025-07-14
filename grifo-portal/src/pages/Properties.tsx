import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';

const Properties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.empresaId) return;

    const fetchProperties = async () => {
      setLoading(true);
      const propertiesQuery = query(
        collection(firestore, 'imoveis'),
        where('empresaId', '==', user.empresaId),
        orderBy('dataCriacao', 'desc')
      );
      const querySnapshot = await getDocs(propertiesQuery);
      const propertiesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProperties(propertiesData);
      setLoading(false);
    };

    fetchProperties();
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">Imóveis</h1>
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-primary text-secondary">
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                  Endereço
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                  Cidade
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {properties.map(property => (
                <tr key={property.id} className="text-primary">
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="whitespace-no-wrap">{property.endereco}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="whitespace-no-wrap">{property.cidade}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Properties;