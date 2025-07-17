import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { getFileUrl } from '../services/storageService';
import { saveAs } from 'file-saver';
import inspectionService, { Inspection } from '../services/inspectionService';

const Inspections = () => {
  const handleViewPdf = async (inspection: Inspection) => {
    const path = `${inspection.empresaId}/${inspection.imovelId}/${inspection.id}/laudo.pdf`;
    try {
      const url = await getFileUrl(path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening PDF:', error);
      alert('Não foi possível abrir o PDF. Verifique se o arquivo existe no armazenamento.');
    }
  };

  const handleDownloadZip = async (inspection: Inspection) => {
    const path = `${inspection.empresaId}/${inspection.imovelId}/${inspection.id}/fotos.zip`;
    try {
      const url = await getFileUrl(path);
      // Fetching the blob and saving it avoids potential CORS issues with direct download links
      const response = await fetch(url);
      const blob = await response.blob();
      saveAs(blob, `fotos-${inspection.imovel?.endereco || 'imovel'}-${inspection.id}.zip`);
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      alert('Não foi possível baixar o arquivo ZIP. Verifique se o arquivo existe no armazenamento.');
    }
  };

  const { currentUser } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchInspections = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const inspectionsData = await inspectionService.getInspections();
        
        // Ordena por data de criação (mais recentes primeiro)
        const sortedInspections = inspectionsData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setInspections(sortedInspections);
      } catch (error) {
        console.error('Erro ao carregar inspeções:', error);
        setError('Erro ao carregar inspeções. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
  }, [currentUser]);

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-white mb-6">Vistorias</h1>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dourado"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      ) : inspections.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Nenhuma inspeção encontrada
        </div>
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
                    <p className="whitespace-no-wrap">{inspection.tipo}</p>
                  </td>
                  <td className="px-5 py-5 text-sm">
                    <p className="whitespace-no-wrap">
                      {new Date(inspection.dataVistoria).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-5 py-5 text-sm">
                    <p className="whitespace-no-wrap">{inspection.imovel?.endereco || 'Endereço não informado'}</p>
                  </td>
                  <td className="px-5 py-5 text-sm">
                    <p className="whitespace-no-wrap">{inspection.vistoriadorId || 'N/A'}</p>
                  </td>
                  <td className="px-5 py-5 text-sm">
                    <span
                      className={`relative inline-block px-3 py-1 font-semibold leading-tight ${
                        inspection.status === 'Finalizado' ? 'text-green-300 bg-green-900' : 
                        inspection.status === 'Em Andamento' ? 'text-blue-300 bg-blue-900' :
                        'text-yellow-300 bg-yellow-900'
                      } rounded-full`}>
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