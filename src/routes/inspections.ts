import { Router, Request as ExpressRequest, Response } from 'express';

// Extend the Express Request interface to include user property
interface Request extends ExpressRequest {
  user?: { id: string; role: string };
}
import logger from '../config/logger';
import { validateRequest, commonQuerySchema, inspectionSchema, contestationSchema } from '../utils/validation';
import { authMiddleware } from '../config/security';

const router = Router();

/**
 * @route GET /api/inspections
 * @desc Obtém lista de inspeções com filtros
 * @access Private
 */
router.get('/', 
  authMiddleware,
  validateRequest({ query: commonQuerySchema }),
  (req: Request, res: Response) => {
    const { empresaId, vistoriadorId, status, limit = '10' } = req.query;

    logger.debug(`Solicitação de inspeções para empresaId: ${empresaId}${vistoriadorId ? `, vistoriadorId: ${vistoriadorId}` : ''}${status ? `, status: ${status}` : ''}`);

    try {
      // Simulação de dados de inspeções
      const inspectionsData = [
        {
          id: 'insp_001',
          empresaId: 'emp_001',
          vistoriadorId: 'vist_001',
          tipo: 'Entrada',
          status: 'Concluída',
          dataVistoria: '2023-05-10T14:30:00Z',
          imovel: {
            id: 'imov_001',
            endereco: 'Rua das Flores, 123',
            bairro: 'Centro',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234-567',
            tipo: 'Apartamento',
            areaTotal: 75,
            areaConstruida: 68,
            proprietario: {
              nome: 'João Silva',
              telefone: '(11) 98765-4321',
              email: 'joao.silva@email.com'
            },
            inquilino: {
              nome: 'Maria Oliveira',
              telefone: '(11) 91234-5678',
              email: 'maria.oliveira@email.com'
            }
          },
          fotos: [
            {
              url: 'https://example.com/foto1.jpg',
              descricao: 'Sala de estar',
              categoria: 'Ambiente'
            },
            {
              url: 'https://example.com/foto2.jpg',
              descricao: 'Cozinha',
              categoria: 'Ambiente'
            }
          ],
          checklists: [
            {
              categoria: 'Elétrica',
              itens: [
                {
                  item: 'Tomadas',
                  status: 'Bom',
                  observacao: 'Todas funcionando'
                },
                {
                  item: 'Interruptores',
                  status: 'Bom',
                  observacao: 'Todos funcionando'
                }
              ]
            },
            {
              categoria: 'Hidráulica',
              itens: [
                {
                  item: 'Torneiras',
                  status: 'Regular',
                  observacao: 'Torneira da cozinha com pequeno vazamento'
                },
                {
                  item: 'Chuveiros',
                  status: 'Bom',
                  observacao: 'Todos funcionando'
                }
              ]
            }
          ],
          observacoes: 'Imóvel em bom estado geral, apenas com pequenos reparos necessários.'
        },
        {
          id: 'insp_002',
          empresaId: 'emp_001',
          vistoriadorId: 'vist_002',
          tipo: 'Saída',
          status: 'Pendente',
          dataVistoria: '2023-05-15T10:00:00Z',
          imovel: {
            id: 'imov_002',
            endereco: 'Av. Principal, 456',
            bairro: 'Jardins',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '04567-890',
            tipo: 'Casa',
            areaTotal: 150,
            areaConstruida: 120,
            proprietario: {
              nome: 'Carlos Pereira',
              telefone: '(11) 97777-8888',
              email: 'carlos.pereira@email.com'
            },
            inquilino: {
              nome: 'Ana Santos',
              telefone: '(11) 96666-5555',
              email: 'ana.santos@email.com'
            }
          }
        }
      ];

      // Filtrar por vistoriador se o ID for fornecido
      let filteredInspections = [...inspectionsData];
      
      if (vistoriadorId) {
        logger.debug(`Filtrando inspeções por vistoriadorId: ${vistoriadorId}`);
        filteredInspections = filteredInspections.filter(insp => insp.vistoriadorId === vistoriadorId);
      }

      // Filtrar por status se fornecido
      if (status) {
        logger.debug(`Filtrando inspeções por status: ${status}`);
        filteredInspections = filteredInspections.filter(insp => insp.status === status);
      }

      // Limitar o número de resultados
      const limitNum = parseInt(limit as string);
      filteredInspections = filteredInspections.slice(0, limitNum);

      logger.info(`Retornando ${filteredInspections.length} inspeções`);
      return res.status(200).json({
        success: true,
        data: filteredInspections,
        total: filteredInspections.length,
        page: 1,
        limit: limitNum
      });
    } catch (error) {
      logger.error(`Erro ao buscar inspeções: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar a solicitação de inspeções'
      });
    }
  }
);

/**
 * @route POST /api/inspections
 * @desc Cria uma nova inspeção
 * @access Private
 */
router.post('/', 
  authMiddleware,
  validateRequest({ body: inspectionSchema }),
  (req: Request, res: Response) => {
    try {
      const { empresaId, vistoriadorId, imovelId, tipo, status, dataVistoria, observacoes, fotos, checklists, imovel } = req.body;

      logger.debug(`Criando nova inspeção para empresaId: ${empresaId}, vistoriadorId: ${vistoriadorId}, imovelId: ${imovelId}`);

      // Gerar ID único para a nova inspeção
      const id = `insp_${Date.now()}`;

      // Criar objeto de inspeção
      const newInspection = {
        id,
        empresaId,
        vistoriadorId,
        imovelId,
        tipo,
        status: status || 'Pendente',
        dataVistoria: dataVistoria || new Date().toISOString(),
        observacoes,
        fotos,
        checklists,
        // Se o objeto imovel não for fornecido, criar um objeto padrão
        imovel: imovel || {
          id: imovelId,
          endereco: 'Endereço não fornecido',
          bairro: '',
          cidade: '',
          estado: '',
          cep: '',
          tipo: ''
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Em um cenário real, você salvaria no banco de dados
      logger.info(`Inspeção ${id} criada com sucesso`);
      logger.debug(`Dados da inspeção: ${JSON.stringify(newInspection)}`);

      return res.status(201).json({
        success: true,
        message: 'Inspeção criada com sucesso',
        data: newInspection
      });
    } catch (error) {
      logger.error(`Erro ao criar inspeção: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar a criação da inspeção'
      });
    }
  }
);

