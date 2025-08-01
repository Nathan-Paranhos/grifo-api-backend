# Deploy no Render via GitHub

## Configuração Inicial

### 1. Preparar o Repositório GitHub

1. **Criar repositório no GitHub** (se ainda não existir)
2. **Atualizar a URL do repositório** no arquivo `render.yaml`:
   ```yaml
   repo: https://github.com/SEU-USUARIO/grifo-mobile.git
   ```

3. **Fazer push do código**:
   ```bash
   git add .
   git commit -m "feat: configuração para deploy no Render"
   git push origin main
   ```

### 2. Configurar o Render

1. **Acessar o Render Dashboard**: https://dashboard.render.com
2. **Conectar com GitHub**: Autorizar o Render a acessar seus repositórios
3. **Criar novo Web Service**:
   - Selecionar o repositório `grifo-mobile`
   - Escolher "Use existing render.yaml"
   - O Render detectará automaticamente o arquivo `render.yaml`

### 3. Variáveis de Ambiente

As seguintes variáveis já estão configuradas no `render.yaml`:

- `NODE_ENV=production`
- `PORT=3000`
- `CORS_ORIGIN` (múltiplos domínios)
- `FIREBASE_*` (configurações do Firebase)
- `JWT_*` (configurações de autenticação)
- `RATE_LIMIT_*` (configurações de rate limiting)

### 4. Deploy Automático

O deploy será automático quando:
- Houver push na branch `main`
- Arquivos na pasta `grifo-api-backend/` forem modificados
- Arquivos `.md` e `.gitignore` são ignorados

## Estrutura do Projeto

```
grifo-mobile/
├── grifo-api-backend/          # Backend API
│   ├── src/                    # Código fonte
│   ├── dist/                   # Código compilado (ignorado)
│   ├── package.json           # Dependências
│   ├── render.yaml            # Configuração do Render
│   └── tsconfig.json          # Configuração TypeScript
└── outros-projetos/           # Outros projetos do monorepo
```

## Comandos de Build

- **Build**: `npm run build`
- **Start**: `npm start`
- **Dev**: `npm run dev:win`

## Health Check

O Render monitora a saúde da aplicação através do endpoint:
- **URL**: `/health`
- **Resposta**: `{"status": "ok", "timestamp": "..."}`

## Logs

Para visualizar logs:
1. Acessar o Render Dashboard
2. Selecionar o serviço `grifo-api-backend`
3. Ir na aba "Logs"

## Troubleshooting

### Build Falha
- Verificar se todas as dependências estão no `package.json`
- Verificar erros de TypeScript
- Verificar logs de build no Render

### Deploy Falha
- Verificar variáveis de ambiente
- Verificar configurações do Firebase
- Verificar health check endpoint

### Aplicação não Responde
- Verificar se a porta está correta (3000)
- Verificar logs de runtime
- Verificar configurações de CORS