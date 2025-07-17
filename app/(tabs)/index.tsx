import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/colors';
import { globalStyles } from '@/theme/styles';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Toast } from '@/components/Toast';
import { StorageService } from '@/services/storageService';
import { SyncService } from '@/services/syncService';
import { ApiService } from '@/services/apiService';
import { Building, ClipboardList, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Plus, TrendingUp, Users, Calendar, ExternalLink, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { userData, company, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<{
    lastSyncAt: string | null;
    hasErrors: boolean;
  }>({ lastSyncAt: null, hasErrors: false });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [stats, setStats] = useState({
    totalInspections: 0,
    completedInspections: 0,
    pendingInspections: 0,
    properties: 0,
  });

  useEffect(() => {
    loadDashboardData();
    loadSyncStatus();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const pendingInspections = await StorageService.getPendingInspections();
      setPendingCount(pendingInspections.length);
      
      if (userData?.empresaId) {
        const response = await ApiService.getDashboardStats({
          empresaId: userData.empresaId,
          vistoriadorId: userData.uid,
        });

        if (response.success && response.data) {
          setStats({
            totalInspections: response.data.overview.totalInspections,
            completedInspections: response.data.overview.completedInspections,
            pendingInspections: pendingInspections.length, // Keep local pending count
            properties: response.data.overview.totalProperties,
          });
        } else {
          showToast(response.error || 'Erro ao carregar estatísticas.', 'error');
        }
      }
    } catch (error) {
      // Error loading dashboard data
    } finally {
      setLoading(false);
    }
  };
  
  const loadSyncStatus = async () => {
    try {
      const status = await SyncService.getSyncStatus();
      setSyncStatus({
        lastSyncAt: status.lastSyncAt,
        hasErrors: status.hasErrors
      });
    } catch (error) {
      // Error loading sync status
    }
  };
  
  const handleSync = async () => {
    if (!userData) return;
    
    try {
      // Mostrar toast de início da sincronização
      showToast('Iniciando sincronização...', 'info');
      
      // Iniciar sincronização com callback de progresso
      await SyncService.autoSync(
        userData.uid,
        userData.empresaId,
        (status) => {
          showToast(status, status.includes('Erro') ? 'error' : 'info');
        }
      );
      
      // Recarregar dados após sincronização
      await loadDashboardData();
      await loadSyncStatus();
      
      // Mostrar toast de sucesso ao finalizar
      if (pendingCount > 0) {
        showToast('Sincronização concluída com sucesso!', 'success');
      }
    } catch (error) {
      // Error syncing data
      showToast('Erro na sincronização. Tente novamente.', 'error');
    }
  };
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          onPress: signOut,
        },
      ]
    );
  };

  const openWebDashboard = async () => {
    try {
      const url = 'https://dashboard.grifovistorias.com';
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Erro',
          'Não foi possível abrir o dashboard web. Verifique se você tem um navegador instalado.'
        );
      }
    } catch (error) {
      // Error opening web dashboard
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao tentar abrir o dashboard web.'
      );
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={[color, color + '15']}
        style={styles.statGradient}
      />
      <View style={styles.statHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          <Icon color={color} size={24} strokeWidth={2.5} />
        </View>
        {trend && (
          <View style={styles.statTrend}>
            <TrendingUp color={colors.success} size={16} />
            <Text style={styles.trendText}>{trend}</Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

    const QuickActionCard = ({ title, subtitle, icon: Icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={[color + '10', color + '05']}
        style={styles.actionGradient}
      />
      <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
        <Icon color={color} size={28} strokeWidth={2} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.actionArrow}>
        <Text style={[styles.arrowText, { color }]}>→</Text>
      </View>
    </TouchableOpacity>
  );



  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <LoadingOverlay visible={loading} message="Carregando dados..." />
      <Toast 
        visible={toastVisible} 
        message={toastMessage} 
        type={toastType} 
        onHide={() => setToastVisible(false)} 
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={colors.gradients.primary}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {userData?.name?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.greeting}>
                  Olá, {userData?.name?.split(' ')[0] || 'Usuário'}!
                </Text>
                <Text style={styles.companyName}>
                  {company?.nome || 'Empresa'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
              <Text style={styles.signOutText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Web Dashboard Button */}
        <TouchableOpacity style={styles.webDashboardButton} onPress={openWebDashboard}>
          <LinearGradient
            colors={[colors.secondary, colors.secondary + 'DD']}
            style={styles.webDashboardGradient}
          >
            <View style={styles.webDashboardContent}>
              <View style={styles.webDashboardIcon}>
                <ExternalLink color={colors.white} size={24} />
              </View>
              <View style={styles.webDashboardText}>
                <Text style={styles.webDashboardTitle}>Dashboard Web</Text>
                <Text style={styles.webDashboardSubtitle}>
                  Acesse o painel completo no navegador
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Alert Card */}
        {pendingCount > 0 && (
          <TouchableOpacity style={styles.alertCard} onPress={handleSync}>
            <LinearGradient
              colors={[colors.warning + '20', colors.warning + '10']}
              style={styles.alertGradient}
            />
            <View style={styles.alertIcon}>
              <AlertCircle color={colors.warning} size={24} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Sincronização Pendente</Text>
              <Text style={styles.alertMessage}>
                {pendingCount} vistoria(s) aguardando sincronização
              </Text>
            </View>
            <View style={styles.syncButton}>
              <RefreshCw color={colors.warning} size={20} />
            </View>
          </TouchableOpacity>
        )}
        
        {/* Last Sync Info */}
        <View style={styles.lastSyncContainer}>
          <Text style={styles.lastSyncText}>
            {syncStatus.lastSyncAt 
              ? `Última sincronização: ${new Date(syncStatus.lastSyncAt).toLocaleString('pt-BR')}` 
              : 'Nenhuma sincronização realizada'}
          </Text>
          <TouchableOpacity style={styles.syncIconButton} onPress={handleSync}>
            <RefreshCw color={colors.primary} size={16} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total de Vistorias"
              value={stats.totalInspections}
              icon={ClipboardList}
              color={colors.primary}
            />
            <StatCard
              title="Concluídas"
              value={stats.completedInspections}
              icon={CheckCircle}
              color={colors.success}
            />
            <StatCard
              title="Pendentes"
              value={stats.pendingInspections}
              icon={Clock}
              color={colors.warning}
            />
            <StatCard
              title="Imóveis"
              value={stats.properties}
              icon={Building}
              color={colors.secondary}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <QuickActionCard
            title="Nova Vistoria"
            subtitle="Iniciar uma nova vistoria"
            icon={Plus}
            color={colors.primary}
            onPress={() => {}}
          />

          <QuickActionCard
            title="Gerenciar Imóveis"
            subtitle="Ver lista de imóveis"
            icon={Building}
            color={colors.secondary}
            onPress={() => {}}
          />

          <QuickActionCard
            title="Histórico"
            subtitle="Ver vistorias realizadas"
            icon={Calendar}
            color={colors.info}
            onPress={() => {}}
          />

          <QuickActionCard
            title="Relatórios"
            subtitle="Análises e estatísticas"
            icon={TrendingUp}
            color={colors.success}
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // HEADER
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80, // Increased padding to push content down
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    justifyContent: 'center',
  },
  greeting: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  companyName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  signOutButton: {
    padding: 8,
  },
  signOutText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },

  // WEB DASHBOARD BUTTON
  webDashboardButton: {
    marginHorizontal: 20,
    marginTop: -50, // Overlap with header
    borderRadius: 12,
    ...globalStyles.shadow,
  },
  webDashboardGradient: {
    borderRadius: 12,
  },
  webDashboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  webDashboardIcon: {
    marginRight: 16,
  },
  webDashboardText: {
    flex: 1,
  },
  webDashboardTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  webDashboardSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 2,
  },

  // ALERT CARD
  alertCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    ...globalStyles.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  alertGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  alertIcon: {
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: colors.warning,
    fontSize: 15,
    fontWeight: 'bold',
  },
  alertMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  syncButton: {
    padding: 8,
  },

  // LAST SYNC INFO
  lastSyncContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
  },
  lastSyncText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  syncIconButton: {
    padding: 5,
  },

  // STATS SECTION
  statsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -5,
  },
  statCard: {
    width: (width - 50) / 2, // 2 cards per row with spacing
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    ...globalStyles.shadow,
    overflow: 'hidden',
  },
  statGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  trendText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // ACTIONS SECTION
  actionsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    paddingBottom: 30,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    ...globalStyles.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  actionGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionArrow: {
    marginLeft: 10,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

const headerStyles = StyleSheet.create({
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  headerInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: colors.white + 'CC',
    fontWeight: '500',
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white + '20',
  },
  signOutText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  webDashboardButton: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    ...globalStyles.shadow,
  },
  webDashboardGradient: {
    padding: 20,
  },
  webDashboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webDashboardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  webDashboardText: {
    flex: 1,
  },
  webDashboardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  webDashboardSubtitle: {
    fontSize: 14,
    color: colors.white + 'CC',
    lineHeight: 20,
  },
  alertCard: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    ...globalStyles.shadow,
  },
  alertGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertIcon: {
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    ...globalStyles.shadow,
  },
  statGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...globalStyles.shadow,
  },
  actionGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
    fontWeight: '600',
  },
  lastSyncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  lastSyncText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
  },
  syncIconButton: {
    padding: 4,
  },
  syncButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...globalStyles.shadow,
  },
});