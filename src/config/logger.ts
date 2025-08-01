import winston from 'winston';
import 'dotenv/config';

// Definir níveis de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determinar o nível de log com base no ambiente
const level = () => {
  return process.env.LOG_LEVEL || 'info';
};

// Definir cores para cada nível de log
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Adicionar cores ao winston
winston.addColors(colors);

// Definir formato para os logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Definir os transportes para os logs
const transports = [
  // Console para todos os logs
  new winston.transports.Console(),
  
  // Arquivo para logs de erro
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true,
  }),
  
  // Arquivo para todos os logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true,
  }),
  
  // Arquivo para todos os logs
  new winston.transports.File({ filename: 'logs/all.log' }),
];

// Criar a instância do logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export default logger;