import { Router, Request as ExpressRequest, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import * as admin from 'firebase-admin';
import logger from '../config/logger';
import { validateRequest } from '../utils/validation';
import { authMiddleware } from '../config/security';
import { db } from '../config/firebase';
import { z } from 'zod';
import { UploadedFile } from '../types';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Extend the Express Request interface to include user property
interface Request extends ExpressRequest {
  user?: { 
    id: string; 
    role: string; 
    empresaId: string; 
  };
}

const router = Router();

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtros para tipos de arquivo
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos (JPEG, PNG, GIF, WebP)'));
  }
};

const documentFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas documentos são permitidos (PDF, DOC, DOCX, XLS, XLSX, TXT)'));
  }
};

// Configurações de upload
const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // máximo 10 arquivos por vez
  }
}).array('images', 10);

const uploadDocuments = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // máximo 5 arquivos por vez
  }
}).array('documents', 5);

// Schema de validação para remoção de arquivo
const deleteFileSchema = z.object({
  id: z.string().min(1, 'ID do arquivo é obrigatório')
});

/**
 * @swagger
 * /api/v1/uploads/images:
 *   post:
 *     summary: Upload de imagens
 *     description: Faz upload de uma ou múltiplas imagens
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Arquivos de imagem (máximo 10, 5MB cada)
 *               category:
 *                 type: string
 *                 enum: [inspection, property, profile, logo]
 *                 description: Categoria da imagem
 *     responses:
 *       201:
 *         description: Imagens enviadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UploadedFile'
 *                 message:
 *                   type: string
 *                   example: "Imagens enviadas com sucesso"
 *       400:
 *         description: Erro de validação ou tipo de arquivo inválido
 *       401:
 *         description: Token de autenticação inválido
 *       413:
 *         description: Arquivo muito grande
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/images',
  authMiddleware,
  (req: Request, res: Response, next) => {
    uploadImages(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'Arquivo muito grande. Máximo 5MB por imagem.', 413);
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return sendError(res, 'Muitos arquivos. Máximo 10 imagens por vez.', 400);
        }
        return sendError(res, `Erro no upload: ${err.message}`, 400);
      }
      if (err) {
        return sendError(res, err.message, 400);
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const empresaId = req.user?.empresaId;
    const { category = 'image' } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!userId || !empresaId) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    if (!files || files.length === 0) {
      return sendError(res, 'Nenhum arquivo foi enviado', 400);
    }

    logger.info(`Upload de ${files.length} imagens para usuário ${userId}`);

    try {
      const uploadedFiles: UploadedFile[] = [];
      const batch = db!.batch();

      for (const file of files) {
        const fileId = uuidv4();
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://grifo-api.onrender.com'
          : 'http://localhost:3000';
        
        const fileData: UploadedFile = {
          id: fileId,
          originalName: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          url: `${baseUrl}/uploads/${file.filename}`,
          uploadedBy: userId,
          empresaId,
          category: 'image',
          createdAt: new Date().toISOString()
        };

        // Adicionar ao batch para salvar no Firestore
        const fileRef = db!.collection('uploads').doc(fileId);
        batch.set(fileRef, fileData);
        
        uploadedFiles.push(fileData);
      }

      // Executar batch
      await batch.commit();

      logger.info(`${files.length} imagens salvas com sucesso`);
      return sendSuccess(res, uploadedFiles, 201, { message: 'Imagens enviadas com sucesso' });

    } catch (error) {
      logger.error('Erro ao salvar informações dos arquivos:', error);
      
      // Limpar arquivos em caso de erro
      files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          logger.error('Erro ao remover arquivo:', unlinkError);
        }
      });
      
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/uploads/documents:
 *   post:
 *     summary: Upload de documentos
 *     description: Faz upload de um ou múltiplos documentos
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Arquivos de documento (máximo 5, 10MB cada)
 *               category:
 *                 type: string
 *                 enum: [contract, report, certificate, other]
 *                 description: Categoria do documento
 *     responses:
 *       201:
 *         description: Documentos enviados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UploadedFile'
 *                 message:
 *                   type: string
 *                   example: "Documentos enviados com sucesso"
 *       400:
 *         description: Erro de validação ou tipo de arquivo inválido
 *       401:
 *         description: Token de autenticação inválido
 *       413:
 *         description: Arquivo muito grande
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/documents',
  authMiddleware,
  (req: Request, res: Response, next) => {
    uploadDocuments(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'Arquivo muito grande. Máximo 10MB por documento.', 413);
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return sendError(res, 'Muitos arquivos. Máximo 5 documentos por vez.', 400);
        }
        return sendError(res, `Erro no upload: ${err.message}`, 400);
      }
      if (err) {
        return sendError(res, err.message, 400);
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const empresaId = req.user?.empresaId;
    const { category = 'document' } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!userId || !empresaId) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    if (!files || files.length === 0) {
      return sendError(res, 'Nenhum arquivo foi enviado', 400);
    }

    logger.info(`Upload de ${files.length} documentos para usuário ${userId}`);

    try {
      const uploadedFiles: UploadedFile[] = [];
      const batch = db!.batch();

      for (const file of files) {
        const fileId = uuidv4();
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://grifo-api.onrender.com'
          : 'http://localhost:3000';
        
        const fileData: UploadedFile = {
          id: fileId,
          originalName: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          url: `${baseUrl}/uploads/${file.filename}`,
          uploadedBy: userId,
          empresaId,
          category: 'document',
          createdAt: new Date().toISOString()
        };

        // Adicionar ao batch para salvar no Firestore
        const fileRef = db!.collection('uploads').doc(fileId);
        batch.set(fileRef, fileData);
        
        uploadedFiles.push(fileData);
      }

      // Executar batch
      await batch.commit();

      logger.info(`${files.length} documentos salvos com sucesso`);
      return sendSuccess(res, uploadedFiles, 201, { message: 'Documentos enviados com sucesso' });

    } catch (error) {
      logger.error('Erro ao salvar informações dos arquivos:', error);
      
      // Limpar arquivos em caso de erro
      files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          logger.error('Erro ao remover arquivo:', unlinkError);
        }
      });
      
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/uploads/{id}:
 *   delete:
 *     summary: Remover arquivo
 *     description: Remove um arquivo específico do sistema
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do arquivo
 *     responses:
 *       200:
 *         description: Arquivo removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Arquivo removido com sucesso"
 *       400:
 *         description: ID do arquivo inválido
 *       401:
 *         description: Token de autenticação inválido
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Arquivo não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id',
  authMiddleware,
  validateRequest({ params: deleteFileSchema }),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const empresaId = req.user?.empresaId;
    const userRole = req.user?.role;

    if (!userId || !empresaId) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    logger.info(`Removendo arquivo ${id} para usuário ${userId}`);

    try {
      const fileRef = db!.collection('uploads').doc(id);
      const fileDoc = await fileRef.get();

      if (!fileDoc.exists) {
        return sendError(res, 'Arquivo não encontrado', 404);
      }

      const fileData = fileDoc.data() as UploadedFile;

      // Verificar permissões: usuário deve ser o dono do arquivo ou admin
      if (fileData.uploadedBy !== userId && userRole !== 'admin') {
        return sendError(res, 'Acesso negado', 403);
      }

      // Verificar se pertence à mesma empresa
      if (fileData.empresaId !== empresaId) {
        return sendError(res, 'Acesso negado', 403);
      }

      // Remover arquivo físico
      const filePath = path.join(process.cwd(), 'uploads', fileData.filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fsError) {
        logger.warn('Erro ao remover arquivo físico:', fsError);
        // Continuar mesmo se não conseguir remover o arquivo físico
      }

      // Remover registro do Firestore
      await fileRef.delete();

      logger.info(`Arquivo ${id} removido com sucesso`);
      return sendSuccess(res, null, 200, { message: 'Arquivo removido com sucesso' });

    } catch (error) {
      logger.error('Erro ao remover arquivo:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/uploads:
 *   get:
 *     summary: Listar arquivos do usuário
 *     description: Retorna uma lista de arquivos enviados pelo usuário
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [image, document, logo]
 *         description: Filtrar por categoria
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de itens por página
 *     responses:
 *       200:
 *         description: Lista de arquivos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UploadedFile'
 *                 message:
 *                   type: string
 *                   example: "Arquivos recuperados com sucesso"
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Token de autenticação inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/',
  authMiddleware,
  async (req: Request, res: Response) => {
    const { category, page = 1, limit = 10 } = req.query;
    const userId = req.user?.id;
    const empresaId = req.user?.empresaId;

    if (!userId || !empresaId) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    logger.info(`Listando arquivos para usuário ${userId}`);

    try {
      let query: admin.firestore.Query = db!.collection('uploads')
        .where('empresaId', '==', empresaId);

      if (category) {
        query = query.where('category', '==', category);
      }

      query = query.orderBy('createdAt', 'desc');

      // Aplicar paginação
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      query = query.offset(offset).limit(limitNum);

      const snapshot = await query.get();
      const files: UploadedFile[] = [];

      snapshot.forEach(doc => {
        files.push({
          id: doc.id,
          ...doc.data()
        } as UploadedFile);
      });

      // Contar total para paginação
      let countQuery: admin.firestore.Query = db!.collection('uploads')
        .where('empresaId', '==', empresaId);

      if (category) {
        countQuery = countQuery.where('category', '==', category);
      }

      const countSnapshot = await countQuery.get();
      const total = countSnapshot.size;
      const totalPages = Math.ceil(total / limitNum);

      const response = {
        data: files,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      };

      logger.info(`${files.length} arquivos recuperados com sucesso`);
      return sendSuccess(res, response, 200, { message: 'Arquivos recuperados com sucesso' });

    } catch (error) {
      logger.error('Erro ao listar arquivos:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
);

/**
 * @swagger
 * components:
 *   schemas:
 *     UploadedFile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único do arquivo
 *         originalName:
 *           type: string
 *           description: Nome original do arquivo
 *         filename:
 *           type: string
 *           description: Nome do arquivo no servidor
 *         mimetype:
 *           type: string
 *           description: Tipo MIME do arquivo
 *         size:
 *           type: number
 *           description: Tamanho do arquivo em bytes
 *         url:
 *           type: string
 *           description: URL para acessar o arquivo
 *         uploadedBy:
 *           type: string
 *           description: ID do usuário que fez o upload
 *         empresaId:
 *           type: string
 *           description: ID da empresa
 *         category:
 *           type: string
 *           enum: [image, document, logo]
 *           description: Categoria do arquivo
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 */

export default router;