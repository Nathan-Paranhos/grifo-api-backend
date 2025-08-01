import { Router, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import * as admin from 'firebase-admin';
import logger from '../config/logger';
import { validateRequest } from '../utils/validation';
import { Request } from '../config/security';
import { db } from '../config/firebase';
import { z } from 'zod';
import { ExportOptions } from '../types';
import * as XLSX from 'xlsx';
const PDFDocument = require('pdfkit');
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';



const router = Router();

// Schema de validação para exportação
const exportQuerySchema = z.object({
  format: z.enum(['excel', 'pdf', 'csv']).default('excel'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.string().optional(),
  vistoriadorId: z.string().optional(),
  propertyType: z.string().optional()
});

// Função auxiliar para criar arquivo Excel
function createExcelFile(data: any[], filename: string, sheetName: string): string {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  const filePath = path.join(process.cwd(), 'exports', filename);
  
  // Criar diretório se não existir
  const exportDir = path.dirname(filePath);
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  XLSX.writeFile(workbook, filePath);
  return filePath;
}

// Função auxiliar para criar arquivo PDF
function createPDFFile(data: any[], filename: string, title: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const filePath = path.join(process.cwd(), 'exports', filename);
    
    // Criar diretório se não existir
    const exportDir = path.dirname(filePath);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    
    doc.pipe(stream);
    
    // Título
    doc.fontSize(16).text(title, { align: 'center' });
    doc.moveDown();
    
    // Data de geração
    doc.fontSize(10).text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'right' });
    doc.moveDown();
    
    // Dados
    data.forEach((item, index) => {
      doc.fontSize(12).text(`Item ${index + 1}:`, { underline: true });
      
      Object.entries(item).forEach(([key, value]) => {
        doc.fontSize(10).text(`${key}: ${value || 'N/A'}`);
      });
      
      doc.moveDown();
      
      // Nova página a cada 10 itens
      if ((index + 1) % 10 === 0 && index < data.length - 1) {
        doc.addPage();
      }
    });
    
    doc.end();
    
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

// Função auxiliar para criar arquivo CSV
function createCSVFile(data: any[], filename: string): string {
  const filePath = path.join(process.cwd(), 'exports', filename);
  
  // Criar diretório se não existir
  const exportDir = path.dirname(filePath);
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  
  if (data.length === 0) {
    fs.writeFileSync(filePath, 'Nenhum dado encontrado');
    return filePath;
  }
  
  // Cabeçalhos
  const headers = Object.keys(data[0]);
  let csvContent = headers.join(',') + '\n';
  
  // Dados
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escapar aspas e adicionar aspas se contém vírgula
      return typeof value === 'string' && value.includes(',') 
        ? `"${value.replace(/"/g, '""')}"`
        : value;
    });
    csvContent += values.join(',') + '\n';
  });
  
  fs.writeFileSync(filePath, csvContent, 'utf8');
  return filePath;
}

