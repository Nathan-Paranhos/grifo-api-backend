import * as FileSystem from 'expo-file-system';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import NetInfo from '@react-native-community/netinfo';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class UploadService {
  // Verifica se o dispositivo está conectado à internet
  private static async isOnline(): Promise<boolean> {
    try {
      // Verificação primária usando NetInfo
      const netInfo = await NetInfo.fetch();
      const isConnectedBasic = netInfo.isConnected === true && netInfo.isInternetReachable === true;
      
      // Se a verificação básica falhar, não há necessidade de fazer a verificação avançada
      if (!isConnectedBasic) {
        return false;
      }
      
      // Verificação secundária com ping para serviço confiável
      // Apenas se a verificação básica passar
      try {
        // Timeout curto para não bloquear a UI por muito tempo
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        // Usar um serviço confiável e rápido para verificar conectividade real
        const response = await fetch('https://www.google.com/generate_204', {
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response.status === 204; // Google retorna 204 quando há conectividade
      } catch (fetchError) {
        // Verificação avançada de conectividade falhou
        // Se a verificação avançada falhar mas a básica passou, ainda consideramos online
        // pois pode ser apenas o serviço específico que está indisponível
        return true;
      }
    } catch (error) {
      console.error('Erro ao verificar conectividade:', error);
      return false;
    }
  }

  // Upload de uma única foto com retry adaptativo
  static async uploadPhoto(
    photoUri: string,
    path: string,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      exponentialBackoff?: boolean;
      onProgress?: (progress: number) => void;
      onRetry?: (attempt: number, error: string, nextDelay: number) => void;
    } = {}
  ): Promise<UploadResult> {
    const { 
      maxRetries = 3, 
      retryDelay = 2000, 
      exponentialBackoff = true,
      onProgress, 
      onRetry 
    } = options;
    let lastError: Error | null = null;

    // Verificar conectividade
    const isConnected = await this.isOnline();
    if (!isConnected) {
      return {
        success: false,
        error: 'Sem conexão com a internet. Tente novamente quando estiver online.',
      };
    }

    // Tentar upload com retry adaptativo
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Se não for a primeira tentativa, aguardar antes de tentar novamente
        if (attempt > 0) {
          // Cálculo de backoff exponencial se ativado
          const currentDelay = exponentialBackoff 
            ? Math.min(retryDelay * Math.pow(2, attempt - 1), 30000) // Máximo de 30 segundos
            : retryDelay;
            
          // Notificar sobre a tentativa de retry
          onRetry?.(attempt, lastError?.message || 'Erro desconhecido', currentDelay);
          
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          // Tentativa de retry
          
          // Verificar conectividade novamente antes de cada retry
          const stillConnected = await this.isOnline();
          if (!stillConnected) {
            // Tentar reconectar antes de desistir
            // Conexão perdida. Tentando reconectar...
            
            // Esperar 3 segundos e tentar novamente
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const reconnected = await this.isOnline();
            if (!reconnected) {
              return {
                success: false,
                error: 'Conexão com a internet perdida durante o retry. Tente novamente quando estiver online.',
              };
            } else {
              // Conexão restabelecida. Continuando upload...
            }
          }
        }

        // Verificar se o arquivo existe
        const fileInfo = await FileSystem.getInfoAsync(photoUri);
        if (!fileInfo.exists && !photoUri.startsWith('data:image')) {
          throw new Error(`Arquivo não encontrado: ${photoUri}`);
        }

        // Ler o arquivo como base64 ou como blob
        let fileContent;
        if (photoUri.startsWith('file://')) {
          try {
            // Ler como blob para arquivos locais
            fileContent = await FileSystem.readAsStringAsync(photoUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } catch (readError) {
            console.error(`Erro ao ler arquivo ${photoUri}:`, readError);
            throw new Error(`Falha ao ler arquivo: ${readError.message}`);
          }
        } else if (photoUri.startsWith('data:image')) {
          // Extrair base64 de data URI
          const parts = photoUri.split(',');
          if (parts.length !== 2) {
            throw new Error(`Formato de data URI inválido: ${photoUri.substring(0, 30)}...`);
          }
          fileContent = parts[1];
        } else {
          throw new Error(`Formato de URI não suportado: ${photoUri.substring(0, 30)}...`);
        }

        // Criar referência para o arquivo no Storage
        const storageRef = ref(storage, path);

        // Progresso inicial
        onProgress?.(0.1);

        // Converter base64 para blob
        const blob = await fetch(`data:image/jpeg;base64,${fileContent}`).then(r => r.blob());
        onProgress?.(0.3);

        // Fazer upload com monitoramento de progresso
        const uploadTask = await uploadBytes(storageRef, blob);
        onProgress?.(0.7);

        // Obter URL de download
        const downloadURL = await getDownloadURL(uploadTask.ref);
        onProgress?.(1.0);

        return {
          success: true,
          url: downloadURL,
        };
      } catch (error) {
        console.error(`Upload error (attempt ${attempt}):`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Categorizar erros para melhor tratamento
        const errorMessage = lastError.message.toLowerCase();
        
        // Verificar se é um erro de permissão ou quota
        if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || errorMessage.includes('quota')) {
          // Não faz sentido tentar novamente para erros de permissão
          return {
            success: false,
            error: `Erro de permissão no Firebase Storage: ${lastError.message}`,
          };
        }
        
        // Verificar se é um erro de rede
        if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('connection')) {
          // Verificar conectividade
          const isOnline = await this.isOnline();
          if (!isOnline) {
            // Se não estiver online e não for a última tentativa, continuar tentando
            if (attempt < maxRetries) {
              // Erro de rede detectado. Aguardando reconexão...
              continue;
            }
          }
        }

        // Se for a última tentativa, retornar erro
        if (attempt === maxRetries) {
          return {
            success: false,
            error: lastError.message,
          };
        }
      }
    }

    // Fallback em caso de erro não capturado
    return {
      success: false,
      error: lastError?.message || 'Falha no upload da foto',
    };
  }

  // Upload de múltiplas fotos com retry adaptativo e processamento em lotes
  static async uploadPhotos(
    photos: string[],
    inspectionId: string,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      exponentialBackoff?: boolean;
      batchSize?: number;
      onProgress?: (current: number, total: number, message?: string) => void;
      onRetry?: (photoIndex: number, attempt: number, error: string, nextDelay: number) => void;
      onBatchComplete?: (batchIndex: number, totalBatches: number, successCount: number, failCount: number) => void;
    } = {}
  ): Promise<{
    success: boolean;
    urls?: string[];
    failedIndexes?: number[];
    errors?: string[];
    partialSuccess?: boolean; // Indica se pelo menos algumas fotos foram enviadas com sucesso
  }> {
    const { 
      onProgress, 
      onRetry, 
      onBatchComplete,
      batchSize = 3,
      maxRetries = 3,
      retryDelay = 2000,
      exponentialBackoff = true
    } = options;
    
    const results: UploadResult[] = Array(photos.length).fill(null);
    const failedIndexes: number[] = [];
    const errors: string[] = [];
    
    // Verificar se há fotos para upload
    if (!photos || photos.length === 0) {
      return {
        success: true,
        urls: [],
      };
    }
    
    // Verificar conectividade antes de iniciar
    const isConnected = await this.isOnline();
    if (!isConnected) {
      return {
        success: false,
        urls: [],
        failedIndexes: [...Array(photos.length).keys()],
        errors: ['Sem conexão com a internet. Tente novamente quando estiver online.'],
        partialSuccess: false
      };
    }
    
    // Processar fotos em lotes para melhor desempenho e controle
    for (let batchIndex = 0; batchIndex < Math.ceil(photos.length / batchSize); batchIndex++) {
      // Verificar conectividade a cada lote
      if (batchIndex > 0) {
        const stillConnected = await this.isOnline();
        if (!stillConnected) {
          // Tentar reconectar antes de desistir
          onProgress?.(0, photos.length, 'Conexão perdida. Tentando reconectar...');
          
          // Esperar 5 segundos e tentar novamente
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const reconnected = await this.isOnline();
          if (!reconnected) {
            // Marcar todas as fotos restantes como falha
            for (let j = batchIndex * batchSize; j < photos.length; j++) {
              if (!results[j]) { // Apenas se ainda não foi processado
                failedIndexes.push(j);
                errors.push('Conexão com a internet perdida durante o upload');
                results[j] = {
                  success: false,
                  error: 'Conexão com a internet perdida durante o upload',
                };
              }
            }
            break;
          } else {
            onProgress?.(0, photos.length, 'Conexão restabelecida. Continuando upload...');
          }
        }
      }
      
      // Processar o lote atual
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, photos.length);
      onProgress?.(batchStart, photos.length, `Processando lote ${batchIndex + 1} de ${Math.ceil(photos.length / batchSize)}...`);
      
      // Upload das fotos do lote atual em paralelo com retry individual
      const batchPromises = [];
      for (let i = batchStart; i < batchEnd; i++) {
        // Pular fotos que já foram processadas com sucesso
        if (results[i] && results[i].success) continue;
        
        const photoPath = `inspections/${inspectionId}/photo_${i}.jpg`;
        batchPromises.push(
          this.uploadPhoto(photos[i], photoPath, {
            maxRetries,
            retryDelay,
            exponentialBackoff,
            onProgress: progress => {
              onProgress?.(i + 1, photos.length, `Enviando foto ${i + 1} de ${photos.length}...`);
            },
            onRetry: (attempt, error, nextDelay) => {
              onRetry?.(i, attempt, error, nextDelay);
              onProgress?.(i + 1, photos.length, `Tentativa ${attempt} para foto ${i + 1}. Aguardando ${nextDelay/1000}s...`);
            }
          }).then(result => ({ index: i, result }))
        );
      }
      
      // Aguardar conclusão do lote atual
      const batchResults = await Promise.all(batchPromises);
      
      // Processar resultados do lote
      let batchSuccessCount = 0;
      let batchFailCount = 0;
      
      for (const { index, result } of batchResults) {
        results[index] = result;
        
        if (result.success) {
          batchSuccessCount++;
        } else {
          batchFailCount++;
          failedIndexes.push(index);
          errors.push(result.error || 'Erro desconhecido');
        }
        
        // Informar progresso
        onProgress?.(index + 1, photos.length);
      }
      
      // Notificar conclusão do lote
      onBatchComplete?.(batchIndex, Math.ceil(photos.length / batchSize), batchSuccessCount, batchFailCount);
    }
    
    // Processar resultados finais
    const successCount = results.filter(r => r && r.success).length;
    const urls = results
      .map((result, index) => result && result.success ? result.url : null)
      .filter(url => url !== null) as string[];
    
    return {
      success: failedIndexes.length === 0,
      partialSuccess: successCount > 0 && failedIndexes.length > 0,
      urls,
      failedIndexes: failedIndexes.length > 0 ? failedIndexes : undefined,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}