/**
 * @route GET /api/inspections/:id
 * @desc Obtém detalhes de uma inspeção específica
 * @access Private
 */
router.get('/:id', 
  authMiddleware,
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { empresaId } = req.query;

      if (!empresaId) {
        logger.warn('Tentativa de acessar inspeção sem fornecer empresaId');
        return res.status(400).json({
          success: false,
          error: 'empresaId é obrigatório'
        });
      }

      logger.debug(`Buscando inspeção com id: ${id} para empresaId: ${empresaId}`);

      // Simulação de busca de inspeção por ID
      // Em um cenário real, você buscaria no banco de dados
      const inspection = {
        id,
        empresaId: empresaId as string,
        vistoriadorId: 'vist_001',
        tipo: 'Entrada',
        status: 'Concluída',
        dataVistoria: '2023-05-10T14:30:00Z',
        imovel: {
          id: 'imov_001',
          endereco: 'Rua das Flores, 123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          tipo: 'Apartamento'
        },
        observacoes: 'Imóvel em bom estado geral'
      };

      logger.info(`Inspeção ${id} encontrada e retornada com sucesso`);
      return res.status(200).json({
        success: true,
        data: inspection
      });
    } catch (error) {
      logger.error(`Erro ao buscar inspeção por ID: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar a solicitação de inspeção'
      });
    }
  }
);

/**
 * @route POST /api/inspections/:id/contest
 * @desc Registra uma contestação para uma vistoria específica
 * @access Private
 */
router.post('/:id/contest', 
  authMiddleware,
  validateRequest({ body: contestationSchema }),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { empresaId, motivo, detalhes, itensContestados } = req.body;

      logger.debug(`Registrando contestação para vistoria ${id} da empresa ${empresaId}`);

      // Verificar se a vistoria existe
      // Em um cenário real, você verificaria no banco de dados
      // Simulação de verificação
      if (id !== 'insp_001' && id !== 'insp_002') {
        logger.warn(`Tentativa de contestar vistoria inexistente: ${id}`);
        return res.status(404).json({
          success: false,
          error: 'Vistoria não encontrada'
        });
      }

      // Criar objeto de contestação
      const contestation = {
        id: `contest_${Date.now()}`,
        inspectionId: id,
        empresaId,
        motivo,
        detalhes,
        itensContestados,
        status: 'Pendente',
        dataContestacao: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Em um cenário real, você salvaria no banco de dados
      // Também atualizaria a vistoria para indicar que possui contestação

      logger.info(`Contestação ${contestation.id} registrada com sucesso para vistoria ${id}`);
      return res.status(201).json({
        success: true,
        message: 'Contestação registrada com sucesso',
        data: contestation
      });
    } catch (error) {
      logger.error(`Erro ao registrar contestação: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar a contestação da vistoria'
      });
    }
  }
);

export default router;