# 🚀 Instruções de Deploy no Render - AÇÃO IMEDIATA

## ⚠️ PROBLEMAS CORRIGIDOS

✅ **Dependência desnecessária removida**: `expo-image-picker` removido do package.json
✅ **Health check corrigido**: Adicionada rota `/health` simples para o Render
✅ **Configuração atualizada**: render.yaml ajustado para usar `/health`

## 🔧 PASSOS OBRIGATÓRIOS NO RENDER

### 1. **Configure as Variáveis de Ambiente no Dashboard do Render**

Vá para o dashboard do Render > Seu serviço > Environment e adicione:

```env
# OBRIGATÓRIAS - SEM ESTAS O DEPLOY FALHARÁ
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://app.grifovistorias.com,android-app://com.grifo.vistorias

# FIREBASE - SUBSTITUA PELOS VALORES REAIS
FIREBASE_API_KEY=sua_api_key_real
FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
FIREBASE_PROJECT_ID=seu_projeto_real
FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=seu_sender_id_real
FIREBASE_APP_ID=seu_app_id_real

# CRÍTICO - CREDENCIAIS FIREBASE ADMIN SDK
# Obtenha em: Firebase Console > Configurações do Projeto > Contas de Serviço > Gerar nova chave privada
FIREBASE_CREDENTIALS={"type":"service_account","project_id":"seu_projeto_real","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@seu_projeto.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}

# SEGURANÇA
JWT_SECRET=uma_chave_muito_forte_e_unica_para_producao
JWT_EXPIRES_IN=1d
BYPASS_AUTH=false

# LOGGING
LOG_LEVEL=info

# RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 2. **Obter Credenciais Firebase Reais**

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Configurações do Projeto** (ícone de engrenagem)
4. Aba **Contas de Serviço**
5. Clique em **Gerar nova chave privada**
6. Baixe o arquivo JSON
7. **IMPORTANTE**: Copie TODO o conteúdo do JSON e cole como valor da variável `FIREBASE_CREDENTIALS`

### 3. **Verificar Build Commands no Render**

Certifique-se que o Render está usando:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`

### 4. **Deploy Manual**

Após configurar as variáveis:
1. Vá para o dashboard do Render
2. Clique em **Manual Deploy**
3. Selecione **Deploy latest commit**

## 🔍 VERIFICAÇÃO PÓS-DEPLOY

### Teste o Health Check
```bash
curl https://seu-app.onrender.com/health
```

### Teste a API
```bash
curl https://seu-app.onrender.com/api/health
```

### Teste com Autenticação
```bash
curl -H "Authorization: Bearer seu_token_firebase" \
     https://seu-app.onrender.com/api/v1/dashboard?empresaId=sua_empresa
```

## 🚨 PROBLEMAS COMUNS

### Se o deploy ainda falhar:

1. **Verifique os logs no Render**: Dashboard > Logs
2. **Credenciais Firebase**: Certifique-se que são reais e válidas
3. **Projeto Firebase**: Verifique se o Firestore está habilitado
4. **Variáveis de ambiente**: Confirme que todas estão configuradas

### Se o health check falhar:
- A rota `/health` agora existe e não requer autenticação
- Verifique se o PORT está configurado como 3000

## ✅ STATUS ATUAL

- ✅ Código corrigido e pronto
- ✅ Health check implementado
- ✅ Dependências limpas
- ⏳ **AGUARDANDO**: Configuração das variáveis de ambiente reais no Render

**PRÓXIMO PASSO**: Configure as variáveis de ambiente no dashboard do Render e faça o deploy manual.