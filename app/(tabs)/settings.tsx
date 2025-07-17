import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Alert } from 'react-native';
import { useInspection } from '@/contexts/InspectionContext';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export default function SettingsScreen() {
  const { setupGoogleDrive, googleDriveFolderId } = useInspection();
  const [folderName, setFolderName] = useState('GrifoVistorias');
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Substitua pelo seu Web Client ID
    });
  }, []);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      setUserInfo(userInfo);
      const { accessToken } = await GoogleSignin.getTokens();
      await setupGoogleDrive(accessToken, folderName);
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Cancelado', 'Login com Google cancelado.');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Aguarde', 'O login com Google já está em progresso.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Erro', 'Serviços do Google Play não estão disponíveis ou desatualizados.');
      } else {
        Alert.alert('Erro', `Ocorreu um erro no login: ${error.message}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações do Google Drive</Text>
      {!userInfo ? (
        <Button title="Login com Google" onPress={signIn} />
      ) : (
        <View>
          <Text>Logado como {userInfo.user.email}</Text>
          <TextInput
            style={styles.input}
            value={folderName}
            onChangeText={setFolderName}
            placeholder="Nome da Pasta no Drive"
          />
          <Button title="Reconfigurar Pasta" onPress={signIn} />
        </View>
      )}
      {googleDriveFolderId && (
        <Text style={styles.successText}>
          Configurado para a pasta com ID: {googleDriveFolderId}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  successText: {
    marginTop: 20,
    color: 'green',
    textAlign: 'center',
  },
});