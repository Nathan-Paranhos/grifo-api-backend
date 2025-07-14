import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Share2, Trash2, Download, FileJson } from 'lucide-react-native';
import { StorageService, PendingInspection } from '../../src/services/storageService';
import { PDFService } from '../../src/services/pdfService';
import { ZipService } from '../../src/services/zipService';
import { ExportService } from '../../src/services/exportService';
import { colors } from '../../src/theme/colors';
import { globalStyles } from '../../src/theme/styles';

export default function RelatoriosScreen() {
  const [inspections, setInspections] = useState<PendingInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    try {
      setLoading(true);
      const pendingInspections = await StorageService.getPendingInspections();
      // Ordenar por data de criação (mais recente primeiro)
      const sortedInspections = pendingInspections.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setInspections(sortedInspections);
    } catch (error) {
      console.error('Erro ao carregar inspeções:', error);
      Alert.alert('Erro', 'Não foi possível carregar as vistorias.');
    } finally {
      setLoading(false);
    }
  };

  const generateAndSharePDF = async (inspection: PendingInspection) => {
    try {
      setProcessingId(inspection.id);
      
      // Gerar o PDF
      const pdfResult = await PDFService.generatePDF(inspection);
      
      if (!pdfResult.success || !pdfResult.filePath) {
        throw new Error(pdfResult.error || 'Falha ao gerar o PDF');
      }
      
      // Adicionar as imagens ao PDF
      if (inspection.fotos && inspection.fotos.length > 0) {
        const updatedPdfResult = await PDFService.addImagesToPDF(pdfResult.filePath, inspection.fotos);
        
        if (!updatedPdfResult.success) {
          throw new Error(updatedPdfResult.error || 'Falha ao adicionar imagens ao PDF');
        }
      }
      
      // Compartilhar o PDF
      const shared = await PDFService.sharePDF(pdfResult.filePath);
      
      if (!shared) {
        throw new Error('Não foi possível compartilhar o PDF');
      }
      
    } catch (error) {
      console.error('Erro ao gerar e compartilhar PDF:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao gerar relatório');
    } finally {
      setProcessingId(null);
    }
  };

  const sharePhotosAsZip = async (inspection: PendingInspection) => {
    try {
      setProcessingId(inspection.id);
      
      // Verificar se há fotos
      if (!inspection.fotos || inspection.fotos.length === 0) {
        Alert.alert('Aviso', 'Esta vistoria não possui fotos para compartilhar.');
        return;
      }
      
      // Compactar as fotos
      const zipResult = await ZipService.compressPhotos(inspection);
      
      if (!zipResult.success || !zipResult.filePath) {
        throw new Error(zipResult.error || 'Falha ao compactar as fotos');
      }
      
      // Compartilhar o arquivo ZIP
      const shared = await ZipService.shareZip(zipResult.filePath);
      
      if (!shared) {
        throw new Error('Não foi possível compartilhar as fotos');
      }
      
    } catch (error) {
      console.error('Erro ao compartilhar fotos:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao compartilhar fotos');
    } finally {
      setProcessingId(null);
    }
  };

  const exportInspectionData = async (inspection: PendingInspection) => {
    try {
      setProcessingId(inspection.id);
      
      // Exportar dados da vistoria
      const exportResult = await ExportService.exportInspection(inspection.id);
      
      if (!exportResult.success || !exportResult.filePath) {
        throw new Error(exportResult.error || 'Falha ao exportar dados da vistoria');
      }
      
      // Compartilhar o arquivo JSON
      const shared = await ExportService.shareExportFile(exportResult.filePath);
      
      if (!shared) {
        throw new Error('Não foi possível compartilhar os dados da vistoria');
      }
      
    } catch (error) {
      console.error('Erro ao exportar dados da vistoria:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao exportar dados');
    } finally {
      setProcessingId(null);
    }
  };

  const exportAllInspections = async () => {
    try {
      setIsExporting(true);
      
      // Verificar se há vistorias para exportar
      if (inspections.length === 0) {
        Alert.alert('Aviso', 'Não há vistorias para exportar.');
        return;
      }
      
      // Exportar todas as vistorias
      const exportResult = await ExportService.exportAllInspections();
      
      if (!exportResult.success || !exportResult.filePath) {
        throw new Error(exportResult.error || 'Falha ao exportar vistorias');
      }
      
      // Compartilhar o arquivo JSON
      const shared = await ExportService.shareExportFile(exportResult.filePath);
      
      if (!shared) {
        throw new Error('Não foi possível compartilhar os dados das vistorias');
      }
      
      Alert.alert('Sucesso', 'Dados de todas as vistorias exportados com sucesso!');
      
    } catch (error) {
      console.error('Erro ao exportar todas as vistorias:', error);
      Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  const renderInspectionItem = ({ item }: { item: PendingInspection }) => {
    const isProcessing = processingId === item.id;
    const date = new Date(item.createdAt).toLocaleDateString('pt-BR');
    const tipoVistoria = {
      'entrada': 'Vistoria de Entrada',
      'saida': 'Vistoria de Saída',
      'manutencao': 'Vistoria de Manutenção'
    }[item.tipo] || 'Vistoria';
    
    const statusColor = {
      'pending': colors.warning,
      'syncing': colors.info,
      'synced': colors.success,
      'error': colors.error
    }[item.status] || colors.warning;
    
    const statusText = {
      'pending': 'Pendente',
      'syncing': 'Sincronizando',
      'synced': 'Sincronizada',
      'error': 'Erro'
    }[item.status] || 'Pendente';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <FileText size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>{tipoVistoria}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.propertyText}>Imóvel: {item.imovelId}</Text>
          <Text style={styles.dateText}>Data: {date}</Text>
          <Text style={styles.infoText}>Fotos: {item.fotos?.length || 0}</Text>
          <Text style={styles.infoText}>Itens no checklist: {Object.keys(item.checklist || {}).length}</Text>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => generateAndSharePDF(item)}
            disabled={isProcessing}
          >
            {isProcessing && processingId === item.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <FileText size={18} color={colors.primary} />
                <Text style={styles.actionText}>PDF</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => sharePhotosAsZip(item)}
            disabled={isProcessing || !item.fotos || item.fotos.length === 0}
          >
            {isProcessing && processingId === item.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Share2 size={18} color={colors.primary} />
                <Text style={styles.actionText}>Fotos</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => exportInspectionData(item)}
            disabled={isProcessing}
          >
            {isProcessing && processingId === item.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <FileJson size={18} color={colors.primary} />
                <Text style={styles.actionText}>Exportar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Relatórios',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
        }}
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios de Vistoria</Text>
        <Text style={styles.subtitle}>Gere e compartilhe relatórios das suas vistorias</Text>
      </View>

      {!loading && inspections.length > 0 && (
        <TouchableOpacity 
          style={styles.exportAllButton}
          onPress={exportAllInspections}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <FileJson size={18} color={colors.white} />
              <Text style={styles.exportAllText}>Exportar Todas as Vistorias</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando vistorias...</Text>
        </View>
      ) : inspections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Nenhuma vistoria encontrada</Text>
          <Text style={styles.emptySubtext}>As vistorias que você realizar aparecerão aqui</Text>
        </View>
      ) : (
        <FlatList
          data={inspections}
          renderItem={renderInspectionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    letterSpacing: -0.3,
  },
  exportAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    ...globalStyles.shadow,
  },
  exportAllText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    ...globalStyles.shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  propertyText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRightWidth: 0.5,
    borderRightColor: colors.border,
  },
  actionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});