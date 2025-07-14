import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Plus, RefreshCw } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { globalStyles } from '../theme/styles';
import { PhotoComment } from './PhotoComment';

const { width } = Dimensions.get('window');

export interface Photo { 
  uri: string;
  comment: string;
}

interface PhotoCaptureProps {
  photos: Photo[];
  setPhotos: (photos: Photo[]) => void;
  maxPhotos?: number;
  quality?: number;
  showQualitySelector?: boolean;
  allowsEditing?: boolean;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  photos,
  setPhotos,
  maxPhotos = 20,
  quality = 0.8,
  showQualitySelector = false,
  allowsEditing = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<number>(quality);
  const [retryPhoto, setRetryPhoto] = useState<{ index: number; uri: string } | null>(null);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'É necessário permitir o acesso à câmera para tirar fotos das vistorias.'
      );
    }
  };

  const takePhoto = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Limite Atingido', `Você já atingiu o limite de ${maxPhotos} fotos.`);
      return;
    }

    try {
      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect: [4, 3],
        quality: selectedQuality,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: Photo = { uri: result.assets[0].uri, comment: '' };
        setPhotos([...photos, newPhoto]);
        setSelectedPhotoIndex(photos.length);
        setCommentModalVisible(true);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const retryTakePhoto = async (index: number) => {
    try {
      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect: [4, 3],
        quality: selectedQuality,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhotos = [...photos];
        newPhotos[index] = { ...newPhotos[index], uri: result.assets[0].uri };
        setPhotos(newPhotos);
        setSelectedPhotoIndex(index);
        setCommentModalVisible(true);
      }
      setRetryPhoto(null);
    } catch (error) {
      console.error('Error retaking photo:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    Alert.alert(
      'Remover Foto',
      'Tem certeza que deseja remover esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          onPress: () => {
            const newPhotos = [...photos];
            newPhotos.splice(index, 1);
            setPhotos(newPhotos);
          },
        },
      ]
    );
  };

  const handleRetryPhoto = (index: number) => {
    setRetryPhoto({ index, uri: photos[index].uri });
  };

  const handleSaveComment = (comment: string) => {
    if (selectedPhotoIndex !== null) {
      const newPhotos = [...photos];
      newPhotos[selectedPhotoIndex].comment = comment;
      setPhotos(newPhotos);
    }
  };

  const qualityOptions = [
    { value: 0.4, label: 'Baixa' },
    { value: 0.6, label: 'Média' },
    { value: 0.8, label: 'Alta' },
    { value: 1.0, label: 'Máxima' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.photoHeader}>
        <Text style={styles.sectionTitle}>Fotos ({photos.length}/{maxPhotos})</Text>
        <TouchableOpacity 
          style={[styles.addPhotoButton, loading && styles.addPhotoButtonDisabled]} 
          onPress={takePhoto}
          disabled={loading || photos.length >= maxPhotos}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Plus color={colors.white} size={20} />
          )}
        </TouchableOpacity>
      </View>

      {showQualitySelector && (
        <View style={styles.qualitySelector}>
          <Text style={styles.qualityLabel}>Qualidade:</Text>
          <View style={styles.qualityOptions}>
            {qualityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.qualityOption,
                  selectedQuality === option.value && styles.qualityOptionSelected,
                ]}
                onPress={() => setSelectedQuality(option.value)}
              >
                <Text
                  style={[
                    styles.qualityOptionText,
                    selectedQuality === option.value && styles.qualityOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {photos.length > 0 ? (
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoItemContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              {photo.comment ? (
                <Text style={styles.commentText}>{photo.comment}</Text>
              ) : null}
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.photoActionButton}
                  onPress={() => {
                    setSelectedPhotoIndex(index);
                    setCommentModalVisible(true);
                  }}
                >
                  <Plus color={colors.white} size={16} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoActionButton}
                  onPress={() => handleRetryPhoto(index)}
                >
                  <RefreshCw color={colors.white} size={16} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoActionButton, styles.removeButton]}
                  onPress={() => removePhoto(index)}
                >
                  <X color={colors.white} size={16} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.emptyPhotoCard} 
          onPress={takePhoto}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Camera color={colors.textSecondary} size={48} />
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <View style={styles.photoActions}>
                <TouchableOpacity
                  style={styles.photoActionButton}
                  onPress={() => handleRetryPhoto(index)}
                >
                  <RefreshCw color={colors.white} size={16} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoActionButton, styles.removeButton]}
                  onPress={() => removePhoto(index)}
                >
                  <X color={colors.white} size={16} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.emptyPhotoCard} 
          onPress={takePhoto}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Camera color={colors.textSecondary} size={48} />
              <Text style={styles.emptyPhotoText}>Toque para tirar a primeira foto</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      <PhotoComment
        visible={isCommentModalVisible}
        onClose={() => setCommentModalVisible(false)}
        onSave={handleSaveComment}
      />
    </View>   {retryPhoto && (
        <View style={styles.retryOverlay}>
          <View style={styles.retryContainer}>
            <Text style={styles.retryTitle}>Substituir Foto</Text>
            <Image source={{ uri: retryPhoto.uri }} style={styles.retryImage} />
            <View style={styles.retryButtons}>
              <TouchableOpacity 
                style={[styles.retryButton, styles.retryButtonCancel]}
                onPress={() => setRetryPhoto(null)}
              >
                <Text style={styles.retryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.retryButton, styles.retryButtonConfirm]}
                onPress={() => retryTakePhoto(retryPhoto.index)}
              >
                <Text style={[styles.retryButtonText, styles.retryButtonTextConfirm]}>Substituir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  addPhotoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...globalStyles.shadowSmall,
  },
  addPhotoButtonDisabled: {
    backgroundColor: colors.primary + '80',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: (width - 80) / 2 - 6,
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  photoActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: colors.error + 'CC',
  },
  emptyPhotoCard: {
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  emptyPhotoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  qualitySelector: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
  },
  qualityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qualityOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  qualityOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  qualityOptionTextSelected: {
    color: colors.white,
  },
  retryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  retryContainer: {
    width: '80%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...globalStyles.shadow,
  },
  retryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  retryImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonCancel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryButtonConfirm: {
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  retryButtonTextConfirm: {
    color: colors.white,
  },
});