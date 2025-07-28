# Guia de Solução de Problemas - API Grifo

## Erros Comuns de Token Firebase

### ❌ "Erro ao verificar token Firebase" nos logs

**Sintomas:**
```
2025-07-28 21:43:57:4357 error: Erro ao verificar token Firebase: 
2025-07-28 21:43:57:4357 error: Erro durante a verificação do token: 
```

**Causa:**
Esses erros são **normais** e indicam que alguém está tentando acessar rotas protegidas sem um token válido ou com um token expirado/inválido.

**Soluções:**

1. **Para usuários finais:**
   - Faça logout e login novamente no aplicativo/portal
   - Verifique se o token Firebase não expirou
   - Certifique-se de que está enviando o header correto: `Authorization: Bearer <token>`

2. **Para desenvolvedores:**
   - Verifique se o cliente está enviando o token corretamente
   - Confirme que o token é um ID Token válido do Firebase (não um Custom Token)
   - Use as ferramentas de debug do Firebase para validar tokens

### ✅ Como verificar se a API está funcionando

```bash
# Teste a API
node check-firebase-config.js
```

**Resultado esperado:**
```
✅ API está respondendo: 200
✅ Autenticação está funcionando (esperando token)
✅ Firebase está configurado e funcionando
```

### 🔧 Configuração do Firebase

**Variáveis de ambiente necessárias no Render:**
- `FIREBASE_CREDENTIALS` - JSON do Service Account
- `FIREBASE_API_KEY` - Chave da API do Firebase
- `FIREBASE_AUTH_DOMAIN` - Domínio de autenticação
- `FIREBASE_PROJECT_ID` - ID do projeto
- `FIREBASE_STORAGE_BUCKET` - Bucket de storage
- `FIREBASE_MESSAGING_SENDER_ID` - ID do sender
- `FIREBASE_APP_ID` - ID da aplicação

### 🚨 Quando se preocupar

**Erros que indicam problemas reais:**
- `Firebase Admin SDK não inicializado`
- `Erro interno no servidor: serviço de autenticação indisponível`
- Status 500 em endpoints públicos

**Erros normais (não são problemas):**
- `Token inválido ou expirado`
- `Token de autenticação ausente`
- Status 401 em endpoints protegidos sem token

### 🛠️ Ferramentas de Debug

1. **Verificar configuração:**
   ```bash
   node check-firebase-config.js
   ```

2. **Testar endpoints públicos:**
   ```bash
   node test-simple.js
   ```

3. **Testar com token real:**
   ```bash
   node test-functional.js
   ```

### 📊 Monitoramento

**Logs normais de operação:**
- Health checks bem-sucedidos
- Tentativas de acesso sem token (401)
- Tokens expirados (401)

**Logs que requerem atenção:**
- Erros 500
- Falhas de inicialização do Firebase
- Problemas de conectividade com o Firestore

---

## Status Atual da API

✅ **API Funcionando Corretamente**
- Endpoints públicos: OK
- Autenticação Firebase: OK
- Validação de tokens: OK
- Deploy automático: OK

Os erros de token nos logs são **comportamento esperado** quando usuários tentam acessar rotas protegidas sem autenticação adequada.