/**
 * @swagger
 * /api/v1/inspections/export:
 *   get:
 *     summary: Exportar vistorias
 *     description: Exporta dados de vistorias em formato Excel, PDF ou CSV
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, pdf, csv]
 *           default: excel
 *         description: Formato de exportação
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrar por status
 *       - in: query
 *         name: vistoriadorId
 *         schema:
 *           type: string
 *         description: Filtrar por vistoriador
 *     responses:
 *       200:
 *         description: Arquivo de exportação gerado com sucesso
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Token de autenticação inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/inspections/export',
  validateRequest({ query: exportQuerySchema }),
  async (req: Request, res: Response) => {
    const { format, dateFrom, dateTo, status, vistoriadorId } = req.query as any;
    const empresaId = req.user?.empresaId;
    const userId = req.user?.id;

    if (!empresaId || !userId) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    logger.info(`Exportando vistorias para empresa ${empresaId} em formato ${format}`);

    try {
      // Construir query
      let query: admin.firestore.Query = db!.collection('inspections')
        .where('empresaId', '==', empresaId);

      if (status) {
        query = query.where('status', '==', status);
      }

      if (vistoriadorId) {
        query = query.where('vistoriadorId', '==', vistoriadorId);
      }

      // Aplicar filtro de data se fornecido
      if (dateFrom) {
        query = query.where('dataVistoria', '>=', dateFrom);
      }

      if (dateTo) {
        query = query.where('dataVistoria', '<=', dateTo);
      }

      const snapshot = await query.get();
      const inspections: any[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        inspections.push({
          'ID': doc.id,
          'Empresa': data.empresaId,
          'Vistoriador': data.vistoriadorId,
          'Imóvel': data.imovel?.endereco || 'N/A',
          'Tipo': data.tipo,
          'Status': data.status,
          'Data da Vistoria': data.dataVistoria,
          'Observações': data.observacoes || '',
          'Criado em': data.createdAt,
          'Atualizado em': data.updatedAt
        });
      });

      if (inspections.length === 0) {
        return sendError(res, 'Nenhuma vistoria encontrada para exportação', 404);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let filePath: string;
      let contentType: string;
      let filename: string;

      switch (format) {
        case 'excel':
          filename = `vistorias_${timestamp}.xlsx`;
          filePath = createExcelFile(inspections, filename, 'Vistorias');
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        case 'pdf':
          filename = `vistorias_${timestamp}.pdf`;
          filePath = await createPDFFile(inspections, filename, 'Relatório de Vistorias');
          contentType = 'application/pdf';
          break;

        case 'csv':
          filename = `vistorias_${timestamp}.csv`;
          filePath = createCSVFile(inspections, filename);
          contentType = 'text/csv';
          break;

        default:
          return sendError(res, 'Formato não suportado', 400);
      }

      // Enviar arquivo
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Limpar arquivo após envio
      fileStream.on('end', () => {
        setTimeout(() => {
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            logger.warn('Erro ao remover arquivo temporário:', error);
          }
        }, 5000);
      });

      logger.info(`Exportação de vistorias concluída: ${inspections.length} registros`);

    } catch (error) {
      logger.error('Erro ao exportar vistorias:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/properties/export:
 *   get:
 *     summary: Exportar imóveis
 *     description: Exporta dados de imóveis em formato Excel, PDF ou CSV
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, pdf, csv]
 *           default: excel
 *         description: Formato de exportação
 *       - in: query
 *         name: propertyType
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de imóvel
 *     responses:
 *       200:
 *         description: Arquivo de exportação gerado com sucesso
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Token de autenticação inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/properties/export',
  validateRequest({ query: exportQuerySchema }),
  async (req: Request, res: Response) => {
    const { format, propertyType } = req.query as any;
    const empresaId = req.user?.empresaId;
    const userId = req.user?.id;

    if (!empresaId || !userId) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    logger.info(`Exportando imóveis para empresa ${empresaId} em formato ${format}`);

    try {
      let query: admin.firestore.Query = db!.collection('properties')
        .where('empresaId', '==', empresaId);

      if (propertyType) {
        query = query.where('tipo', '==', propertyType);
      }

      const snapshot = await query.get();
      const properties: any[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        properties.push({
          'ID': doc.id,
          'Endereço': data.endereco,
          'Bairro': data.bairro,
          'Cidade': data.cidade,
          'Estado': data.estado,
          'CEP': data.cep,
          'Tipo': data.tipo,
          'Área Total': data.areaTotal || 'N/A',
          'Área Construída': data.areaConstruida || 'N/A',
          'Proprietário': data.proprietario?.nome || 'N/A',
          'Telefone': data.proprietario?.telefone || 'N/A',
          'Email': data.proprietario?.email || 'N/A',
          'Criado em': data.createdAt,
          'Atualizado em': data.updatedAt
        });
      });

      if (properties.length === 0) {
        return sendError(res, 'Nenhum imóvel encontrado para exportação', 404);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let filePath: string;
      let contentType: string;
      let filename: string;

      switch (format) {
        case 'excel':
          filename = `imoveis_${timestamp}.xlsx`;
          filePath = createExcelFile(properties, filename, 'Imóveis');
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        case 'pdf':
          filename = `imoveis_${timestamp}.pdf`;
          filePath = await createPDFFile(properties, filename, 'Relatório de Imóveis');
          contentType = 'application/pdf';
          break;

        case 'csv':
          filename = `imoveis_${timestamp}.csv`;
          filePath = createCSVFile(properties, filename);
          contentType = 'text/csv';
          break;

        default:
          return sendError(res, 'Formato não suportado', 400);
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('end', () => {
        setTimeout(() => {
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            logger.warn('Erro ao remover arquivo temporário:', error);
          }
        }, 5000);
      });

      logger.info(`Exportação de imóveis concluída: ${properties.length} registros`);

    } catch (error) {
      logger.error('Erro ao exportar imóveis:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/users/export:
 *   get:
 *     summary: Exportar usuários
 *     description: Exporta dados de usuários em formato Excel, PDF ou CSV (apenas admins)
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, pdf, csv]
 *           default: excel
 *         description: Formato de exportação
 *     responses:
 *       200:
 *         description: Arquivo de exportação gerado com sucesso
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Token de autenticação inválido
 *       403:
 *         description: Acesso negado (apenas admins)
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/users/export',
  validateRequest({ query: exportQuerySchema }),
  async (req: Request, res: Response) => {
    const { format } = req.query as any;
    const empresaId = req.user?.empresaId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!empresaId || !userId) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    // Verificar se é admin
    if (userRole !== 'admin') {
      return sendError(res, 'Acesso negado. Apenas administradores podem exportar usuários.', 403);
    }

    logger.info(`Exportando usuários para empresa ${empresaId} em formato ${format}`);

    try {
      const query = db!.collection('users')
        .where('empresaId', '==', empresaId);

      const snapshot = await query.get();
      const users: any[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        users.push({
          'ID': doc.id,
          'Nome': data.nome,
          'Email': data.email,
          'Telefone': data.telefone || 'N/A',
          'Cargo': data.cargo || 'N/A',
          'Role': data.role,
          'Status': data.ativo ? 'Ativo' : 'Inativo',
          'Último Login': data.ultimoLogin || 'N/A',
          'Criado em': data.createdAt,
          'Atualizado em': data.updatedAt
        });
      });

      if (users.length === 0) {
        return sendError(res, 'Nenhum usuário encontrado para exportação', 404);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let filePath: string;
      let contentType: string;
      let filename: string;

      switch (format) {
        case 'excel':
          filename = `usuarios_${timestamp}.xlsx`;
          filePath = createExcelFile(users, filename, 'Usuários');
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        case 'pdf':
          filename = `usuarios_${timestamp}.pdf`;
          filePath = await createPDFFile(users, filename, 'Relatório de Usuários');
          contentType = 'application/pdf';
          break;

        case 'csv':
          filename = `usuarios_${timestamp}.csv`;
          filePath = createCSVFile(users, filename);
          contentType = 'text/csv';
          break;

        default:
          return sendError(res, 'Formato não suportado', 400);
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('end', () => {
        setTimeout(() => {
          try {
            fs.unlinkSync(filePath);
          } catch (error) {
            logger.warn('Erro ao remover arquivo temporário:', error);
          }
        }, 5000);
      });

      logger.info(`Exportação de usuários concluída: ${users.length} registros`);

    } catch (error) {
      logger.error('Erro ao exportar usuários:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
);

export default router;