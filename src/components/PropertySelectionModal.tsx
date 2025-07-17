import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { globalStyles } from '../theme/styles';
import { ApiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Building, Search, X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (property: any) => void;
}

export function PropertySelectionModal({ visible, onClose, onSelect }: Props) {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (visible) {
      loadProperties();
    }
  }, [visible, searchTerm]);

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
      }
    } catch (error) {
      // Error loading properties
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (property: any) => {
    onSelect(property);
    onClose();
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelect(item)}>
      <Building color={colors.primary} size={24} />
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemAddress}>{item.enderecoCompleto}</Text>
        <Text style={styles.itemCode}>{item.codigo}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={globalStyles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Selecionar Imóvel</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Search color={colors.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por endereço ou código..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <FlatList
          data={properties}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          onRefresh={loadProperties}
          refreshing={loading}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    height: 48,
    color: colors.text,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemTextContainer: {
    marginLeft: 16,
  },
  itemAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemCode: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});