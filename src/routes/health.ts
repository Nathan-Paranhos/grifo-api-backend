import express from 'express';
import logger from '../config/logger';
import { firebaseInitialized } from '../config/firebase';

const router = express.Router();
const NODE_ENV = process.env.NODE_ENV || 'development';
const startTime = Date.now();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Verifica o status da API
 *     description: Endpoint público para verificação de saúde da API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API está funcionando corretamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 environment:
 *                   type: string
 *                   example: production
 *                 uptime:
 *                   type: string
 *                   example: 3600 segundos
 *                 services:
 *                   type: object
 *                   properties:
 *                     firebase:
 *                       type: string
 *                       example: connected
 */
router.get('/', (req, res) => {
  logger.debug('Verificação de saúde da API solicitada');
  
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: NODE_ENV,
    uptime: `${uptime} segundos`,
    services: {
      firebase: firebaseInitialized ? 'connected' : 'disconnected',
      database: firebaseInitialized ? 'available' : 'unavailable'
    },
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    }
  };
  
  logger.info('Verificação de saúde da API bem-sucedida');
  res.status(200).json(healthData);
});

export default router;