import { PDFDocument, PDFPage, PDFImage, PDFFont } from 'react-native-pdf-lib';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { StorageService, PendingInspection } from './storageService';
import Constants from 'expo-constants';

interface PDFGenerationResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export class PDFService {
  // Diretório para armazenar PDFs temporários
  private static readonly PDF_DIRECTORY = 
    FileSystem.documentDirectory + 'pdfs/';

  // Inicializa o diretório de PDFs se não existir
  private static async ensurePDFDirectoryExists(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.PDF_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.PDF_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error('Erro ao criar diretório de PDFs:', error);
      throw error;
    }
  }

  // Gera um PDF para uma inspeção
  static async generatePDF(inspection: PendingInspection): Promise<PDFGenerationResult> {
    try {
      await this.ensurePDFDirectoryExists();

      // Criar um novo documento PDF
      const pdfDoc = await PDFDocument.create();
      
      // Adicionar uma página ao documento
      let page = pdfDoc.addPage(595, 842); // Tamanho A4
      
      // Adicionar cabeçalho
      page.drawRectangle({
        x: 0,
        y: 780,
        width: 595,
        height: 62,
        color: '#000000',
      });

      // Adicionar logo (placeholder)
      page.drawText('GRIFO VISTORIAS', {
        x: 50,
        y: 800,
        fontSize: 24,
        color: '#C8A157',
      });

      const tipoVistoria = {
        'entrada': 'VISTORIA DE ENTRADA',
        'saida': 'VISTORIA DE SAÍDA',
        'manutencao': 'VISTORIA DE MANUTENÇÃO'
      }[inspection.tipo] || 'VISTORIA';

      page.drawText(tipoVistoria, {
        x: 50,
        y: 750,
        fontSize: 18,
        color: '#FFFFFF',
      });

      // Adicionar informações da vistoria
      page.drawText(`Data: ${new Date(inspection.createdAt).toLocaleDateString('pt-BR')}`, {
        x: 450,
        y: 800,
        fontSize: 12,
        color: '#FFFFFF',
      });

      page.drawText(`ID: ${inspection.id}`, {
        x: 450,
        y: 785,
        fontSize: 12,
        color: '#FFFFFF',
      });

      page.drawText(`Imóvel: ${inspection.imovelId}`, {
        x: 50,
        y: 720,
        fontSize: 14,
        color: '#000000',
      });

      // Adicionar checklist
      page.drawText('CHECKLIST DE VISTORIA', {
        x: 50,
        y: 690,
        fontSize: 16,
        color: '#000000',
      });

      let yPosition = 660;
      const lineHeight = 20;

      // Desenhar itens do checklist
      for (const [item, status] of Object.entries(inspection.checklist)) {
        if (yPosition < 50) {
          page = pdfDoc.addPage(595, 842);
          yPosition = 800;
        }

        const statusText = {
          'otimo': 'Ótimo',
          'regular': 'Regular',
          'danificado': 'Danificado'
        }[status] || status;

        page
          .drawText(`${item}:`, {
            x: 50,
            y: yPosition,
            fontSize: 12,
            color: '#000000',
          })
          .drawText(statusText, {
            x: 200,
            y: yPosition,
            fontSize: 12,
            color: '#C8A157',
          });

        yPosition -= lineHeight;
      }

      // Adicionar observações
      if (inspection.observacoes) {
        // Se não houver espaço suficiente para as observações, criar uma nova página
        if (yPosition < 100) { // Check for space for title and at least one line
          page = pdfDoc.addPage(595, 842);
          yPosition = 800;
        }

        yPosition -= 20; // Espaço antes da seção
        page.drawText('OBSERVAÇÕES GERAIS', {
          x: 50,
          y: yPosition,
          fontSize: 16,
          color: '#000000',
        });
        yPosition -= 20;

        page.drawText(inspection.observacoes, {
          x: 50,
          y: yPosition,
          fontSize: 12,
          color: '#000000',
          lineHeight: 15,
          maxWidth: 495,
        });
      }

      // Salvar o PDF
      const pdfPath = `${this.PDF_DIRECTORY}vistoria_${inspection.id}.pdf`;
      const { success, base64 } = await pdfDoc.write();

      if (success) {
        await FileSystem.writeAsStringAsync(pdfPath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        return {
          success: true,
          filePath: pdfPath,
        };
      } else {
        throw new Error('Falha ao gerar o PDF');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar PDF',
      };
    }
  }

  // Adiciona imagens ao PDF (em uma nova página)
  static async addImagesToPDF(pdfPath: string, photos: { uri: string; comment: string }[]): Promise<PDFGenerationResult> {
    try {
      // Verificar se o PDF existe
      const pdfInfo = await FileSystem.getInfoAsync(pdfPath);
      if (!pdfInfo.exists) {
        throw new Error('PDF não encontrado');
      }

      // Ler o PDF existente
      const pdfBase64 = await FileSystem.readAsStringAsync(pdfPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Carregar o PDF existente
      const pdfDoc = await PDFDocument.fromBase64(pdfBase64);

      // Adicionar cada imagem em uma nova página
      for (const photo of photos) {
        try {
          // Ler a imagem como base64
          const imageInfo = await FileSystem.getInfoAsync(photo.uri);
          if (!imageInfo.exists) {
            console.warn(`Imagem não encontrada: ${photo.uri}`);
            continue;
          }

          const imageBase64 = await FileSystem.readAsStringAsync(photo.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Determinar o tipo de imagem
          const imageType = photo.uri.toLowerCase().endsWith('.png') ? 'png' : 'jpg';

          // Adicionar uma nova página para a imagem
          const page = pdfDoc.addPage(595, 842); // Tamanho A4

          // Adicionar a imagem à página
          const image = await PDFImage.fromBase64(imageBase64, imageType);
          page.drawImage(image, {
            x: 50,
            y: 400, // Ajustado para dar espaço para o comentário
            width: 495,
            height: 371, // Proporção 4:3
          });

          // Adicionar comentário da foto
          if (photo.comment) {
            page.drawText(photo.comment, {
              x: 50,
              y: 380, // Posição abaixo da imagem
              fontSize: 12,
              color: '#000000',
              lineHeight: 15,
              maxWidth: 495,
            });
          }
        } catch (imageError) {
          console.error(`Erro ao processar imagem ${photo.uri}:`, imageError);
          // Continuar com as próximas imagens mesmo se uma falhar
        }
      }

      // Salvar o PDF atualizado
      const { success, base64 } = await pdfDoc.write();

      if (success) {
        await FileSystem.writeAsStringAsync(pdfPath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        return {
          success: true,
          filePath: pdfPath,
        };
      } else {
        throw new Error('Falha ao atualizar o PDF com imagens');
      }
    } catch (error) {
      console.error('Erro ao adicionar imagens ao PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao adicionar imagens',
      };
    }
  }

  // Compartilha o PDF gerado
  static async sharePDF(pdfPath: string): Promise<boolean> {
    try {
      // Verificar se o arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(pdfPath);
      if (!fileInfo.exists) {
        throw new Error('Arquivo PDF não encontrado');
      }

      // Compartilhar o arquivo
      await FileSystem.shareAsync(pdfPath, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartilhar Relatório de Vistoria',
        UTI: 'com.adobe.pdf',
      });

      return true;
    } catch (error) {
      console.error('Erro ao compartilhar PDF:', error);
      return false;
    }
  }

  // Exclui um PDF
  static async deletePDF(pdfPath: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(pdfPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(pdfPath);
      }
      return true;
    } catch (error) {
      console.error('Erro ao excluir PDF:', error);
      return false;
    }
  }

  // Limpa todos os PDFs temporários
  static async clearAllPDFs(): Promise<boolean> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.PDF_DIRECTORY);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.PDF_DIRECTORY, { idempotent: true });
        await this.ensurePDFDirectoryExists();
      }
      return true;
    } catch (error) {
      console.error('Erro ao limpar diretório de PDFs:', error);
      return false;
    }
  }
}