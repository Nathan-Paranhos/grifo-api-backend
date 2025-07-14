import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/colors';
import { globalStyles } from '@/theme/styles';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ApiService } from '@/services/apiService';
import { Building, Search, MapPin, Calendar } from 'lucide-react-native';

export default function ImoveisScreen() {
  const { userData, company } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    loadProperties();
  }, [searchTerm]);

  const loadProperties = async () => {
    if (!userData?.empresaId) return;
    setLoading(true);
    try {
      const response = await ApiService.getProperties({
        empresaId: userData.empresaId,
        search: searchTerm,
      });
      if (response.success && response.data) {
        setProperties(response.data);
      } else {
        // Handle error
        console.error(response.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ocupado':
        return colors.success;
      case 'Disponível':
        return colors.primary;
      case 'Manutenção':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const PropertyCard = ({ property }: { property: any }) => (
    <TouchableOpacity style={styles.propertyCard}>
      <View style={styles.propertyHeader}>
        <View style={styles.propertyIcon}>
          <Building color={colors.secondary} size={24} />
        </View>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyCode}>{property.codigo}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(property.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(property.status) }]}>
              {property.status}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.propertyDetails}>
        <View style={styles.propertyRow}>
          <MapPin color={colors.textSecondary} size={16} />
          <Text style={styles.propertyAddress}>{property.enderecoCompleto}</Text>
        </View>
        
        <View style={styles.propertyMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Tipo</Text>
            <Text style={styles.metricValue}>{property.tipo}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Área</Text>
            <Text style={styles.metricValue}>{property.area}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Proprietário</Text>
            <Text style={styles.metricValue}>{property.proprietario?.nome || 'N/A'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <LoadingOverlay visible={loading} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Imóveis</Text>
          <Text style={styles.subtitle}>
            {company?.nome || 'Sua empresa'}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search color={colors.textSecondary} size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por endereço ou código..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{properties.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {properties.filter(p => p.status === 'Ocupado').length}
            </Text>
            <Text style={styles.statLabel}>Ocupados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {properties.filter(p => p.status === 'Disponível').length}
            </Text>
            <Text style={styles.statLabel}>Disponíveis</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {properties.filter(p => p.status === 'Manutenção').length}
            </Text>
            <Text style={styles.statLabel}>Manutenção</Text>
          </View>
        </View>

        <ScrollView style={styles.propertiesList}>
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </ScrollView>
      </View>
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
  searchContainer: {
    padding: 16,
    backgroundColor: colors.white,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  propertiesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  propertyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    ...globalStyles.shadow,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  propertyInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  propertyDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyAddress: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  propertyMetrics: {
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