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