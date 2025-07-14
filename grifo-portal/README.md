# Grifo Portal

Portal web para gerenciamento de vistorias imobiliárias da Grifo Vistorias.

## Tecnologias Utilizadas

- React 18
- TypeScript
- Vite
- React Router
- Styled Components
- Firebase Authentication
- Axios

## Requisitos

- Node.js 18+
- npm ou yarn

## Instalação

```bash
# Instalar dependências
npm install

# ou com yarn
yarn
```

## Configuração

Crie um arquivo `.env.local` baseado no `.env.example` e preencha com suas configurações:

```
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=your_firebase_api_key
# ... outras variáveis
```

## Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# ou com yarn
yarn dev
```

## Build para Produção

```bash
# Gerar build de produção
npm run build

# ou com yarn
yarn build
```

## Preview da Build

```bash
# Visualizar build de produção localmente
npm run preview

# ou com yarn
yarn preview
```

## Estrutura do Projeto

```
/
├── public/              # Arquivos estáticos
├── src/                 # Código fonte
│   ├── components/      # Componentes React
│   ├── pages/           # Páginas do portal
│   ├── services/        # Serviços (API, Firebase)
│   ├── App.tsx          # Componente principal
│   └── main.tsx         # Ponto de entrada
├── .env.example         # Exemplo de variáveis de ambiente
└── vite.config.ts       # Configuração do Vite
```

## Integração com Backend

O portal se comunica com a API backend através do serviço Axios configurado em `src/services/api.ts`.

## Deploy

### Deploy no Render

Este projeto está configurado para ser facilmente implantado no Render usando o arquivo `render.yaml`.

#### Passos para Deploy

1. Crie uma conta no [Render](https://render.com/) se ainda não tiver uma.

2. No dashboard do Render, clique em "New" e selecione "Blueprint".

3. Conecte seu repositório GitHub ou GitLab que contém o código do projeto.

4. O Render detectará automaticamente o arquivo `render.yaml` e configurará os serviços conforme definido.

5. Configure as variáveis de ambiente necessárias no dashboard do Render:
   - Para o serviço da API (grifo-api), configure todas as variáveis de ambiente do Firebase e outras variáveis necessárias.
   - Para o serviço do frontend (grifo-portal), configure as variáveis de ambiente do Firebase com o prefixo VITE_.

6. Clique em "Apply" para iniciar o deploy.

7. Após a conclusão do deploy, seus serviços estarão disponíveis nos URLs fornecidos pelo Render.

### Configuração Manual no Render

Se preferir configurar manualmente sem usar o arquivo `render.yaml`:

#### Para a API:

1. No dashboard do Render, clique em "New" e selecione "Web Service".
2. Conecte seu repositório e selecione o diretório da API.
3. Configure o serviço com:
   - Nome: grifo-api
   - Ambiente: Node
   - Comando de Build: `npm install && npm run build`
   - Comando de Start: `npm start`
   - Adicione todas as variáveis de ambiente necessárias.

#### Para o Frontend:

1. No dashboard do Render, clique em "New" e selecione "Static Site".
2. Conecte seu repositório e selecione o diretório do frontend.
3. Configure o serviço com:
   - Nome: grifo-portal
   - Comando de Build: `npm install && npm run build`
   - Diretório de Publicação: `dist`
   - Adicione as variáveis de ambiente necessárias, incluindo `VITE_API_URL` apontando para a URL da sua API.

### Outros Serviços de Hospedagem

O portal também pode ser implantado em serviços como Netlify, Vercel ou Firebase Hosting.

```bash
# Build para produção
npm run build
```