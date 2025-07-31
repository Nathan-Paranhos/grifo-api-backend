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
          required: ['empresaId', 'name', 'cnpj']
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