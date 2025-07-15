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