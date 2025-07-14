# Serviços do Portal Web Grifo Vistorias

## Visão Geral

Esta pasta contém os serviços principais do portal web Grifo Vistorias:

- **api.ts**: Responsável por fazer requisições à API backend
- **firebase.ts**: Gerencia a conexão com o Firebase (Auth, Firestore, Storage, Analytics)

## ApiService

O `api.ts` é responsável por todas as comunicações com o backend da aplicação. Ele encapsula a lógica de requisições HTTP, autenticação e tratamento de erros.

### Principais Funcionalidades

- **Cliente HTTP**: Configuração do cliente Axios com URL base da API
- **Interceptor de Requisição**: Adiciona automaticamente o token de autenticação em todas as requisições
- **Interceptor de Resposta**: Trata erros de autenticação (401) redirecionando para a página de login

### Exemplo de Uso

```typescript
import api from '../services/api';

// Buscar vistorias de uma empresa
const fetchInspections = async () => {
  try {
    const response = await api.get('/inspections', {
      params: {
        status: 'pending',
        limit: 10
      }
    });
    
    if (response.data.success) {
      // Processar os dados
      const inspections = response.data.data;
      return inspections;
    }
  } catch (error) {
    console.error('Erro ao buscar vistorias:', error);
    return [];
  }
};
```

## FirebaseService

O `firebase.ts` gerencia a conexão com os serviços do Firebase, incluindo autenticação, banco de dados Firestore, armazenamento e analytics.

### Principais Funcionalidades

- **Inicialização do Firebase**: Configura o Firebase com as variáveis de ambiente
- **Autenticação**: Fornece acesso ao serviço de autenticação do Firebase
- **Firestore**: Fornece acesso ao banco de dados Firestore
- **Storage**: Fornece acesso ao armazenamento de arquivos do Firebase
- **Analytics**: Fornece acesso ao serviço de analytics do Firebase

### Exemplo de Uso

```typescript
import { auth, firestore, storage } from '../services/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Autenticação
const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    localStorage.setItem('authToken', token);
    return userCredential.user;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
};

// Firestore
const getProperties = async (empresaId) => {
  try {
    const q = query(collection(firestore, 'imoveis'), where('empresaId', '==', empresaId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Erro ao buscar imóveis:', error);
    return [];
  }
};

// Storage
const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
};
```

## Configuração de Variáveis de Ambiente

Os serviços utilizam variáveis de ambiente definidas no arquivo `.env` e são acessadas através do `import.meta.env` do Vite.

### Variáveis necessárias:

```
VITE_API_URL=https://grifo-api.onrender.com
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_ENVIRONMENT=development
```

## Integração com o Aplicativo Mobile

O portal web e o aplicativo mobile compartilham a mesma infraestrutura de backend:

1. **API REST**: Ambos se comunicam com a mesma API REST hospedada no Render
2. **Firebase**: Compartilham o mesmo projeto Firebase para autenticação e armazenamento
3. **Autenticação**: Utilizam o mesmo sistema de autenticação baseado em tokens JWT

## Troubleshooting

### Problemas de Autenticação

Se estiver enfrentando problemas com a autenticação:

1. Verifique se o token está sendo armazenado corretamente no localStorage
2. Verifique se o interceptor está adicionando o token no header Authorization
3. Verifique se o token não está expirado
4. Limpe o localStorage e faça login novamente

### Problemas com Requisições à API

Se estiver enfrentando problemas com as requisições à API:

1. Verifique se a URL base está configurada corretamente
2. Verifique se a API está online usando o endpoint de health check
3. Verifique se o token de autenticação está sendo enviado corretamente
4. Verifique os logs de erro no console do navegador

### Problemas com o Firebase

Se estiver enfrentando problemas com o Firebase:

1. Verifique se as variáveis de ambiente estão configuradas corretamente
2. Verifique se o projeto Firebase está configurado corretamente
3. Verifique se as regras de segurança do Firestore e Storage estão configuradas corretamente
4. Verifique os logs de erro no console do Firebase