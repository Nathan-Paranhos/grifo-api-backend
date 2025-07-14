import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { getFileUrl } from '../services/storageService';
import { saveAs } from 'file-saver';

const Inspections = () => {
  const handleViewPdf = async (inspection: any) => {
    // @ts-ignore
    const path = `${inspection.empresaId}/${inspection.imovelId}/${inspection.id}/laudo.pdf`;
    try {
      const url = await getFileUrl(path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening PDF:', error);
      alert('Não foi possível abrir o PDF. Verifique se o arquivo existe no armazenamento.');
    }
  };

  const handleDownloadZip = async (inspection: any) => {
    // @ts-ignore
    const path = `${inspection.empresaId}/${inspection.imovelId}/${inspection.id}/fotos.zip`;
    try {
      const url = await getFileUrl(path);
      // Fetching the blob and saving it avoids potential CORS issues with direct download links
      const response = await fetch(url);
      const blob = await response.blob();
      saveAs(blob, `fotos-${inspection.imovelEndereco}-${inspection.id}.zip`);
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      alert('Não foi possível baixar o arquivo ZIP. Verifique se o arquivo existe no armazenamento.');
    }
  };

  const { currentUser } = useAuth();
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // @ts-ignore
    if (!currentUser || !currentUser.empresaId) return;

    const fetchInspections = async () => {
      setLoading(true);
      const inspectionsQuery = query(
        collection(firestore, 'vistorias'),
        // @ts-ignore
        where('empresaId', '==', currentUser.empresaId),
        orderBy('dataConclusao', 'desc')
      );
      const querySnapshot = await getDocs(inspectionsQuery);
      const inspectionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInspections(inspectionsData);
      setLoading(false);
    };

    fetchInspections();
  }, [currentUser]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-white mb-6">Vistorias</h1>
      {loading ? (
        <p className="text-white">Carregando...</p>
      ) : (
        <div className="bg-black shadow-md rounded-lg overflow-hidden border border-gray-700">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-800 text-gray-300">
                <th className="px-5 py-3 border-b-2 border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">
                  Data
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">
                  Imóvel
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">
                  Vistoriador
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-600 text-left text-xs font-semibold uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-400">
              {inspections.map(inspection => (
                <tr key={inspection.id} className="border-b border-gray-700 hover:bg-gray-800">
                  <td className="px-5 py-5 text-sm">
                    <p className="whitespace-no-wrap">{inspection.tipoVistoria}</p>
                  </td>
                  <td className="px-5 py-5 text-sm">
                    <p className="whitespace-no-wrap">
                      {new Date(inspection.dataConclusao.seconds * 1000).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-5 py-5 text-sm">
                    <p className="whitespace-no-wrap">{inspection.imovelEndereco}</p>
                  </td>
                  <td className="px-5 py-5 text-sm">
                    <p className="whitespace-no-wrap">{inspection.vistoriadorNome || 'N/A'}</p>
                  </td>
                  <td className="px-5 py-5 text-sm">
                    <span
                      className={`relative inline-block px-3 py-1 font-semibold leading-tight ${inspection.status === 'concluida' ? 'text-green-300 bg-green-900' : 'text-yellow-300 bg-yellow-900'} rounded-full`}>
                      <span className="relative">{inspection.status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-5 text-sm">
                    <button onClick={() => handleViewPdf(inspection)} className="text-dourado hover:underline mr-4">Ver PDF</button>
                    <button onClick={() => handleDownloadZip(inspection)} className="text-dourado hover:underline mr-4">Baixar ZIP</button>
                    <button className="text-red-500 hover:underline">Contestar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default Inspections;