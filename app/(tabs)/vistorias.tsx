import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { StorageService } from '@/services/storageService';
import { ApiService } from '@/services/apiService';
import { colors } from '@/theme/colors';
import { globalStyles } from '@/theme/styles';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ClipboardList, Calendar, MapPin, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Wifi, WifiOff } from 'lucide-react-native';

export default function VistoriasScreen() {
  const { userData, company } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingInspections, setPendingInspections] = useState<any[]>([]);
  const [completedInspections, setCompletedInspections] = useState<any[]>([]);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    try {
      setLoading(true);
      const pending = await StorageService.getPendingInspections();
      setPendingInspections(pending);
      
      const completed = await ApiService.getInspections(company.id, userData.id, 'Concluída');
      setCompletedInspections(completed);
    } catch (error) {
      console.error('Error loading inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInspections();
    setRefreshing(false);
  };

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return colors.success;
      case 'saida':
        return colors.error;
      case 'manutencao':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return 'Entrada';
      case 'saida':
        return 'Saída';
      case 'manutencao':
        return 'Manutenção';
      default:
        return tipo;
    }
  };

  const InspectionCard = ({ inspection, isPending = false }: { inspection: any, isPending?: boolean }) => {
    const handlePress = () => {
      if (!isPending) {
        router.push(`/(main)/(tabs)/inspections/${inspection.id}`);
      }
    };

    return (
    <TouchableOpacity style={styles.inspectionCard} onPress={handlePress} disabled={isPending}>
      <View style={styles.inspectionHeader}>
        <View style={styles.inspectionIcon}>
          <ClipboardList color={getTypeColor(inspection.tipo)} size={24} />
        </View>
        <View style={styles.inspectionInfo}>
          <View style={styles.inspectionTitleRow}>
            <Text style={styles.inspectionTitle}>
              Vistoria de {getTypeLabel(inspection.tipo)}
            </Text>
            {isPending ? (
              <View style={styles.pendingBadge}>
                <WifiOff color={colors.warning} size={16} />
              </View>
            ) : (
              <View style={styles.completedBadge}>
                <CheckCircle color={colors.success} size={16} />
              </View>
            )}
          </View>
          <Text style={styles.inspectionProperty}>
            {inspection.imovel?.endereco || 'Imóvel não identificado'}
          </Text>
        </View>
      </View>

      <View style={styles.inspectionDetails}>
        <View style={styles.inspectionRow}>
          <Calendar color={colors.textSecondary} size={16} />
          <Text style={styles.inspectionDate}>
            {new Date(inspection.createdAt || inspection.dataVistoria).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        
        <View style={styles.inspectionMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Fotos</Text>
            <Text style={styles.metricValue}>
              {inspection.fotos?.length || 0}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Status</Text>
            <Text style={[styles.metricValue, { color: isPending ? colors.warning : colors.success }]}>
              {isPending ? 'Pendente' : 'Concluído'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <LoadingOverlay visible={loading} />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Vistorias</Text>
          <Text style={styles.subtitle}>
            Gerencie suas vistorias realizadas
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <WifiOff color={colors.warning} size={24} />
            </View>
            <View>
              <Text style={styles.statNumber}>{pendingInspections.length}</Text>
              <Text style={styles.statLabel}>Pendentes</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <CheckCircle color={colors.success} size={24} />
            </View>
            <View>
              <Text style={styles.statNumber}>{completedInspections.length}</Text>
              <Text style={styles.statLabel}>Concluídas</Text>
            </View>
          </View>
        </View>

        {pendingInspections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pendentes de Sincronização</Text>
            <Text style={styles.sectionSubtitle}>
              Essas vistorias serão enviadas quando houver conexão
            </Text>
            {pendingInspections.map((inspection) => (
              <InspectionCard key={inspection.id} inspection={inspection} isPending={true} />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vistorias Concluídas</Text>
          {completedInspections.map((inspection) => (
            <InspectionCard key={inspection.id} inspection={inspection} isPending={false} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    gap: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    marginRight: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.white,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  inspectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inspectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inspectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inspectionInfo: {
    flex: 1,
  },
  inspectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  pendingBadge: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.warning + '20',
  },
  completedBadge: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.success + '20',
  },
  inspectionProperty: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inspectionDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  inspectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inspectionDate: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  inspectionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: 2,
  },
});