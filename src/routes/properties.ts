import { Router, Request as ExpressRequest, Response } from 'express';

// Extend the Express Request interface to include user property
interface Request extends ExpressRequest {
  user?: { id: string; role: string };
}
import logger from '../config/logger';
import { validateRequest, commonQuerySchema } from '../utils/validation';
import { authMiddleware } from '../config/security';

const router = Router();

/**
 * @route GET /api/properties
 * @desc Obtém lista de propriedades com filtros
 * @access Private
 */
router.get('/', 
  authMiddleware,
  validateRequest({ query: commonQuerySchema }),
  (req: Request, res: Response) => {
    const { empresaId, search, limit = '10' } = req.query;

    logger.debug(`Solicitação de propriedades para empresaId: ${empresaId}${search ? `, termo de busca: ${search}` : ''}`);

    try {
      // Simulação de dados de propriedades
      const propertiesData = [
        {
          id: 'prop_001',
          empresaId: 'emp_001',
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
          },
          ultimaVistoria: {
            id: 'insp_001',
            data: '2023-05-10T14:30:00Z',
            tipo: 'Entrada',
            status: 'Concluída'
          }
        },
        {
          id: 'prop_002',
          empresaId: 'emp_001',
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
          },
          ultimaVistoria: {
            id: 'insp_002',
            data: '2023-05-15T10:00:00Z',
            tipo: 'Saída',
            status: 'Pendente'
          }
        },
        {
          id: 'prop_003',
          empresaId: 'emp_001',
          endereco: 'Rua dos Pinheiros, 789',
          bairro: 'Pinheiros',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '05422-030',
          tipo: 'Comercial',
          areaTotal: 200,
          areaConstruida: 180,
          proprietario: {
            nome: 'Empresa XYZ Ltda',
            telefone: '(11) 3333-4444',
            email: 'contato@xyz.com'
          },
          ultimaVistoria: {
            id: 'insp_003',
            data: '2023-05-05T09:00:00Z',
            tipo: 'Periódica',
            status: 'Concluída'
          }
        }
      ];

      // Filtrar por termo de busca se fornecido
      let filteredProperties = [...propertiesData];
      
      if (search) {
        logger.debug(`Filtrando propriedades pelo termo: ${search}`);
        const searchTerm = (search as string).toLowerCase();
        filteredProperties = filteredProperties.filter(prop => 
          prop.endereco.toLowerCase().includes(searchTerm) ||
          prop.bairro.toLowerCase().includes(searchTerm) ||
          prop.cidade.toLowerCase().includes(searchTerm) ||
          prop.proprietario?.nome.toLowerCase().includes(searchTerm) ||
          prop.inquilino?.nome.toLowerCase().includes(searchTerm)
        );
      }

      // Limitar o número de resultados
      const limitNum = parseInt(limit as string);
      filteredProperties = filteredProperties.slice(0, limitNum);

      logger.info(`Retornando ${filteredProperties.length} propriedades`);
      return res.status(200).json({
        success: true,
        data: filteredProperties,
        total: filteredProperties.length,
        page: 1,
        limit: limitNum
      });
    } catch (error) {
      logger.error(`Erro ao buscar propriedades: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar a solicitação de propriedades'
      });
    }
  }
);

/**
 * @route GET /api/properties/:id
 * @desc Obtém detalhes de uma propriedade específica
 * @access Private
 */
router.get('/:id', 
  authMiddleware,
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { empresaId } = req.query;

      if (!empresaId) {
        logger.warn('Tentativa de acessar propriedade sem fornecer empresaId');
        return res.status(400).json({
          success: false,
          error: 'empresaId é obrigatório'
        });
      }

      logger.debug(`Buscando propriedade com id: ${id} para empresaId: ${empresaId}`);

      // Simulação de busca de propriedade por ID
      // Em um cenário real, você buscaria no banco de dados
      const property = {
        id,
        empresaId: empresaId as string,
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
        },
        ultimaVistoria: {
          id: 'insp_001',
          data: '2023-05-10T14:30:00Z',
          tipo: 'Entrada',
          status: 'Concluída'
        }
      };

      logger.info(`Propriedade ${id} encontrada e retornada com sucesso`);
      return res.status(200).json({
        success: true,
        data: property
      });
    } catch (error) {
      logger.error(`Erro ao buscar propriedade por ID: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar a solicitação de propriedade'
      });
    }
  }
);

export default router;