import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, Button, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { ApiService } from '@/services/apiService';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { colors } from '@/theme/colors';
import { globalStyles } from '@/theme/styles';

export default function InspectionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [inspection, setInspection] = useState<any>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadInspectionDetails();
  }, [id]);

  const loadInspectionDetails = async () => {
    try {
      setLoading(true);
      const details = await ApiService.getInspectionById(id as string);
      setInspection(details);
    } catch (error) {
      console.error('Error loading inspection details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim() === '') return;

    const updatedComments = [...(inspection.comentarios || []), { texto: newComment, data: new Date().toISOString() }];
    await ApiService.updateInspection(id as string, { comentarios: updatedComments });
    setNewComment('');
    loadInspectionDetails();
  };

  const handleAddPhoto = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uploadUrl = await uploadImageAsync(result.assets[0].uri);
      if (uploadUrl) {
        const updatedPhotos = [...inspection.fotos, { url: uploadUrl, descricao: 'Nova foto' }];
        await ApiService.updateInspection(id as string, { fotos: updatedPhotos });
        loadInspectionDetails();
      }
    }
  };

  if (loading || !inspection) {
    return <LoadingOverlay visible={true} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Vistoria de {inspection.tipo}</Text>
      <Text style={styles.property}>{inspection.imovel.endereco}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fotos</Text>
        <View style={styles.photoGrid}>
          {inspection.fotos.map((foto: any, index: number) => (
            <Image key={index} source={{ uri: foto.url }} style={styles.photo} />
          ))}
        </View>
        <Button title="Adicionar Foto" onPress={handleAddPhoto} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comentários</Text>
        {inspection.comentarios && inspection.comentarios.length > 0 ? (
          inspection.comentarios.map((comentario: any, index: number) => (
            <View key={index} style={styles.comment}>
              <Text style={styles.commentText}>{comentario.texto}</Text>
              <Text style={styles.commentDate}>
                {new Date(comentario.data).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noComments}>Nenhum comentário ainda</Text>
        )}
        <TextInput
          style={styles.commentInput}
          placeholder="Adicionar um comentário"
          value={newComment}
          onChangeText={setNewComment}
        />
        <Button title="Adicionar Comentário" onPress={handleAddComment} />
      </View>
    </ScrollView>
  );
}

async function uploadImageAsync(uri: string) {
  const blob: any = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      reject(new TypeError("Network request failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });

  const fileRef = ref(getStorage(), `inspections/${id}/${new Date().toISOString()}`);
  await uploadBytes(fileRef, blob);

  // We're done with the blob, close and release it
  blob.close();

  return await getDownloadURL(fileRef);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  property: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    minHeight: 100,
  },
  comment: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  commentText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  noComments: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});