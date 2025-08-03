import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import logger from './logger';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Grifo Vistorias API',
      version: '1.0.0',
      description: 'API for Grifo Vistorias system',
    },
    servers: [
      {
        url: 'https://grifo-api.onrender.com/api/v1',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Company: {
          type: 'object',
          properties: {
            empresaId: {
              type: 'string',
              description: 'ID único da empresa'
            },
            name: {
              type: 'string',
              description: 'Nome da empresa'
            },
            cnpj: {
              type: 'string',
              description: 'CNPJ da empresa'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email de contato da empresa'
            },
            phone: {
              type: 'string',
              description: 'Telefone de contato'
            },
            status: {
              type: 'string',
              enum: ['ativa', 'suspensa', 'cancelada'],
              description: 'Status da empresa'
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de última atualização'
            }
          },
          required: ['empresaId', 'name', 'cnpj', 'status']
        },
        User: {
          type: 'object',
          properties: {
            uid: {
              type: 'string',
              description: 'UID único do usuário'
            },
            name: {
              type: 'string',
              description: 'Nome completo do usuário'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário'
            },
            role: {
              type: 'string',
              enum: ['admin', 'vistoriador', 'cliente'],
              description: 'Papel do usuário no sistema'
            },
            empresaId: {
              type: 'string',
              description: 'ID da empresa associada'
            },
            phone: {
              type: 'string',
              description: 'Telefone de contato'
            },
            isActive: {
              type: 'boolean',
              description: 'Status ativo do usuário'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Data do último login'
            }
          },
          required: ['uid', 'name', 'email', 'role']
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único da notificação'
            },
            userId: {
              type: 'string',
              description: 'ID do usuário destinatário'
            },
            empresaId: {
              type: 'string',
              description: 'ID da empresa'
            },
            title: {
              type: 'string',
              description: 'Título da notificação'
            },
            message: {
              type: 'string',
              description: 'Mensagem da notificação'
            },
            type: {
              type: 'string',
              enum: ['inspection', 'contestation', 'system', 'reminder'],
              description: 'Tipo da notificação'
            },
            read: {
              type: 'boolean',
              description: 'Status de leitura'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            }
          },
          required: ['id', 'userId', 'title', 'message', 'type']
        },
        UploadFile: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único do arquivo'
            },
            filename: {
              type: 'string',
              description: 'Nome do arquivo'
            },
            originalName: {
              type: 'string',
              description: 'Nome original do arquivo'
            },
            mimetype: {
              type: 'string',
              description: 'Tipo MIME do arquivo'
            },
            size: {
              type: 'number',
              description: 'Tamanho do arquivo em bytes'
            },
            url: {
              type: 'string',
              description: 'URL de acesso ao arquivo'
            },
            category: {
              type: 'string',
              description: 'Categoria do arquivo'
            },
            uploadedBy: {
              type: 'string',
              description: 'ID do usuário que fez upload'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de upload'
            }
          },
          required: ['id', 'filename', 'mimetype', 'size', 'url']
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Página atual'
            },
            limit: {
              type: 'integer',
              description: 'Itens por página'
            },
            total: {
              type: 'integer',
              description: 'Total de itens'
            },
            totalPages: {
              type: 'integer',
              description: 'Total de páginas'
            },
            hasNext: {
              type: 'boolean',
              description: 'Tem próxima página'
            },
            hasPrev: {
              type: 'boolean',
              description: 'Tem página anterior'
            }
          }
        },
        Property: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único da propriedade'
            },
            empresaId: {
              type: 'string',
              description: 'ID da empresa'
            },
            address: {
              type: 'string',
              description: 'Endereço completo'
            },
            city: {
              type: 'string',
              description: 'Cidade'
            },
            state: {
              type: 'string',
              description: 'Estado'
            },
            zipCode: {
              type: 'string',
              description: 'CEP'
            },
            propertyType: {
              type: 'string',
              description: 'Tipo da propriedade'
            },
            status: {
              type: 'string',
              enum: ['ativa', 'inativa', 'pendente'],
              description: 'Status da propriedade'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            }
          },
          required: ['id', 'empresaId', 'address', 'city', 'state']
        },
        Inspection: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único da vistoria'
            },
            propertyId: {
              type: 'string',
              description: 'ID da propriedade'
            },
            empresaId: {
              type: 'string',
              description: 'ID da empresa'
            },
            inspectorId: {
              type: 'string',
              description: 'ID do vistoriador'
            },
            type: {
              type: 'string',
              enum: ['entrada', 'saida', 'intermediaria'],
              description: 'Tipo da vistoria'
            },
            status: {
              type: 'string',
              enum: ['agendada', 'em_andamento', 'concluida', 'cancelada'],
              description: 'Status da vistoria'
            },
            scheduledDate: {
              type: 'string',
              format: 'date-time',
              description: 'Data agendada'
            },
            completedDate: {
              type: 'string',
              format: 'date-time',
              description: 'Data de conclusão'
            },
            observations: {
              type: 'string',
              description: 'Observações da vistoria'
            },
            photos: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'URLs das fotos'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            }
          },
          required: ['id', 'propertyId', 'empresaId', 'type', 'status']
        },
        Contestation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único da contestação'
            },
            inspectionId: {
              type: 'string',
              description: 'ID da vistoria'
            },
            userId: {
              type: 'string',
              description: 'ID do usuário que contestou'
            },
            reason: {
              type: 'string',
              description: 'Motivo da contestação'
            },
            description: {
              type: 'string',
              description: 'Descrição detalhada'
            },
            status: {
              type: 'string',
              enum: ['pendente', 'em_analise', 'aprovada', 'rejeitada'],
              description: 'Status da contestação'
            },
            attachments: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Anexos da contestação'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            }
          },
          required: ['id', 'inspectionId', 'userId', 'reason', 'status']
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica se a operação foi bem-sucedida'
            },
            message: {
              type: 'string',
              description: 'Mensagem de resposta'
            },
            data: {
              type: 'object',
              description: 'Dados da resposta'
            },
            error: {
              type: 'object',
              description: 'Detalhes do erro (se houver)'
            }
          },
          required: ['success']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Código do erro'
                },
                details: {
                  type: 'string',
                  description: 'Detalhes do erro'
                }
              }
            }
          },
          required: ['success', 'message']
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/utils/validation.ts'], 
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info('Swagger docs available at /api-docs');
};