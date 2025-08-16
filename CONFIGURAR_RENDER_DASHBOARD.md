# 🚨 CONFIGURAÇÃO CRÍTICA - Dashboard Render

## ⚠️ PROBLEMA IDENTIFICADO
A API de produção não consegue acessar o Supabase porque as **variáveis de ambiente não estão configuradas** no dashboard do Render.

## 📋 VARIÁVEIS OBRIGATÓRIAS
Copie estas variáveis do arquivo `.env.render` para o dashboard:

```bash
# Supabase Configuration
SUPABASE_URL=https://fsvwifbvehdhlufauahj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdndpZmJ2ZWhkaGx1ZmF1YWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzU2NzAsImV4cCI6MjA1MDU1MTY3MH0.YBNKvJTfhNJhEhKGJhEhKGJhEhKGJhEhKGJhEhKGJhE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdndpZmJ2ZWhkaGx1ZmF1YWhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk3NTY3MCwiZXhwIjoyMDUwNTUxNjcwfQ.SERVICE_ROLE_KEY_AQUI

# JWT Configuration
JWT_SECRET=sua_chave_jwt_super_secreta_aqui_com_pelo_menos_32_caracteres

# Environment
NODE_ENV=production
PORT=10000
```

## 🔧 PASSOS PARA CONFIGURAR

### 1. Acessar Dashboard Render
1. Acesse: https://dashboard.render.com
2. Faça login na sua conta
3. Encontre o serviço da API Grifo

### 2. Configurar Variáveis
1. Clique no serviço da API
2. Vá para a aba **"Environment"**
3. Clique em **"Add Environment Variable"**
4. Adicione cada variável uma por vez:

| Nome | Valor |
|------|-------|
| `SUPABASE_URL` | `https://fsvwifbvehdhlufauahj.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `JWT_SECRET` | `sua_chave_jwt_super_secreta_aqui...` |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |

### 3. Redeploy Automático
Após salvar as variáveis, o Render fará redeploy automático.

### 4. Verificar Status
Aguarde o deploy completar (5-10 minutos) e teste novamente.

## 🧪 TESTE APÓS CONFIGURAÇÃO
```bash
node test-production-login.mjs
```

## ✅ RESULTADO ESPERADO
```
✅ SUCESSO! Login funcionou na API de produção!
🎉 Problema 401 RESOLVIDO!
🎫 Token JWT recebido: eyJhbGciOiJIUzI1NiIs...
```

## 📊 STATUS FINAL ESPERADO
- ✅ Portal Web: 100% funcional
- ✅ App Mobile + API Local: 100% funcional  
- ✅ App Mobile + API Produção: 100% funcional
- 🎯 **Taxa de Sucesso: 100% (4/4 cenários)**

---

**⚠️ IMPORTANTE:** Sem essas variáveis, a API não consegue se conectar ao Supabase e todos os logins falharão com erro 401.