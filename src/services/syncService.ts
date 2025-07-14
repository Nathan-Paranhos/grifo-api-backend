import { ApiService } from './apiService';
import { StorageService, PendingInspection } from './storageService';
import { UploadService } from './uploadService';
import { validateInspection } from '../utils/validation';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { fetchWithTimeout, FetchTimeoutError } from '../utils/fetchWithTimeout';
import * as FileSystem from 'expo-file-system';

export class SyncService {
  private static async isOnline(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected === true;
      const isReachable = netInfo.isInternetReachable === true;
      
      // Verificação adicional de conectividade com o servidor
      if (isConnected && isReachable) {
        try {
          // Fazer uma requisição rápida para verificar se o servidor está acessível
          // Aumentar o timeout para 10 segundos para dar mais tempo ao servidor
          const response = await fetchWithTimeout(
            `${ApiService.getApiBaseUrl()}/api/health`, 
            { timeout: 10000 }
          );
          
          // Verificar se a resposta é válida
          if (response.ok) {
            try {
              const data = await response.json();
              return data && data.status === 'ok';
            } catch (e) {
              // Se não conseguir parsear o JSON, pelo menos a resposta foi ok
              return response.ok;
            }
          }
          return false;
        } catch (error) {
          console.log('Servidor não está acessível:', error);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar conectividade:', error);
      // Em caso de erro ao verificar, assumimos que está offline para evitar perda de dados
      return false;
    }
  }

  // Sync all pending inspections to the server
  static async syncPendingInspections(
    vistoriadorId: string,
    empresaId: string,
    onProgress?: (message: string, progress?: { current: number, total: number }) => void,
    options?: {
      batchSize?: number; // Tamanho do lote para upload de fotos
      maxRetries?: number; // Número máximo de tentativas para operações críticas
      retryDelay?: number; // Tempo de espera entre tentativas em ms
      exponentialBackoff?: boolean; // Usar backoff exponencial para retentativas
    }
  ): Promise<{
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
    connectionQuality?: 'good' | 'poor' | 'none';
    partialSuccess?: boolean;
  }> {
    try {
      const { showAlerts = true, forceSync = false, maxRetries = 3, batchSize = 3 } = options || {};
      let connectionQuality: 'good' | 'poor' | 'none' = 'none';
      
      // Verificar conexão com a internet com múltiplas tentativas
      let isConnected = false;
      let connectionAttempts = 0;
      const maxConnectionAttempts = 3;
      
      while (!isConnected && connectionAttempts < maxConnectionAttempts) {
        connectionAttempts++;
        onProgress?.(`Verificando conexão com o servidor (tentativa ${connectionAttempts}/${maxConnectionAttempts})...`);
        
        isConnected = await this.isOnline();
        
        if (!isConnected && connectionAttempts < maxConnectionAttempts) {
          // Esperar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Determinar qualidade da conexão com base no número de tentativas necessárias
      if (isConnected) {
        connectionQuality = connectionAttempts === 1 ? 'good' : 'poor';
      } else {
        connectionQuality = 'none';
      }
      
      if (!isConnected && !forceSync) {
        const errorMsg = 'Sem conexão com a internet ou servidor indisponível. Sincronização cancelada.';
        onProgress?.(errorMsg);
        if (showAlerts) {
          Alert.alert('Sincronização Cancelada', errorMsg);
        }
        return {
          success: false,
          partialSuccess: false,
          synced: 0,
          failed: 0,
          errors: ['Sem conexão com a internet após múltiplas tentativas. Tente novamente quando estiver online.'],
          connectionQuality
        };
      }
      
      if (!isConnected && forceSync) {
        onProgress?.('Tentando sincronizar mesmo com conexão instável...');
      }

      // Obter inspeções pendentes
      onProgress?.('Carregando vistorias pendentes...');
      const pendingInspections = await StorageService.getPendingInspections();
      
      // Filtrar apenas inspeções com status 'pending'
      const inspectionsToSync = pendingInspections.filter(inspection => inspection.status === 'pending');
      
      if (inspectionsToSync.length === 0) {
        return {
          success: true,
          synced: 0,
          failed: 0,
          errors: [],
        };
      }

      onProgress?.('Iniciando sincronização...', { current: 0, total: inspectionsToSync.length });
      
      // Processar cada inspeção pendente
      const processedInspections = [];
      const failedInspections = [];
      const errorMessages = [];

      for (let i = 0; i < inspectionsToSync.length; i++) {
        const inspection = inspectionsToSync[i];
        onProgress?.(`Processando vistoria ${i + 1} de ${inspectionsToSync.length}...`, { 
          current: i, 
          total: inspectionsToSync.length 
        });

        try {
          // Verificar novamente a conexão a cada 3 inspeções
          if (i > 0 && i % 3 === 0) {
            const stillConnected = await this.isOnline();
            if (!stillConnected) {
              throw new Error('Conexão com a internet perdida durante a sincronização.');
            }
          }
          
          // Validar dados da inspeção
          const validationResult = validateInspection(inspection);
          if (!validationResult.success) {
            const errors = validationResult.errors?.map(e => `${e.path}: ${e.message}`).join(', ');
            throw new Error(`Dados inválidos: ${errors}`);
          }

          // Upload de fotos com retry e processamento em lotes
          if (inspection.fotos && inspection.fotos.length > 0) {
            onProgress?.(`Preparando upload de fotos da vistoria ${i + 1}...`, { 
              current: i, 
              total: inspectionsToSync.length 
            });

            const uploadResult = await UploadService.uploadPhotos(
              inspection.fotos,
              inspection.id,
              {
                maxRetries,
                retryDelay,
                batchSize,
                exponentialBackoff: options?.exponentialBackoff || true,
                onProgress: (current, total, message) => {
                  onProgress?.(`${message || `Enviando foto ${current} de ${total} da vistoria ${i + 1}...`}`, { 
                    current: i, 
                    total: pendingInspections.length 
                  });
                },
                onRetry: (photoIndex, attempt, error, nextDelay) => {
                  console.log(`Retentando upload da foto ${photoIndex} da vistoria ${inspection.id} (tentativa ${attempt})`);
                  onProgress?.(`Retentando foto ${photoIndex+1}/${inspection.fotos.length} da vistoria ${i+1} (tentativa ${attempt}). Aguardando ${nextDelay/1000}s...`, {
                    current: i,
                    total: pendingInspections.length
                  });
                },
                onBatchComplete: (batchIndex, totalBatches, successCount, failCount) => {
                  onProgress?.(`Lote ${batchIndex+1}/${totalBatches} concluído: ${successCount} fotos enviadas, ${failCount} falhas.`, {
                    current: i,
                    total: pendingInspections.length
                  });
                }
              }
            );

            if (!uploadResult.success) {
              // Marcar inspeção com erro, mas continuar com as outras
              await StorageService.updatePendingInspectionStatus(inspection.id, 'error');
              failedInspections.push(inspection);
              
              // Registrar informações detalhadas sobre o erro
              console.error(`Falha no upload de fotos para inspeção ${inspection.id}:`, {
                failedIndexes: uploadResult.failedIndexes,
                errors: uploadResult.errors,
                totalFotos: inspection.fotos.length,
                uploadedFotos: uploadResult.urls?.length || 0
              });
              
              errorMessages.push(`Erro no upload de fotos: ${uploadResult.errors?.join(', ')}`);
              continue;
            }

            // Atualizar inspeção com URLs das fotos
            processedInspections.push({
              ...inspection,
              fotos: uploadResult.urls || [],
            });
          } else {
            processedInspections.push(inspection);
          }
        } catch (error) {
          console.error(`Erro processando inspeção ${inspection.id}:`, error);
          await StorageService.updatePendingInspectionStatus(inspection.id, 'error');
          failedInspections.push(inspection);
          errorMessages.push(error instanceof Error ? error.message : 'Erro desconhecido');
        }
      }

      // Se todas as inspeções falharam, retornar erro
      if (processedInspections.length === 0 && failedInspections.length > 0) {
        return {
          success: false,
          partialSuccess: false,
          synced: 0,
          failed: failedInspections.length,
          errors: errorMessages,
        };
      }

      // Sincronizar inspeções processadas com o servidor
      if (processedInspections.length > 0) {
        onProgress?.(`Enviando dados para o servidor...`, { 
          current: pendingInspections.length - failedInspections.length, 
          total: pendingInspections.length 
        });

        try {
          // ApiService já usa fetchWithTimeout internamente
          const syncResult = await ApiService.syncPendingInspections({
            pendingInspections: processedInspections,
            vistoriadorId,
            empresaId,
          });

          if (!syncResult.success) {
            // Adicionar aos erros já existentes
            failedInspections.push(...processedInspections);
            errorMessages.push(syncResult.error || 'Falha na sincronização com o servidor');
            
            // Atualizar status das inspeções para erro
            for (const inspection of processedInspections) {
              await StorageService.updatePendingInspectionStatus(inspection.id, 'error');
            }

            return {
              success: false,
              partialSuccess: false,
              synced: 0,
              failed: pendingInspections.length,
              errors: errorMessages,
            };
          }

          const { synced, failed, results, errors } = syncResult.data!;

          // Atualizar armazenamento local - remover inspeções sincronizadas com sucesso
          for (const result of results) {
            if (result.status === 'success') {
              // Marcar como sincronizada antes de remover
              await StorageService.updatePendingInspectionStatus(result.localId, 'synced');
              // Remover da lista de pendentes
              await StorageService.removePendingInspection(result.localId);
            } else {
              // Atualizar status para erro
              await StorageService.updatePendingInspectionStatus(result.localId, 'error');
              // Adicionar à lista de erros
              const errorInfo = errors.find(e => e.inspectionId === result.localId);
              if (errorInfo) {
                errorMessages.push(errorInfo.error);
              }
            }
          }

          // Adicionar erros do servidor aos erros locais
          for (const error of errors) {
            errorMessages.push(error.error);
          }
      
          // Armazenar timestamp da última sincronização bem-sucedida
          if (synced > 0) {
            const now = new Date().toISOString();
            await StorageService.saveOfflineData('lastSyncAt', now);
          }

          return {
            success: true,
            partialSuccess: failed > 0 || failedInspections.length > 0,
            synced,
            failed: failed + failedInspections.length,
            errors: errorMessages,
            connectionQuality
          };
        } catch (error) {
          console.error('Erro na sincronização com o servidor:', error);
          
          // Mensagem de erro específica para diferentes tipos de erro
          let errorMessage = 'Erro desconhecido durante a sincronização';
          
          if (error instanceof FetchTimeoutError) {
            errorMessage = 'Tempo limite excedido ao conectar com o servidor. Tente novamente mais tarde.';
          } else if (error instanceof TypeError && error.message.includes('Network request failed')) {
            errorMessage = 'Falha na conexão de rede. Verifique se você está online.';
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }
          
          // Marcar todas as inspeções como erro
          for (const inspection of processedInspections) {
            await StorageService.updatePendingInspectionStatus(inspection.id, 'error');
          }
          
          return {
            success: false,
            partialSuccess: false,
            synced: 0,
            failed: pendingInspections.length,
            errors: [errorMessage],
          };
        }
      }
      
      // Se chegou aqui sem processar nenhuma inspeção (improvável)
      return {
        success: true,
        partialSuccess: failedInspections.length > 0,
        synced: 0,
        failed: failedInspections.length,
        errors: errorMessages,
        connectionQuality
      };

    } catch (error) {
      console.error('Error in sync service:', error);
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
        connectionQuality: 'none'
      };
    }
  }

  // Auto-sync when app comes online with improved error handling and user feedback
  static async autoSync(vistoriadorId: string, empresaId: string, options?: {
    showAlerts?: boolean;
    forceSync?: boolean; // Forçar sincronização mesmo se não houver conexão estável
    maxRetries?: number; // Número máximo de tentativas para operações críticas
    batchSize?: number; // Tamanho do lote para upload de fotos
    retryDelay?: number; // Tempo de espera entre tentativas em ms
    exponentialBackoff?: boolean; // Usar backoff exponencial para retentativas
    onProgress?: (status: string, progress?: { current: number, total: number }) => void;
  }): Promise<{
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
    connectionQuality?: 'good' | 'poor' | 'none';
    partialSuccess?: boolean;
  }> {
    const { showAlerts = true, forceSync = false, maxRetries = 2, onProgress } = options || {};
    let connectionQuality: 'good' | 'poor' | 'none' = 'none';

    try {
      // Verificar conexão com a internet com múltiplas tentativas
      let isConnected = false;
      let connectionAttempts = 0;
      const maxConnectionAttempts = 3;
      
      while (!isConnected && connectionAttempts < maxConnectionAttempts) {
        connectionAttempts++;
        onProgress?.(`Verificando conexão com o servidor (tentativa ${connectionAttempts}/${maxConnectionAttempts})...`);
        
        isConnected = await this.isOnline();
        
        if (!isConnected && connectionAttempts < maxConnectionAttempts) {
          // Esperar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Determinar qualidade da conexão com base no número de tentativas necessárias
      if (isConnected) {
        connectionQuality = connectionAttempts === 1 ? 'good' : 'poor';
      } else {
        connectionQuality = 'none';
      }
      
      if (!isConnected && !forceSync) {
        const errorMsg = 'Sem conexão com a internet ou servidor indisponível. Sincronização cancelada.';
        onProgress?.(errorMsg);
        if (showAlerts) {
          Alert.alert('Sincronização Cancelada', errorMsg);
        }
        return {
          success: false,
          synced: 0,
          failed: 0,
          errors: ['Sem conexão com a internet após múltiplas tentativas. Tente novamente quando estiver online.'],
          connectionQuality
        };
      }
      
      if (!isConnected && forceSync) {
        onProgress?.('Tentando sincronizar mesmo com conexão instável...');
      }

      onProgress?.('Verificando vistorias pendentes...');
      
      const pendingInspections = await StorageService.getPendingInspections();
      const pendingCount = pendingInspections.filter(i => i.status === 'pending').length;
      const errorCount = pendingInspections.filter(i => i.status === 'error').length;
      
      if (pendingCount === 0 && errorCount === 0) {
        const infoMsg = 'Nenhuma vistoria pendente ou com erro para sincronizar.';
        onProgress?.(infoMsg);
        return {
          success: true,
          synced: 0,
          failed: 0,
          errors: [],
          connectionQuality
        };
      }
      
      if (pendingCount > 0) {
        onProgress?.(`Encontradas ${pendingCount} vistorias pendentes para sincronizar.`);
      }
      
      if (errorCount > 0) {
        onProgress?.(`Encontradas ${errorCount} vistorias com erro que serão ignoradas. Use a opção "Retentar Vistorias com Erro" para sincronizá-las.`);
      }
      
      // Verificar qualidade da conexão antes de prosseguir
      if (connectionQuality === 'poor' && showAlerts && !forceSync) {
        return new Promise((resolve) => {
          Alert.alert(
            'Conexão instável',
            'A conexão com o servidor parece estar instável. A sincronização pode levar mais tempo ou falhar. Deseja continuar?',
            [
              { 
                text: 'Cancelar', 
                style: 'cancel',
                onPress: () => {
                  onProgress?.('Sincronização cancelada pelo usuário.');
                  resolve({
                    success: false,
                    synced: 0,
                    failed: 0,
                    errors: ['Sincronização cancelada pelo usuário devido à conexão instável.'],
                    connectionQuality
                  });
                }
              },
              { 
                text: 'Continuar', 
                onPress: async () => {
                  onProgress?.('Continuando sincronização com conexão instável...');
                  // Continuar com a sincronização
                  this.proceedWithSync(vistoriadorId, empresaId, onProgress, options, connectionQuality)
                    .then(resolve);
                } 
              },
            ]
          );
        });
      }
      
      // Prosseguir com a sincronização normalmente
      return this.proceedWithSync(vistoriadorId, empresaId, onProgress, options, connectionQuality);
    } catch (error) {
      console.error('Auto-sync failed:', error);
      
      // Tratamento específico para diferentes tipos de erro
      let errorMessage = 'Falha na sincronização automática. Tente novamente mais tarde.';
      
      if (error instanceof FetchTimeoutError) {
        errorMessage = 'Tempo limite excedido ao conectar com o servidor durante a sincronização automática.';
      } else if (error instanceof TypeError && error.message.includes('Network request failed')) {
        errorMessage = 'Falha na conexão de rede durante a sincronização automática. Verifique se você está online.';
      } else if (error instanceof Error) {
        errorMessage = `Erro na sincronização automática: ${error.message}`;
      }
      
      onProgress?.(errorMessage);
      if (showAlerts) {
        Alert.alert('Erro de Sincronização', errorMessage);
      }
      
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [errorMessage],
        connectionQuality
      };
    }
  }
  
  // Método auxiliar para prosseguir com a sincronização
  private static async proceedWithSync(
    vistoriadorId: string, 
    empresaId: string, 
    onProgress?: (message: string, progress?: { current: number, total: number }) => void,
    options?: {
      showAlerts?: boolean;
      forceSync?: boolean;
      maxRetries?: number;
      batchSize?: number;
      retryDelay?: number;
      exponentialBackoff?: boolean;
    },
    connectionQuality: 'good' | 'poor' | 'none' = 'good'
  ): Promise<{
    success: boolean;
    partialSuccess?: boolean;
    synced: number;
    failed: number;
    errors: string[];
    connectionQuality: 'good' | 'poor' | 'none';
  }> {
    // Usar o método syncPendingInspections com feedback de progresso
    const result = await this.syncPendingInspections(
      vistoriadorId, 
      empresaId,
      (message, progress) => {
        // Converter o progresso para uma mensagem de status
        if (progress) {
          const percent = Math.round((progress.current / progress.total) * 100);
          onProgress?.(`${message} (${percent}%)`, progress);
        } else {
          onProgress?.(message);
        }
      },
      {
        batchSize: options?.batchSize,
        maxRetries: options?.maxRetries,
        retryDelay: options?.retryDelay || 2000,
        exponentialBackoff: options?.exponentialBackoff || true
      }
    );
    
    // Exibir resultado final
    if (result.success) {
      if (result.synced > 0) {
        const successMsg = `Sincronização concluída: ${result.synced} vistorias sincronizadas com sucesso.`;
        onProgress?.(successMsg);
        // Mostrar toast de sucesso
        if (options?.showAlerts) {
          Alert.alert('Sincronização Concluída', successMsg);
        }
      } else {
        onProgress?.('Sincronização concluída. Nenhuma vistoria foi sincronizada.');
      }
      
      // Se houve falhas parciais
      if (result.failed > 0) {
        onProgress?.(`Atenção: ${result.failed} vistorias não puderam ser sincronizadas.`);
      }
    } else {
      if (result.errors.length > 0) {
        const errorMessage = result.errors[0];
        onProgress?.(`Erro na sincronização: ${errorMessage}`);
        // Mostrar toast de erro
        if (options?.showAlerts) {
          Alert.alert('Erro na Sincronização', errorMessage);
        }
      } else {
        const genericError = 'Erro na sincronização. Tente novamente mais tarde.';
        onProgress?.(genericError);
        if (options?.showAlerts) {
          Alert.alert('Erro na Sincronização', genericError);
        }
      }
    }
    
    return {
      ...result,
      connectionQuality
    };
  }

  // Get sync status
  static async getSyncStatus(): Promise<{
    pendingCount: number;
    errorCount: number;
    syncedCount: number;
    lastSyncAt: string | null;
    hasErrors: boolean;
    isOnline: boolean;
  }> {
    try {
      const pendingInspections = await StorageService.getPendingInspections();
      
      // Contar inspeções por status
      const pendingCount = pendingInspections.filter(i => i.status === 'pending').length;
      const errorCount = pendingInspections.filter(i => i.status === 'error').length;
      const syncedCount = pendingInspections.filter(i => i.status === 'synced').length;
      const hasErrors = errorCount > 0;
      
      // Get last sync timestamp from storage
      const lastSyncAt = await StorageService.getOfflineData('lastSyncAt');
      
      // Verificar conectividade
      const isOnline = await this.isOnline();

      return {
        pendingCount,
        errorCount,
        syncedCount,
        lastSyncAt,
        hasErrors,
        isOnline
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        pendingCount: 0,
        errorCount: 0,
        syncedCount: 0,
        lastSyncAt: null,
        hasErrors: false,
        isOnline: false
      };
    }
  }

  // Retry failed inspections with improved error handling and progress reporting
  static async retryFailedInspections(
    vistoriadorId: string, 
    empresaId: string, 
    onProgress?: (message: string, progress?: { current: number, total: number }) => void,
    options?: {
      showAlerts?: boolean;
      forceSync?: boolean; // Forçar sincronização mesmo se não houver conexão estável
      maxRetries?: number; // Número máximo de tentativas para operações críticas
      batchSize?: number; // Tamanho do lote para upload de fotos
      retryDelay?: number; // Tempo de espera entre tentativas em ms
      exponentialBackoff?: boolean; // Usar backoff exponencial para retentativas
    }
  ): Promise<{
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
    retriedIds?: string[];
    connectionQuality?: 'good' | 'poor' | 'none';
    partialSuccess?: boolean;
  }> {
    try {
      const { batchSize = 3, maxRetries = 3, retryDelay = 2000 } = options || {};
      let connectionQuality: 'good' | 'poor' | 'none' = 'none';
      
      // Verificar conexão com a internet com múltiplas tentativas
      let isConnected = false;
      let connectionAttempts = 0;
      const maxConnectionAttempts = 3;
      
      while (!isConnected && connectionAttempts < maxConnectionAttempts) {
        connectionAttempts++;
        onProgress?.(`Verificando conexão com o servidor (tentativa ${connectionAttempts}/${maxConnectionAttempts})...`);
        
        isConnected = await this.isOnline();
        
        if (!isConnected && connectionAttempts < maxConnectionAttempts) {
          // Esperar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Determinar qualidade da conexão com base no número de tentativas necessárias
      if (isConnected) {
        connectionQuality = connectionAttempts === 1 ? 'good' : 'poor';
      } else {
        connectionQuality = 'none';
      }
      
      if (!isConnected) {
        return {
          success: false,
          partialSuccess: false,
          synced: 0,
          failed: 0,
          errors: ['Sem conexão com a internet após múltiplas tentativas. Tente novamente quando estiver online.'],
          connectionQuality
        };
      }

      // Obter inspeções com erro
      onProgress?.('Verificando vistorias com erro...');

      // Get all inspections with error status
      const pendingInspections = await StorageService.getPendingInspections();
      const failedInspections = pendingInspections.filter(
        (inspection) => inspection.status === 'error'
      );

      if (failedInspections.length === 0) {
        const infoMsg = 'Nenhuma vistoria com erro encontrada.';
        onProgress?.(infoMsg);
        return {
          success: true,
          synced: 0,
          failed: 0,
          errors: [],
          retriedIds: [],
          partialSuccess: false
        };
      }

      onProgress?.(`Preparando para retentar ${failedInspections.length} vistorias...`);
      
      // Armazenar IDs das inspeções que estão sendo retentadas
      const retriedIds = failedInspections.map(inspection => inspection.id);
      
      // Registrar informações sobre as inspeções com erro
      console.log(`Retentando ${failedInspections.length} inspeções com erro:`, {
        ids: retriedIds,
        timestamps: failedInspections.map(i => i.createdAt),
      });
      
      // Resetar status para 'pending' com verificação
      for (let i = 0; i < failedInspections.length; i++) {
        const inspection = failedInspections[i];
        onProgress?.(`Preparando vistoria ${i + 1} de ${failedInspections.length} para reenvio...`, { 
          current: i, 
          total: failedInspections.length 
        });
        
        try {
          // Verificar se as fotos ainda existem antes de tentar reenviar
          if (inspection.fotos && inspection.fotos.length > 0) {
            let fotosExistem = true;
            for (const foto of inspection.fotos) {
              try {
                if (foto.startsWith('file://')) {
                  const fileInfo = await FileSystem.getInfoAsync(foto);
                  if (!fileInfo.exists) {
                    fotosExistem = false;
                    console.error(`Arquivo de foto não encontrado: ${foto}`);
                    break;
                  }
                }
              } catch (e) {
                console.error(`Erro ao verificar existência da foto: ${foto}`, e);
                fotosExistem = false;
                break;
              }
            }
            
            if (!fotosExistem) {
              onProgress?.(`Erro: Algumas fotos da vistoria ${i + 1} não foram encontradas. Verifique se os arquivos ainda existem.`, {
                current: i,
                total: failedInspections.length
              });
              continue; // Pular esta inspeção e continuar com as outras
            }
          }
          
          await StorageService.updatePendingInspectionStatus(inspection.id, 'pending');
        } catch (error) {
          console.error(`Erro ao resetar status da inspeção ${inspection.id}:`, error);
          // Continuar com as outras inspeções mesmo se houver erro em uma delas
        }
      }

      // Tentar sincronizar novamente com tratamento de progresso personalizado
      const syncResult = await this.syncPendingInspections(
        vistoriadorId, 
        empresaId, 
        (message, progress) => {
          // Personalizar mensagens para indicar que é uma retentativa
          const customMessage = message.replace('vistoria', 'vistoria (retentativa)');
          onProgress?.(customMessage, progress);
        },
        {
          batchSize: options?.batchSize,
          maxRetries: options?.maxRetries,
          retryDelay: options?.retryDelay || 2000,
          exponentialBackoff: options?.exponentialBackoff || true
        }
      );
      
      // Adicionar IDs retentados ao resultado
      return {
        ...syncResult,
        retriedIds,
        connectionQuality,
        partialSuccess: syncResult.partialSuccess
      };
    } catch (error) {
      console.error('Retry failed inspections error:', error);
      
      // Tratamento específico para diferentes tipos de erro
      let errorMessage = 'Erro desconhecido ao retentar sincronização';
      
      if (error instanceof FetchTimeoutError) {
        errorMessage = 'Tempo limite excedido ao conectar com o servidor durante a retentativa.';
      } else if (error instanceof TypeError && error.message.includes('Network request failed')) {
        errorMessage = 'Falha na conexão de rede durante a retentativa. Verifique se você está online.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      onProgress?.(`Erro ao retentar sincronização: ${errorMessage}`);
      if (options?.showAlerts) {
        Alert.alert('Erro na Sincronização', errorMessage);
      }
      return {
        success: false,
        partialSuccess: false,
        synced: 0,
        failed: 0,
        errors: [errorMessage],
        connectionQuality: 'none'
      };
    }
  }
}