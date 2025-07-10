import express from 'express';
import logger from '../config/logger';

const router = express.Router();
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * @route GET /api/health
 * @desc Verifica o status da API
 * @access Public
 */
router.get('/', (req, res) => {
  logger.debug('Verificação de saúde da API solicitada');
  
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: NODE_ENV,
    uptime: `${Math.floor(process.uptime())} segundos`
  };
  
  logger.info('Verificação de saúde da API bem-sucedida');
  res.json(healthData);
});

export default router;