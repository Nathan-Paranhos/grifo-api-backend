import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Switch } from 'react-native';
import { SyncService } from '@/src/services/syncService';
import { StorageService } from '@/src/services/storageService';
import { useAuth } from '@/src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface DebugInfo {
  pendingCount: number;
  errorCount: number;
  syncedCount: number;
  lastSyncAt: string | null;
  hasErrors: boolean;
  isOnline: boolean;
  pendingInspections: any[];
  syncLogs?: string[];
  syncDuration?: string;
  connectionQuality?: 'good' | 'poor' | 'none';
}

export default function DebugSyncScreen() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncDuration, setSyncDuration] = useState('');
  const [forceSync, setForceSync] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);
  const [batchSize, setBatchSize] = useState(3);
  const { user } = useAuth();

  const loadDebugInfo = async () => {
    try {
      setRefreshing(true);
      // Limpar logs e duração ao atualizar
      setSyncLogs([]);
      setSyncDuration('');
      
      const syncStatus = await SyncService.getSyncStatus();
      const pendingInspections = await StorageService.getPendingInspections();
      
      setDebugInfo({
        ...syncStatus,
        pendingInspections
      });
    } catch (error) {
      console.error('Error loading debug info:', error);
      Alert.alert('Erro', 'Não foi possível carregar as informações de debug.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSync = async () => {
    if (!user?.id || !user?.empresaId) {
      Alert.alert('Erro', 'Usuário não autenticado ou sem empresa associada.');
      return;
    }

    try {
      // Limpar logs anteriores e iniciar novos
      setSyncLogs([`${new Date().toLocaleTimeString()}: Iniciando sincronização...`]);
      setSyncInProgress(true);
      setSyncStatus('Iniciando sincronização...');
      
      // Registrar hora de início da sincronização
      const startTime = new Date();
      
      // Adicionar informações sobre as opções de sincronização aos logs
      setSyncLogs(prev => [
        ...prev, 
        `${new Date().toLocaleTimeString()}: Opções: ${forceSync ? 'Forçar sincronização ativado' : 'Forçar sincronização desativado'}, Alertas: ${showAlerts ? 'Ativados' : 'Desativados'}, Tamanho do lote: ${batchSize}`
      ]);
      
      const result = await SyncService.autoSync(
        user.id,
        user.empresaId,
        {
          showAlerts,
          forceSync,
          maxRetries: 3,
          batchSize,
          onProgress: (status, progress) => {
            setSyncStatus(status);
            setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${status}`]);
          }
        }
      );
      
      // Registrar hora de término e duração da sincronização
      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationSec = (durationMs / 1000).toFixed(2);
      const durationText = `Sincronização concluída em ${durationSec} segundos`;
      
      // Adicionar informações sobre o resultado da sincronização
      const resultText = `Resultado: ${result.success ? 'Sucesso' : 'Falha'}, Sincronizadas: ${result.synced}, Falhas: ${result.failed}, Qualidade da conexão: ${result.connectionQuality || 'desconhecida'}`;
      
      console.log(durationText, resultText);
      setSyncDuration(durationText);
      setSyncLogs(prev => [
        ...prev, 
        `${new Date().toLocaleTimeString()}: ${durationText}`,
        `${new Date().toLocaleTimeString()}: ${resultText}`
      ]);

      // Recarregar informações após sincronização
      await loadDebugInfo();
    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorText = `Erro: ${errorMessage}`;
      
      setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${errorText}`]);
      if (showAlerts) {
        Alert.alert('Erro', `Ocorreu um erro durante a sincronização: ${errorMessage}`);
      }
    } finally {
      setSyncInProgress(false);
      setSyncStatus('');
    }
  };

  const handleRetryFailed = async () => {
    if (!user?.id || !user?.empresaId) {
      Alert.alert('Erro', 'Usuário não autenticado ou sem empresa associada.');
      return;
    }

    try {
      // Limpar logs anteriores e iniciar novos
      setSyncLogs([`${new Date().toLocaleTimeString()}: Retentando sincronização de vistorias com erro...`]);
      setSyncInProgress(true);
      setSyncStatus('Retentando sincronização de vistorias com erro...');

      // Registrar hora de início da operação
      const startTime = new Date();
      
      // Adicionar informações sobre as opções de sincronização aos logs
      setSyncLogs(prev => [
        ...prev, 
        `${new Date().toLocaleTimeString()}: Opções: ${forceSync ? 'Forçar sincronização ativado' : 'Forçar sincronização desativado'}, Alertas: ${showAlerts ? 'Ativados' : 'Desativados'}, Tamanho do lote: ${batchSize}`
      ]);

      const result = await SyncService.retryFailedInspections(
        user.id,
        user.empresaId,
        (status) => {
          setSyncStatus(status);
          setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${status}`]);
        },
        {
          showAlerts,
          forceSync,
          maxRetries: 3,
          batchSize
        }
      );

      // Registrar hora de término e duração da operação
      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationSec = (durationMs / 1000).toFixed(2);
      const durationText = `Operação concluída em ${durationSec} segundos`;
      
      setSyncDuration(durationText);
      setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${durationText}`]);

      if (result.success) {
        const successMsg = `${result.synced} vistorias sincronizadas com sucesso.`;
        setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: SUCESSO - ${successMsg}`]);
        Alert.alert('Sucesso', successMsg);
      } else {
        const errorMsg = result.errors[0] || 'Falha ao retentar sincronização.';
        setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ERRO - ${errorMsg}`]);
        Alert.alert('Erro', errorMsg);
      }

      // Recarregar informações após sincronização
      await loadDebugInfo();
    } catch (error) {
      console.error('Retry error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSyncLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ERRO - ${errorMessage}`]);
      Alert.alert('Erro', `Ocorreu um erro ao retentar sincronização: ${errorMessage}`);
    } finally {
      setSyncInProgress(false);
      setSyncStatus('');
    }
  };

  const handleClearStorage = async () => {
    Alert.alert(
      'Limpar Storage',
      'Tem certeza que deseja limpar todos os dados de sincronização? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearPendingInspections();
              await StorageService.clearOfflineData();
              Alert.alert('Sucesso', 'Dados de sincronização limpos com sucesso.');
              await loadDebugInfo();
            } catch (error) {
              console.error('Clear storage error:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao limpar os dados.');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR');
    } catch (e) {
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Ionicons name="time-outline" size={20} color="#f39c12" />;
      case 'synced':
        return <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />;
      case 'error':
        return <Ionicons name="alert-circle" size={20} color="#e74c3c" />;
      default:
        return <Ionicons name="help-circle" size={20} color="#95a5a6" />;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDebugInfo} />
        }
      >
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Opções de Sincronização</Text>
          
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Forçar Sincronização:</Text>
            <Switch
              value={forceSync}
              onValueChange={setForceSync}
              disabled={syncInProgress}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={forceSync ? '#3498db' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Mostrar Alertas:</Text>
            <Switch
              value={showAlerts}
              onValueChange={setShowAlerts}
              disabled={syncInProgress}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={showAlerts ? '#3498db' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Tamanho do Lote:</Text>
            <View style={styles.batchSizeContainer}>
              <TouchableOpacity 
                style={[styles.batchButton, batchSize <= 1 && styles.disabledButton]}
                onPress={() => setBatchSize(prev => Math.max(1, prev - 1))}
                disabled={batchSize <= 1 || syncInProgress}
              >
                <Text style={styles.batchButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.batchSizeText}>{batchSize}</Text>
              <TouchableOpacity 
                style={[styles.batchButton, batchSize >= 10 && styles.disabledButton]}
                onPress={() => setBatchSize(prev => Math.min(10, prev + 1))}
                disabled={batchSize >= 10 || syncInProgress}
              >
                <Text style={styles.batchButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.header}>
          <Text style={styles.title}>Debug de Sincronização</Text>
          <TouchableOpacity 
            style={[styles.syncButton, syncInProgress && styles.disabledButton]}
            onPress={handleSync}
            disabled={syncInProgress}
          >
            <Text style={styles.buttonText}>Sincronizar</Text>
          </TouchableOpacity>
        </View>

        {syncStatus ? (
          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              {syncInProgress && <ActivityIndicator size="small" color="white" style={styles.statusIndicator} />}
              <Text style={styles.statusText}>{syncStatus}</Text>
            </View>
            {syncDuration ? <Text style={styles.durationText}>{syncDuration}</Text> : null}
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Status da Sincronização</Text>
          
          {debugInfo ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Conexão:</Text>
                <View style={styles.infoValue}>
                  {debugInfo.isOnline ? (
                    <Text style={styles.onlineText}>
                      <Ionicons name="wifi" size={16} /> Online
                    </Text>
                  ) : (
                    <Text style={styles.offlineText}>
                      <Ionicons name="wifi-off" size={16} /> Offline
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Última sincronização:</Text>
                <Text style={styles.infoValue}>{formatDate(debugInfo.lastSyncAt)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vistorias pendentes:</Text>
                <Text style={styles.infoValue}>{debugInfo.pendingCount}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vistorias com erro:</Text>
                <Text style={[styles.infoValue, debugInfo.errorCount > 0 && styles.errorText]}>
                  {debugInfo.errorCount}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vistorias sincronizadas:</Text>
                <Text style={styles.infoValue}>{debugInfo.syncedCount}</Text>
              </View>

              {debugInfo.errorCount > 0 && (
                <TouchableOpacity 
                  style={[styles.retryButton, syncInProgress && styles.disabledButton]}
                  onPress={handleRetryFailed}
                  disabled={syncInProgress}
                >
                  <Text style={styles.buttonText}>Retentar Vistorias com Erro</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.loadingText}>Carregando informações...</Text>
          )}
        </View>

        {debugInfo?.pendingInspections && debugInfo.pendingInspections.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Vistorias Pendentes</Text>
            {debugInfo.pendingInspections.map((inspection, index) => (
              <View key={inspection.id} style={styles.inspectionItem}>
                <View style={styles.inspectionHeader}>
                  {getStatusIcon(inspection.status)}
                  <Text style={styles.inspectionId}>{inspection.id.substring(0, 8)}...</Text>
                  <Text style={[styles.inspectionStatus, 
                    inspection.status === 'error' ? styles.errorText : 
                    inspection.status === 'synced' ? styles.successText : 
                    styles.pendingText
                  ]}>
                    {inspection.status}
                  </Text>
                </View>
                <View style={styles.inspectionDetails}>
                  <Text style={styles.detailText}>Tipo: {inspection.tipo}</Text>
                  <Text style={styles.detailText}>Fotos: {inspection.fotos?.length || 0}</Text>
                  <Text style={styles.detailText}>
                    Criado em: {formatDate(inspection.createdAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {syncLogs.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Logs de Sincronização</Text>
              <TouchableOpacity 
                style={styles.clearLogsButton}
                onPress={() => setSyncLogs([])}
              >
                <Text style={styles.clearButtonText}>Limpar Logs</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.logsContainer}>
              {syncLogs.map((log, index) => (
                <Text 
                  key={index} 
                  style={[
                    styles.logText, 
                    log.includes('ERRO') ? styles.errorText : 
                    log.includes('SUCESSO') ? styles.successText : 
                    styles.normalLogText
                  ]}
                >
                  {log}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.dangerButton, syncInProgress && styles.disabledButton]}
          onPress={handleClearStorage}
          disabled={syncInProgress}
        >
          <Text style={styles.buttonText}>Limpar Dados de Sincronização</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  syncButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 16,
    alignSelf: 'center',
  },
  dangerButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 16,
    alignSelf: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  optionLabel: {
    fontWeight: '500',
    color: '#555',
    flex: 1,
  },
  batchSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batchButton: {
    backgroundColor: '#3498db',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  batchSizeText: {
    marginHorizontal: 10,
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusContainer: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  durationText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearLogsButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    fontWeight: '500',
    color: '#555',
  },
  infoValue: {
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#777',
  },
  onlineText: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  offlineText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#e74c3c',
  },
  successText: {
    color: '#2ecc71',
  },
  pendingText: {
    color: '#f39c12',
  },
  normalLogText: {
    color: '#555',
  },
  logsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#f9f9f9',
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    paddingVertical: 2,
  },
  inspectionItem: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
  },
  inspectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inspectionId: {
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  inspectionStatus: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  inspectionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
});