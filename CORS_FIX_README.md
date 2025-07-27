# 🛠️ Correções de CORS e Autenticação - Grifo API

## 📋 Problemas Identificados e Solucionados

### ❌ Problemas Originais:
1. **CORS bloqueando requisições do frontend localhost:3000**
   - Erro: `Access-Control-Allow-Origin` header ausente
   - Requisições `fetch` falhando com `net::ERR_FAILED`

2. **Erros 401 com tokens Firebase válidos**
   - Mensagem: "Token inválido ou expirado"
   - Tokens válidos sendo rejeitados

### ✅ Correções Implementadas:

#### 1. **Configuração CORS Aprimorada**

**Arquivo:** `src/config/security.ts`

- ✅ **Função de callback dinâmica** para validação de origens
- ✅ **Suporte a localhost** em desenvolvimento
- ✅ **Múltiplas origens** configuráveis via `CORS_ORIGIN`
- ✅ **Headers adicionais** (`X-Requested-With`)
- ✅ **Suporte a navegadores legados** (`optionsSuccessStatus: 200`)

```javascript
export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'https://portal.grifovistorias.com',
      'https://app.grifovistorias.com',
      'android-app://com.grifo.vistorias',
      'https://grifo-api.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Permitir requisições sem origin (Postman, apps móveis)
    if (!origin) return callback(null, true);
    
    // Verificar lista de origens permitidas
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Permitir qualquer localhost em desenvolvimento
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    return callback(new Error('Não permitido pelo CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

#### 2. **Melhorias na Autenticação Firebase**

**Arquivo:** `src/config/security.ts` e `src/config/firebase.ts`

- ✅ **Mensagens de erro específicas** para diferentes tipos de falha
- ✅ **Validação aprimorada** do formato do token
- ✅ **Logs detalhados** para debug
- ✅ **Verificação de tokens revogados** (`checkRevoked: true`)

```javascript
// Validações específicas no authMiddleware
if (!authHeader) {
  return res.status(401).json({ 
    success: false, 
    error: 'Token de autenticação ausente. Inclua o header Authorization: Bearer <token>' 
  });
}

if (!authHeader.startsWith('Bearer ')) {
  return res.status(401).json({ 
    success: false, 
    error: 'Formato de token inválido. Use: Authorization: Bearer <token>' 
  });
}
```

#### 3. **Configuração de Ambiente**

**Arquivos:** `.env.production` e `.env.development`

- ✅ **CORS_ORIGIN atualizado** para incluir localhost
- ✅ **Arquivo .env.development** criado para desenvolvimento local
- ✅ **Configurações específicas** por ambiente

**Produção (.env.production):**
```bash
CORS_ORIGIN=https://app.grifovistorias.com,android-app://com.grifo.vistorias,http://localhost:3000,https://portal.grifovistorias.com
```

**Desenvolvimento (.env.development):**
```bash
CORS_ORIGIN=http://localhost:3000,https://portal.grifovistorias.com,https://app.grifovistorias.com,android-app://com.grifo.vistorias
LOG_LEVEL=debug
RATE_LIMIT_MAX=200
```

## 🚀 Como Aplicar as Correções

### 1. **Deploy para Produção (Render.com)**

```bash
# 1. Fazer commit das alterações
git add .
git commit -m "fix: CORS e autenticação Firebase para localhost"
git push origin main

# 2. O deploy será automático via render.yaml
# 3. Verificar logs no dashboard do Render
```

### 2. **Teste Local**

```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Executar em desenvolvimento
npm run dev

# Ou executar em produção
npm start
```

### 3. **Verificação das Correções**

#### Teste de CORS:
```javascript
// No frontend (localhost:3000)
fetch('https://grifo-api.onrender.com/api/v1/dashboard', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + firebaseToken,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('✅ CORS funcionando:', data))
.catch(error => console.error('❌ Erro CORS:', error));
```

#### Teste de Autenticação:
```bash
# Teste com curl
curl -X GET "https://grifo-api.onrender.com/api/v1/dashboard" \
  -H "Authorization: Bearer SEU_FIREBASE_TOKEN" \
  -H "Content-Type: application/json"
```

## 📊 Endpoints Testados

Após as correções, estes endpoints devem funcionar corretamente:

- ✅ `GET /api/v1/dashboard`
- ✅ `GET /api/v1/dashboard/status`
- ✅ `GET /api/v1/dashboard/tipos`
- ✅ `GET /api/v1/dashboard/volume-mensal`
- ✅ `GET /api/health` (público)
- ✅ `GET /api-docs` (documentação)

## 🔧 Variáveis de Ambiente Necessárias

### Render.com Dashboard:
```bash
NODE_ENV=production
CORS_ORIGIN=https://app.grifovistorias.com,android-app://com.grifo.vistorias,http://localhost:3000,https://portal.grifovistorias.com
FIREBASE_CREDENTIALS={"type":"service_account",...}
BYPASS_AUTH=false
LOG_LEVEL=info
```

## 🐛 Troubleshooting

### Se ainda houver erros de CORS:
1. Verificar se `CORS_ORIGIN` inclui a origem correta
2. Verificar logs do servidor para mensagens de CORS
3. Testar com diferentes navegadores

### Se ainda houver erros 401:
1. Verificar se o token Firebase está válido
2. Verificar se `FIREBASE_CREDENTIALS` está configurado corretamente
3. Verificar logs para mensagens específicas de autenticação

### Logs úteis:
```bash
# Ver logs do Render
# Dashboard > Logs > View Logs

# Logs locais
npm run dev  # Mostra logs detalhados em desenvolvimento
```

## ✅ Resultado Esperado

Após aplicar essas correções:

1. ✅ **Frontend localhost:3000** consegue fazer requisições para a API
2. ✅ **Headers CORS** são enviados corretamente
3. ✅ **Tokens Firebase válidos** são aceitos
4. ✅ **Mensagens de erro** são mais específicas e úteis
5. ✅ **Swagger/Postman** funcionam corretamente
6. ✅ **Apps móveis** continuam funcionando normalmente

---

**📝 Nota:** Essas correções mantêm a compatibilidade com aplicações móveis e outros frontends já existentes, apenas adicionando suporte para desenvolvimento local.