import * as FileSystem from 'expo-file-system';
import { StorageService, PendingInspection } from './storageService';
import { Platform } from 'react-native';

interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export class ExportService {
  // Diretório para armazenar arquivos de exportação
  private static readonly EXPORT_DIRECTORY = 
    FileSystem.documentDirectory + 'exports/';

  // Inicializa o diretório de exportação se não existir
  private static async ensureExportDirectoryExists(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.EXPORT_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.EXPORT_DIRECTORY, { intermediates: true });
      }
    } catch (error) {
      console.error('Erro ao criar diretório de exportação:', error);
      throw error;
    }
  }

  // Exporta todas as inspeções pendentes para um arquivo JSON
  static async exportAllInspections(): Promise<ExportResult> {
    try {
      await this.ensureExportDirectoryExists();

      // Obter todas as inspeções pendentes
      const pendingInspections = await StorageService.getPendingInspections();

      if (pendingInspections.length === 0) {
        return {
          success: false,
          error: 'Não há vistorias para exportar',
        };
      }

      // Criar objeto de exportação com metadados
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        count: pendingInspections.length,
        inspections: pendingInspections,
      };

      // Converter para JSON
      const jsonData = JSON.stringify(exportData, null, 2);

      // Gerar nome de arquivo com timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `vistorias_export_${timestamp}.json`;
      const filePath = `${this.EXPORT_DIRECTORY}${fileName}`;

      // Salvar o arquivo
      await FileSystem.writeAsStringAsync(filePath, jsonData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return {
        success: true,
        filePath,
      };
    } catch (error) {
      console.error('Erro ao exportar vistorias:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao exportar vistorias',
      };
    }
  }

  // Exporta uma inspeção específica para um arquivo JSON
  static async exportInspection(inspectionId: string): Promise<ExportResult> {
    try {
      await this.ensureExportDirectoryExists();

      // Obter todas as inspeções pendentes
      const pendingInspections = await StorageService.getPendingInspections();
      
      // Encontrar a inspeção específica
      const inspection = pendingInspections.find(insp => insp.id === inspectionId);

      if (!inspection) {
        return {
          success: false,
          error: 'Vistoria não encontrada',
        };
      }

      // Criar objeto de exportação com metadados
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        inspection,
      };

      // Converter para JSON
      const jsonData = JSON.stringify(exportData, null, 2);

      // Gerar nome de arquivo com ID da inspeção
      const fileName = `vistoria_${inspectionId}_${new Date().getTime()}.json`;
      const filePath = `${this.EXPORT_DIRECTORY}${fileName}`;

      // Salvar o arquivo
      await FileSystem.writeAsStringAsync(filePath, jsonData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      return {
        success: true,
        filePath,
      };
    } catch (error) {
      console.error('Erro ao exportar vistoria:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao exportar vistoria',
      };
    }
  }

  // Compartilha um arquivo de exportação
  static async shareExportFile(filePath: string): Promise<boolean> {
    try {
      // Verificar se o arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error('Arquivo de exportação não encontrado');
      }

      // Compartilhar o arquivo
      await FileSystem.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Compartilhar Dados de Vistoria',
        UTI: 'public.json',
      });

      return true;
    } catch (error) {
      console.error('Erro ao compartilhar arquivo de exportação:', error);
      return false;
    }
  }

  // Importa vistorias de um arquivo JSON
  static async importInspections(filePath: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      // Verificar se o arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        return {
          success: false,
          error: 'Arquivo de importação não encontrado',
        };
      }

      // Ler o conteúdo do arquivo
      const jsonData = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Converter de JSON para objeto
      const importData = JSON.parse(jsonData);

      // Verificar se o formato é válido
      if (!importData.inspections && !importData.inspection) {
        return {
          success: false,
          error: 'Formato de arquivo inválido',
        };
      }

      // Obter as inspeções do arquivo
      const inspectionsToImport = importData.inspections || [importData.inspection];
      
      if (inspectionsToImport.length === 0) {
        return {
          success: false,
          error: 'Não há vistorias para importar',
        };
      }

      // Obter as inspeções existentes
      const existingInspections = await StorageService.getPendingInspections();
      const existingIds = new Set(existingInspections.map(insp => insp.id));

      // Filtrar apenas as inspeções que não existem ainda
      const newInspections = inspectionsToImport.filter(insp => !existingIds.has(insp.id));

      if (newInspections.length === 0) {
        return {
          success: false,
          error: 'Todas as vistorias já existem no dispositivo',
        };
      }

      // Salvar as novas inspeções
      for (const inspection of newInspections) {
        await StorageService.savePendingInspection(inspection);
      }

      return {
        success: true,
        count: newInspections.length,
      };
    } catch (error) {
      console.error('Erro ao importar vistorias:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao importar vistorias',
      };
    }
  }

  // Limpa todos os arquivos de exportação
  static async clearAllExports(): Promise<boolean> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.EXPORT_DIRECTORY);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.EXPORT_DIRECTORY, { idempotent: true });
        await this.ensureExportDirectoryExists();
      }
      return true;
    } catch (error) {
      console.error('Erro ao limpar diretório de exportação:', error);
      return false;
    }
  }
}