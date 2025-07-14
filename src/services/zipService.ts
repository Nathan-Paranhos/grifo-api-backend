import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import { Platform } from 'react-native';
import { StorageService, PendingInspection } from './storageService';

interface ZipResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export class ZipService {
  // Diretório para armazenar arquivos ZIP temporários
  private static readonly ZIP_DIRECTORY = 
    FileSystem.documentDirectory + 'zips/';

  // Inicializa o diretório de ZIPs se não existir
  private static async ensureZipDirectoryExists(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.ZIP_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.ZIP_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error('Erro ao criar diretório de ZIPs:', error);
      throw error;
    }
  }

  // Compacta fotos de uma inspeção em um arquivo ZIP
  static async compressPhotos(inspection: PendingInspection): Promise<ZipResult> {
    try {
      await this.ensureZipDirectoryExists();

      // Verificar se há fotos para compactar
      if (!inspection.fotos || inspection.fotos.length === 0) {
        return {
          success: false,
          error: 'Não há fotos para compactar',
        };
      }

      // Criar uma nova instância de JSZip
      const zip = new JSZip();

      // Adicionar cada foto ao arquivo ZIP
      for (let i = 0; i < inspection.fotos.length; i++) {
        const photoUri = inspection.fotos[i];
        try {
          // Verificar se o arquivo existe
          const fileInfo = await FileSystem.getInfoAsync(photoUri);
          if (!fileInfo.exists) {
            console.warn(`Foto não encontrada: ${photoUri}`);
            continue;
          }

          // Ler o arquivo como base64
          const fileContent = await FileSystem.readAsStringAsync(photoUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Extrair o nome do arquivo da URI
          const fileName = photoUri.split('/').pop() || `foto_${i + 1}.jpg`;

          // Adicionar o arquivo ao ZIP
          zip.file(fileName, fileContent, { base64: true });
        } catch (fileError) {
          console.error(`Erro ao processar foto ${photoUri}:`, fileError);
          // Continuar com as próximas fotos mesmo se uma falhar
        }
      }

      // Gerar o arquivo ZIP
      const zipContent = await zip.generateAsync({
        type: 'base64',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6, // Nível de compressão (1-9)
        },
      });

      // Salvar o arquivo ZIP
      const zipPath = `${this.ZIP_DIRECTORY}fotos_vistoria_${inspection.id}.zip`;
      await FileSystem.writeAsStringAsync(zipPath, zipContent, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return {
        success: true,
        filePath: zipPath,
      };
    } catch (error) {
      console.error('Erro ao compactar fotos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao compactar fotos',
      };
    }
  }

  // Compartilha o arquivo ZIP gerado
  static async shareZip(zipPath: string): Promise<boolean> {
    try {
      // Verificar se o arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(zipPath);
      if (!fileInfo.exists) {
        throw new Error('Arquivo ZIP não encontrado');
      }

      // Compartilhar o arquivo
      await FileSystem.shareAsync(zipPath, {
        mimeType: 'application/zip',
        dialogTitle: 'Compartilhar Fotos da Vistoria',
        UTI: 'com.pkware.zip-archive',
      });

      return true;
    } catch (error) {
      console.error('Erro ao compartilhar ZIP:', error);
      return false;
    }
  }

  // Exclui um arquivo ZIP
  static async deleteZip(zipPath: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(zipPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(zipPath);
      }
      return true;
    } catch (error) {
      console.error('Erro ao excluir ZIP:', error);
      return false;
    }
  }

  // Limpa todos os arquivos ZIP temporários
  static async clearAllZips(): Promise<boolean> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.ZIP_DIRECTORY);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.ZIP_DIRECTORY, { idempotent: true });
        await this.ensureZipDirectoryExists();
      }
      return true;
    } catch (error) {
      console.error('Erro ao limpar diretório de ZIPs:', error);
      return false;
    }
  }
}