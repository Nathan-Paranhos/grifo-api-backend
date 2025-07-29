# 📚 Documentação Completa do Sistema Grifo API

## 🎯 Visão Geral

O **Grifo API** é um backend para gerenciamento de propriedades e usuários, integrado com Firebase para autenticação. O sistema está hospedado no Render e usa Node.js com Express.

### Status Atual
- **Servidor**: Ativo em https://grifo-api.onrender.com
- **Autenticação**: Firebase Admin SDK configurado, middleware ativo
- **Endpoints**: Públicos funcionando (200 OK), protegidos requerendo token (401 sem token)
- **Testes**: Scripts de validação criados e funcionando

### O Que Foi Feito
- Configuração inicial do Firebase
- Criação de middleware de segurança
- Implementação de rotas API (v1, legacy)
- Deploy em produção no Render
- Configuração de variáveis de ambiente

### Próximas Melhorias
1. **Integração com Frontend/Mobile**:
   - Implemente autenticação Firebase no app mobile (React Native ou similar).
   - Use ID tokens nas requisições para endpoints protegidos.

2. **Monitoramento e Segurança**:
   - Configure logs no Render para monitoramento.
   - Adicione rate limiting e mais segurança.

3. **Documentação Adicional**:
   - Swagger para documentar endpoints.
   - Guia de deploy local.

## 🛠 Orientação de Uso

### 1. Configuração Inicial
- **Requisitos**: Node.js, npm, conta Firebase.
- **Instalação**:
  ```bash
  npm install
  ```
- **Variáveis de Ambiente**: Configure em `.env` ou `render.yaml` (veja `GUIA_TOKENS_FIREBASE.md`).

### 2. Rodando Localmente
```bash
npm run dev
```
Acesse http://localhost:3000

### 3. Testando a API
- **Endpoints Públicos**: Acessíveis sem autenticação
  - `GET /`: Informações da API
  - `GET /api/health`: Status do sistema

- **Endpoints Protegidos**: Requerem token Firebase
  - Retornam 401 Unauthorized sem token válido
  - Retornam dados quando autenticado corretamente

### 4. Endpoints Principais

#### Públicos
- `GET /`: Informações da API
- `GET /api/health`: Status do sistema

#### Protegidos (Requer `Authorization: Bearer <token>`)
- `GET /api/v1/properties`: Lista propriedades
- `POST /api/v1/properties`: Cria propriedade
- `GET /api/v1/users`: Lista usuários
- `GET /api/v1/dashboard`: Estatísticas do dashboard
- `GET /api/v1/inspections`: Lista de vistorias

### 5. Autenticação
- Use Firebase para gerar ID tokens.
- Para bypass em dev: Defina `BYPASS_AUTH=true`.
- Configure as credenciais Firebase no ambiente de produção.

### 6. Troubleshooting
- **401 Unauthorized**: Token inválido ou ausente (comportamento esperado).
- **CREDENTIAL_MISMATCH**: Credenciais Firebase erradas; verifique `project_id`.
- **500 Internal Server Error**: Verifique logs no Render Console.

## 📂 Estrutura do Projeto

- `src/`: Código fonte (config, middleware, routes)
- `render.yaml`: Configuração de deploy
- `.env.*`: Variáveis de ambiente
- `package.json`: Dependências e scripts
- `Dockerfile`: Configuração de container

## 🚀 Próximos Passos
1. Integre com o app mobile.
2. Configure monitoramento avançado.
3. Adicione features pendentes.
4. Implemente testes automatizados.

Para suporte, consulte o Firebase Console ou logs do Render.