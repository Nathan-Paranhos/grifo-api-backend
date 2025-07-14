import * as FileSystem from 'expo-file-system';
import { GDrive } from '@robinbobin/react-native-google-drive-api-wrapper';

// Configuração inicial do GDrive (pode ser ajustada conforme necessário)
const gdrive = new GDrive();

export class GoogleDriveService {
  static async uploadFile(filePath: string, folderId: string): Promise<{ success: boolean; fileId?: string }> {
    try {
      const fileName = filePath.split('/').pop();
      if (!fileName) {
        throw new Error('Nome do arquivo inválido');
      }

      const fileContent = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Fazer o upload do arquivo
      const result = await gdrive.files.createFileMultipart(
        fileContent,
        'application/pdf',
        {
          parents: [folderId],
          name: fileName,
        },
        true // `isBase64` - informa que o conteúdo está em Base64
      );

      return { success: true, fileId: result.id };
    } catch (error) {
      console.error('Erro ao fazer upload para o Google Drive:', error);
      return { success: false };
    }
  }

  static async setAccessToken(token: string) {
    gdrive.setAccessToken(token);
  }

  static async getOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string | null> {
    try {
      let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      }

      const folderList = await gdrive.files.list({ q: query });

      if (folderList.files.length > 0) {
        return folderList.files[0].id;
      } else {
        const newFolder = await gdrive.files.createFileMultipart(
          '',
          'application/vnd.google-apps.folder',
          {
            parents: parentFolderId ? [parentFolderId] : [],
            name: folderName,
          }
        );
        return newFolder.id;
      }
    } catch (error) {
      console.error('Erro ao criar ou obter pasta no Google Drive:', error);
      return null;
    }
  }
}