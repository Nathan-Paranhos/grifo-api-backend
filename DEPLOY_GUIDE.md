# 🚀 Guia de Deploy - GitHub + Render

## 📋 Pré-requisitos

- [x] Conta no GitHub
- [x] Conta no Render.com
- [x] Repositório GitHub configurado
- [x] Credenciais Firebase disponíveis

## 🔧 Configuração do Repositório GitHub

### 1. Inicializar Git (se necessário)
```bash
git init
git add .
git commit -m "Initial commit: Grifo API Backend with CORS and Auth fixes"
```

### 2. Conectar ao Repositório Remoto
```bash
git remote add origin https://github.com/SEU_USUARIO/grifo-api-backend.git
git branch -M main
git push -u origin main
```

### 3. Arquivos Incluídos no Commit
- ✅ `src/` - Código fonte com correções
- ✅ `render.yaml` - Configuração do Render
- ✅ `.env.development` - Configuração de desenvolvimento
- ✅ `.env.production` - Template de produção (sem credenciais)
- ✅ `package.json` e `package-lock.json`
- ✅ `CORS_FIX_README.md` - Documentação das correções
- ❌ `node_modules/` - Excluído
- ❌ `dist/` - Excluído (será gerado no build)
- ❌ Credenciais Firebase - Excluídas

## 🌐 Configuração no Render.com

### 1. Criar Novo Web Service
1. Acesse [Render.com](https://render.com)
2. Clique em "New" → "Web Service"
3. Conecte seu repositório GitHub
4. Selecione o repositório `grifo-api-backend`

### 2. Configurações Automáticas (via render.yaml)
O arquivo `render.yaml` já está configurado com:
- ✅ **Build Command**: `npm install && npm run build`
- ✅ **Start Command**: `npm start`
- ✅ **Health Check**: `/health`
- ✅ **Auto Deploy**: Habilitado na branch `main`
- ✅ **Environment**: Node.js
- ✅ **Plan**: Free

### 3. Variáveis de Ambiente Configuradas
```yaml
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://app.grifovistorias.com,android-app://com.grifo.vistorias,http://localhost:3000,https://portal.grifovistorias.com
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
JWT_SECRET=<gerado automaticamente>
JWT_EXPIRES_IN=1d
BYPASS_AUTH=false
```

### 4. ⚠️ Configurar Credenciais Firebase Manualmente

**IMPORTANTE**: As credenciais Firebase devem ser adicionadas manualmente no dashboard do Render:

1. No dashboard do Render, vá em "Environment"
2. Adicione as seguintes variáveis:

```
FIREBASE_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

FIREBASE_API_KEY=sua_api_key
FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
FIREBASE_PROJECT_ID=seu_projeto_id
FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 🚀 Deploy Automático

### Como Funciona
1. **Push para GitHub**: Qualquer commit na branch `main`
2. **Trigger Automático**: Render detecta mudanças
3. **Build Process**: 
   - `npm install` - Instala dependências
   - `npm run build` - Compila TypeScript
4. **Deploy**: 
   - `npm start` - Inicia servidor
   - Health check em `/health`

### Comandos para Deploy
```bash
# Fazer mudanças no código
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Deploy automático será iniciado no Render
```

## 🔍 Verificação do Deploy

### 1. URLs de Teste
- **API Root**: `https://seu-app.onrender.com/`
- **Health Check**: `https://seu-app.onrender.com/health`
- **API Health**: `https://seu-app.onrender.com/api/health`
- **Swagger Docs**: `https://seu-app.onrender.com/api-docs`

### 2. Testes de CORS
```bash
# Teste de CORS com curl
curl -H "Origin: https://app.grifovistorias.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization" \
     -X OPTIONS \
     https://seu-app.onrender.com/api/health
```

### 3. Teste de Autenticação
```bash
# Teste sem token (deve retornar 401)
curl https://seu-app.onrender.com/api/dashboard

# Teste com token inválido (deve retornar 401)
curl -H "Authorization: Bearer invalid_token" \
     https://seu-app.onrender.com/api/dashboard
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Build Falha**
   - Verificar logs no Render dashboard
   - Confirmar que `package.json` está correto
   - Verificar se TypeScript compila localmente

2. **Erro de Credenciais Firebase**
   - Verificar se todas as variáveis Firebase foram adicionadas
   - Confirmar formato JSON do `FIREBASE_CREDENTIALS`
   - Testar credenciais localmente

3. **CORS Errors**
   - Verificar se origin está em `CORS_ORIGIN`
   - Confirmar configuração no `src/config/security.ts`
   - Testar com diferentes origins

4. **Health Check Falha**
   - Verificar se `/health` responde 200
   - Confirmar se servidor está na porta correta
   - Verificar logs de inicialização

### Logs Úteis
```bash
# Ver logs do Render
# Acesse: Dashboard → Seu Service → Logs

# Logs locais para debug
npm run dev:win  # Windows
npm run dev      # Linux/Mac
```

## 📚 Recursos Adicionais

- [Documentação Render.com](https://render.com/docs)
- [GitHub Actions (futuro)](https://docs.github.com/en/actions)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Express.js CORS](https://expressjs.com/en/resources/middleware/cors.html)

---

**✅ Deploy configurado com sucesso!**

Após seguir este guia, sua API estará disponível publicamente com:
- ✅ CORS configurado para múltiplos origins
- ✅ Autenticação Firebase com mensagens específicas
- ✅ Deploy automático via GitHub
- ✅ Health checks configurados
- ✅ Logs estruturados