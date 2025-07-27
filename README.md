# Grifo API Backend

API backend para o sistema de vistorias Grifo. Esta API é responsável por gerenciar toda a lógica de negócio, autenticação de usuários, e persistência de dados para o aplicativo móvel e o portal web do Grifo.

[![Node.js CI](https://github.com/seu-usuario/grifo-api-backend/actions/workflows/node.js.yml/badge.svg)](https://github.com/seu-usuario/grifo-api-backend/actions/workflows/node.js.yml)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## ✨ Features

- **Autenticação Segura**: Utiliza Firebase Authentication para gerenciamento de usuários e tokens JWT.
- **Endpoints Versionados**: API estruturada com versionamento (`/api/v1`) para garantir compatibilidade com futuras versões.
- **Validação de Dados**: Validação de entrada de dados com Zod para garantir a integridade dos dados.
- **Logging Robusto**: Sistema de logs com Winston, separando os logs por nível (error, info) e ambiente.
- **Documentação Interativa**: Documentação da API gerada automaticamente com Swagger (OpenAPI).
- **Health Check**: Endpoint de health check para monitoramento da saúde da aplicação.
- **Pronto para Deploy**: Configurado para deploy contínuo em serviços como Render e Heroku usando Docker.

## 🚀 Tecnologias Principais

- **Backend**: Node.js, Express, TypeScript
- **Banco de Dados**: Firebase Firestore
- **Autenticação**: Firebase Authentication
- **Validação**: Zod
- **Logging**: Winston
- **Documentação**: Swagger UI Express, OpenAPI
- **Containerização**: Docker

## 📁 Estrutura do Projeto

```
/grifo-api-backend
├── .github/            # Configurações de CI/CD do GitHub Actions
├── dist/               # Código compilado (JavaScript)
├── logs/               # Arquivos de log gerados pela aplicação
├── src/
│   ├── config/         # Configurações (Firebase, Logger, Swagger, etc.)
│   ├── middleware/     # Middlewares (autenticação, validação, etc.)
│   ├── routes/         # Definição das rotas da API
│   ├── types/          # Definições de tipos e interfaces TypeScript
│   ├── utils/          # Funções utilitárias (validação, formatação de resposta)
│   └── index.ts        # Ponto de entrada da aplicação
├── .dockerignore       # Arquivos a serem ignorados pelo Docker
├── .env.example        # Exemplo de arquivo de variáveis de ambiente
├── .gitignore          # Arquivos a serem ignorados pelo Git
├── Dockerfile          # Configuração para build da imagem Docker
├── package.json        # Dependências e scripts do projeto
├── render.yaml         # Configuração de deploy para o Render.com
└── tsconfig.json       # Configurações do compilador TypeScript
```

## 🔧 Configuração do Ambiente de Desenvolvimento

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/seu-usuario/grifo-api-backend.git
    cd grifo-api-backend
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente**:
    - Copie o arquivo `.env.example` para `.env` (para desenvolvimento local) ou `.env.production`.
    - Preencha as variáveis de ambiente necessárias, especialmente as credenciais do Firebase.

    **`.env` (exemplo)**:
    ```env
    # Server
    NODE_ENV=development
    PORT=3000

    # Firebase - Obtenha no console do Firebase
    FIREBASE_API_KEY="..."
    FIREBASE_AUTH_DOMAIN="..."
    FIREBASE_PROJECT_ID="..."
    FIREBASE_STORAGE_BUCKET="..."
    FIREBASE_MESSAGING_SENDER_ID="..."
    FIREBASE_APP_ID="..."
    FIREBASE_CREDENTIALS='{...}' # JSON do Service Account

    # Security
    BYPASS_AUTH=true # Apenas para desenvolvimento
    ```

4.  **Execute a aplicação em modo de desenvolvimento**:
    ```bash
    npm run dev
    ```

    A API estará disponível em `http://localhost:3000`.

## 🛠️ Scripts NPM

-   `npm run dev`: Inicia o servidor em modo de desenvolvimento com `ts-node-dev`.
-   `npm run build`: Compila o código TypeScript para JavaScript no diretório `dist/`.
-   `npm start`: Inicia o servidor em modo de produção (executa o código de `dist/`).
-   `npm test`: Executa os testes (a ser implementado).

## 🔐 Autenticação

A API utiliza o Firebase Authentication. Para acessar os endpoints protegidos, é necessário enviar um `ID Token` do Firebase no cabeçalho `Authorization`.

```http
GET /api/v1/dashboard
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

Em ambiente de desenvolvimento, a autenticação pode ser desabilitada configurando `BYPASS_AUTH=true` no arquivo `.env`.

## 📚 Documentação da API (Swagger)

A documentação completa e interativa da API está disponível no endpoint `/api-docs`.

-   **Desenvolvimento**: `http://localhost:3000/api-docs`
-   **Produção**: `https://sua-api.onrender.com/api-docs`

## 🌐 Deploy

O deploy da aplicação é automatizado para a plataforma [Render](https://render.com/).

### Deploy com Render

1.  **Conecte seu repositório GitHub ao Render**.
2.  **Crie um novo "Web Service"** e aponte para este repositório.
3.  **Configure as variáveis de ambiente** no dashboard do Render, especialmente `FIREBASE_CREDENTIALS` e outras chaves sensíveis.
4.  O Render usará o arquivo `render.yaml` para configurar o build e o deploy automaticamente a cada push na branch `main`.

### Deploy com Docker

É possível também fazer o deploy da aplicação em qualquer serviço que suporte Docker.

1.  **Construa a imagem Docker**:
    ```bash
    docker build -t grifo-api-backend .
    ```

2.  **Execute o container**:
    ```bash
    docker run -p 3000:3000 -e NODE_ENV=production --env-file ./.env.production grifo-api-backend
    ```

## 📝 Logging

Os logs são gerenciados pelo Winston e são cruciais para monitoramento e debugging.

-   **`logs/error.log`**: Registra apenas erros críticos da aplicação.
-   **`logs/combined.log`**: Registra todas as saídas de log (erros e informações).
-   No console (durante o desenvolvimento), os logs são formatados com cores para melhor legibilidade.

## 🤝 Como Contribuir

Contribuições são bem-vindas! Para contribuir com o projeto, siga os passos:

1.  **Faça um Fork** do projeto.
2.  **Crie uma nova branch** (`git checkout -b feature/nova-feature`).
3.  **Faça suas alterações** e commit (`git commit -m 'Adiciona nova feature'`).
4.  **Faça o Push** para a sua branch (`git push origin feature/nova-feature`).
5.  **Abra um Pull Request**.

---

*Documentação gerada e mantida por Trae AI.*