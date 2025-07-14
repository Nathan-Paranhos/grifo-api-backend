import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/colors';
import { globalStyles } from '@/theme/styles';
import { User, Building, Settings, LogOut, Shield, Bell, CircleHelp as HelpCircle, RefreshCw, Bug } from 'lucide-react-native';
import { router } from 'expo-router';

export default function PerfilScreen() {
  const { userData, company, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          onPress: signOut,
          style: 'destructive',
        },
      ]
    );
  };

  const MenuSection = ({ title, items }: { title: string; items: any[] }) => (
    <View style={styles.menuSection}>
      <Text style={styles.menuSectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          onPress={item.onPress}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuItemIcon, { backgroundColor: item.color + '20' }]}>
              <item.icon color={item.color} size={20} />
            </View>
            <Text style={styles.menuItemText}>{item.title}</Text>
          </View>
          {item.badge && (
            <View style={styles.menuBadge}>
              <Text style={styles.menuBadgeText}>{item.badge}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <User color={colors.white} size={32} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{userData?.name || 'Usuário'}</Text>
              <Text style={styles.userEmail}>{userData?.email || 'email@exemplo.com'}</Text>
              <Text style={styles.userRole}>
                {userData?.role === 'admin' ? 'Administrador' : 'Vistoriador'}
              </Text>
            </View>
          </View>
          
          <View style={styles.companyCard}>
            <Building color={colors.secondary} size={20} />
            <Text style={styles.companyName}>
              {company?.nome || 'Empresa'}
            </Text>
          </View>
        </View>

        <MenuSection
          title="Configurações"
          items={[
            {
              title: 'Configurações do App',
              icon: Settings,
              color: colors.primary,
              onPress: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
            },
            {
              title: 'Notificações',
              icon: Bell,
              color: colors.warning,
              badge: '3',
              onPress: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
            },
            {
              title: 'Privacidade e Segurança',
              icon: Shield,
              color: colors.success,
              onPress: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
            },
          ]}
        />

        <MenuSection
          title="Suporte"
          items={[
            {
              title: 'Central de Ajuda',
              icon: HelpCircle,
              color: colors.secondary,
              onPress: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
            },
          ]}
        />

        <MenuSection
          title="Ferramentas de Desenvolvimento"
          items={[
            {
              title: 'Debug de Sincronização',
              icon: RefreshCw,
              color: colors.info,
              onPress: () => router.push('/debug-sync'),
            },
          ]}
        />

        <View style={styles.footer}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut color={colors.error} size={20} />
            <Text style={styles.signOutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>
            Grifo Vistorias v1.0.0
          </Text>
          <Text style={styles.appInfoText}>
            Desenvolvido por Nathan Silva
          </Text>
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
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  userRole: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 4,
    fontWeight: '600',
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  menuSection: {
    backgroundColor: colors.white,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
  },
  menuBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  menuBadgeText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: colors.white,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});