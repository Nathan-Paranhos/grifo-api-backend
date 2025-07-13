# Instruções de Deploy para Grifo API Backend

## Deploy no Render.com

### Pré-requisitos
- Conta no [Render.com](https://render.com)
- Repositório Git com o código do projeto

### Passos para Deploy

1. **Faça login no Render.com**

2. **Crie um novo Web Service**
   - Clique em "New" e selecione "Web Service"
   - Conecte seu repositório Git
   - Selecione o repositório do projeto

3. **Configure o Web Service**
   - **Nome**: `grifo-api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plano**: Selecione o plano adequado (Free para testes)

4. **Configure as Variáveis de Ambiente**
   - Clique na aba "Environment"
   - Adicione as seguintes variáveis:
     ```
     PORT=3000
     NODE_ENV=production
     CORS_ORIGIN=https://app.grifovistorias.com,android-app://com.grifo.vistorias
     LOG_LEVEL=info
     RATE_LIMIT_WINDOW_MS=900000
     RATE_LIMIT_MAX=100
     JWT_SECRET=seu_segredo_jwt_seguro
     JWT_EXPIRES_IN=1d
     ```

5. **Clique em "Create Web Service"**

6. **Aguarde o Deploy**
   - O Render irá construir e implantar automaticamente seu aplicativo
   - Você pode acompanhar o progresso na aba "Logs"

7. **Teste a API**
   - Após o deploy, teste a API usando o endpoint de saúde:
   - `curl https://grifo-api.onrender.com/api/health`

## Atualizações e Redeployment

### Deploy Manual

1. Faça suas alterações no código
2. Commit e push para o repositório Git
3. No Render.com, vá para seu Web Service
4. Clique em "Manual Deploy" > "Deploy latest commit"

### Deploy Automático

O Render.com suporta deploy automático quando você faz push para a branch principal. Para configurar:

1. No Render.com, vá para seu Web Service
2. Clique na aba "Settings"
3. Em "Auto-Deploy", selecione "Yes"

## Monitoramento

- **Logs**: Acesse os logs do aplicativo na aba "Logs" do seu Web Service
- **Métricas**: Visualize métricas de desempenho na aba "Metrics"

## Solução de Problemas

### API retorna "Rota não encontrada"
- Verifique se a rota está corretamente implementada no código
- Verifique se o arquivo de rotas está sendo importado em `index.ts`

### API retorna "Não autorizado"
- Verifique se o token JWT está sendo enviado corretamente
- Verifique se o middleware de autenticação está configurado corretamente

### Erro de CORS
- Verifique se a variável de ambiente `CORS_ORIGIN` inclui todos os domínios necessários

## Contato e Suporte

Para suporte técnico, entre em contato com a equipe de desenvolvimento.