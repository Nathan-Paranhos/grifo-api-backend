import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/theme/colors';
import { globalStyles } from '../../src/theme/styles';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';
import { CustomButton } from '../../src/components/CustomButton';
import { PhotoCapture } from '../../src/components/PhotoCapture';
import { StorageService } from '../../src/services/storageService';
import { Building, FileText, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { PropertySelectionModal } from '../../src/components/PropertySelectionModal';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function NovaVistoriaScreen() {
    const { userData, company } = useAuth();
  const { addInspection, generateAndUploadPDF } = useInspection();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [inspectionType, setInspectionType] = useState<'entrada' | 'saida' | 'manutencao'>('entrada');
  const [photos, setPhotos] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<Record<string, string>>({});
  const [observations, setObservations] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const inspectionTypes = [
    { id: 'entrada', label: 'Entrada', icon: Building, color: colors.success },
    { id: 'saida', label: 'Saída', icon: FileText, color: colors.error },
    { id: 'manutencao', label: 'Manutenção', icon: AlertCircle, color: colors.warning },
  ];

  const checklistItems = [
    'Paredes',
    'Pisos',
    'Tetos',
    'Portas',
    'Janelas',
    'Instalações Elétricas',
    'Instalações Hidráulicas',
    'Cozinha',
    'Banheiros',
    'Área Externa',
  ];

  // Não precisamos mais das funções de captura de fotos, pois foram movidas para o componente PhotoCapture

  const updateChecklistItem = (item: string, status: string) => {
    setChecklist({
      ...checklist,
      [item]: status,
    });
  };

  const saveInspection = async () => {
    if (!selectedProperty) {
      Alert.alert('Erro', 'Selecione um imóvel para continuar.');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Erro', 'Tire pelo menos uma foto para continuar.');
      return;
    }

    try {
      setLoading(true);

      const inspection = {
        id: Date.now().toString(),
        empresaId: company?.id || '',
        imovelId: selectedProperty.id,
        tipo: inspectionType,
        fotos: photos,
        checklist,
        observacoes: observations,
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
      };

      addInspection(inspection);
      await generateAndUploadPDF(inspection, photos);

      Alert.alert(
        'Vistoria Salva',
        'A vistoria foi salva e o PDF está sendo gerado.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

    } catch (error) {
      console.error('Error saving inspection:', error);
      Alert.alert('Erro', 'Não foi possível salvar a vistoria. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'otimo':
        return colors.success;
      case 'regular':
        return colors.warning;
      case 'danificado':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const TypeCard = ({ type, isSelected, onPress }: any) => (
    <TouchableOpacity
      style={[styles.typeCard, isSelected && styles.typeCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={isSelected ? [type.color, type.color + 'DD'] : [colors.surface, colors.white]}
        style={styles.typeGradient}
      />
      <type.icon
        color={isSelected ? colors.white : type.color}
        size={28}
        strokeWidth={2.5}
      />
      <Text style={[styles.typeText, isSelected && styles.typeTextSelected]}>
        {type.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <LoadingOverlay visible={loading} message="Salvando vistoria..." />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={colors.gradients.primary}
          style={styles.header}
        >
          <Text style={styles.title}>Nova Vistoria</Text>
          <Text style={styles.subtitle}>
            Selecione o tipo, tire fotos e preencha o checklist
          </Text>
        </LinearGradient>

        {/* Property Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imóvel</Text>
          <TouchableOpacity
            style={styles.propertyCard}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[colors.secondary + '15', colors.secondary + '05']}
              style={styles.propertyGradient}
            />
            <View style={styles.propertyIcon}>
              <Building color={colors.secondary} size={24} />
            </View>
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyText}>
                {selectedProperty ? selectedProperty.endereco : 'Selecionar Imóvel'}
              </Text>
              {selectedProperty && (
                <Text style={styles.propertyCode}>
                  Código: {selectedProperty.codigo}
                </Text>
              )}
            </View>
            {selectedProperty && (
              <View style={styles.selectedBadge}>
                <CheckCircle color={colors.success} size={20} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Inspection Type */}
        <PropertySelectionModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSelect={(property) => {
            setSelectedProperty(property);
            setModalVisible(false);
          }}
        />

        {/* Inspection Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Vistoria</Text>
          <View style={styles.typeContainer}>
            {inspectionTypes.map((type) => (
              <TypeCard
                key={type.id}
                type={type}
                isSelected={inspectionType === type.id}
                onPress={() => setInspectionType(type.id as any)}
              />
            ))}
          </View>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <PhotoCapture
            photos={photos}
            setPhotos={setPhotos}
            maxPhotos={10}
            quality={0.8}
            showQualitySelector={true}
          />
        </View>

        {/* Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checklist</Text>
          <View style={styles.checklistContainer}>
            {checklistItems.map((item) => (
              <View key={item} style={styles.checklistItem}>
                <Text style={styles.checklistText}>{item}</Text>
                <View style={styles.checklistButtons}>
                  {[
                    { status: 'otimo', icon: '✓', color: colors.success },
                    { status: 'regular', icon: '~', color: colors.warning },
                    { status: 'danificado', icon: '✗', color: colors.error },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.status}
                      style={[
                        styles.statusButton,
                        checklist[item] === option.status && {
                          backgroundColor: option.color,
                          borderColor: option.color,
                        },
                      ]}
                      onPress={() => updateChecklistItem(item, option.status)}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          checklist[item] === option.status && styles.statusTextSelected,
                        ]}
                      >
                        {option.icon}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <CustomButton
            title="Salvar Vistoria"
            onPress={saveInspection}
            disabled={!selectedProperty || photos.length === 0}
          />
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white + 'CC',
    lineHeight: 22,
  },
  section: {
    backgroundColor: colors.white,
    marginVertical: 12,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    ...globalStyles.shadow,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  propertyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  propertyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  propertyCode: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  typeCardSelected: {
    borderColor: 'transparent',
  },
  typeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    color: colors.text,
  },
  typeTextSelected: {
    color: colors.white,
  },
  // Estilos relacionados às fotos foram removidos pois agora usamos o componente PhotoCapture
  checklistContainer: {
    gap: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  checklistText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  checklistButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  statusTextSelected: {
    color: colors.white,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
  },
});