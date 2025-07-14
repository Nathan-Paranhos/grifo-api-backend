# Grifo Vistorias - Sistema Completo

## 📱 Sobre o Projeto

O Grifo Vistorias é um sistema completo para gerenciamento de vistorias imobiliárias, composto por três componentes principais:

1. **API Backend** - Serviço REST em Node.js/Express/TypeScript
2. **Portal Web** - Aplicação web em React/TypeScript
3. **Aplicativo Móvel** - Aplicativo em React Native/Expo

O aplicativo móvel permite que vistoriadores capturem fotos, preencham checklists e sincronizem dados com o sistema web da empresa.

## 🌐 URLs de Produção

- **API Backend**: https://grifo-api.onrender.com
- **Portal Web**: https://grifo-portal.netlify.app

## 🚀 Funcionalidades

### ✅ Implementadas
- **Autenticação**: Login seguro com Firebase Auth
- **Dashboard**: Visão geral das vistorias e estatísticas
- **Nova Vistoria**: Criação de vistorias com fotos e checklist
- **Gestão de Imóveis**: Listagem e busca de propriedades
- **Histórico**: Visualização de vistorias realizadas
- **Perfil**: Configurações do usuário
- **Sincronização Offline**: Armazenamento local com sync automático
- **API REST**: Endpoints para comunicação com dashboard web

### 🔄 Funcionalidades de Sincronização
- Armazenamento offline de vistorias
- Sincronização automática quando online
- Retry automático para falhas de sincronização
- Status de sincronização em tempo real

## 🛠 Tecnologias Utilizadas

- **React Native** com Expo SDK 52
- **Expo Router** para navegação
- **Firebase** (Auth, Firestore, Storage)
- **TypeScript** para tipagem
- **AsyncStorage** para cache local
- **Expo Camera** para captura de fotos
- **Lucide React Native** para ícones

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI
- Android Studio (para Android)
- Xcode (para iOS)

## 📁 Estrutura do Projeto

O projeto está organizado em três diretórios principais:

- `/` (raiz) - Aplicativo móvel (React Native/Expo)
- `/grifo-api-backend` - API Backend (Node.js/Express/TypeScript)
- `/grifo-portal` - Portal Web (React/TypeScript/Vite)

## 🔧 Instalação e Execução

### Aplicativo Móvel (Raiz)

1. **Instale as dependências**
```bash
npm install
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.development
cp .env.example .env.production
```

3. **Configure o Firebase**
- Crie um projeto no Firebase Console
- Adicione as configurações nos arquivos de ambiente
- Configure Authentication e Firestore

4. **Execute o projeto**
```bash
npm run dev
```

### API Backend

1. **Navegue para o diretório**
```bash
cd grifo-api-backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.development
cp .env.example .env.production
```

4. **Execute em desenvolvimento**
```bash
npm run dev
```

5. **Build e execução em produção**
```bash
npm run build
npm start
```

### Portal Web

1. **Navegue para o diretório**
```bash
cd grifo-portal
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.development
cp .env.example .env.production
```

4. **Execute em desenvolvimento**
```bash
npm run dev
```

5. **Build para produção**
```bash
npm run build
npm run preview  # Para testar o build localmente
```

## 🚢 Build e Deploy

### Ambientes

O sistema possui três ambientes configurados:

- **Development**: Ambiente local para desenvolvimento
- **Preview**: Ambiente de homologação
- **Production**: Ambiente de produção

Cada componente possui seu próprio arquivo de variáveis de ambiente para cada ambiente:

- `.env.development`
- `.env.production`

### Aplicativo Móvel (EAS Build)

O aplicativo móvel utiliza o Expo Application Services (EAS) para build e deploy:

```bash
# Instalar EAS CLI (se necessário)
npm install -g eas-cli

# Login no Expo
eas login

# Configurar o projeto
eas build:configure

# Build para desenvolvimento (com cliente de desenvolvimento)
eas build --profile development --platform android

# Build para preview (homologação)
eas build --profile preview --platform android

# Build para produção
eas build --profile production --platform android

# Build para iOS (requer conta Apple Developer)
eas build --profile production --platform ios
```

### API Backend (Render.com)

A API é hospedada no Render.com:

```bash
# Build local para testar
cd grifo-api-backend
npm run build

# O deploy é feito automaticamente pelo Render.com
# quando há push para a branch main no GitHub
```

### Portal Web (Netlify)

O portal web é hospedado no Netlify:

```bash
# Build local para testar
cd grifo-portal
npm run build

# O deploy é feito automaticamente pelo Netlify
# quando há push para a branch main no GitHub
```

### CI/CD

O projeto utiliza GitHub Actions para automação de CI/CD. Os workflows estão configurados para:

1. Testar e fazer deploy da API no Render.com
2. Testar e fazer deploy do Portal Web no Netlify
3. Construir e publicar o aplicativo móvel via EAS

#### Atualização de Versão

```bash
# Atualizar versão do app
npm run version 1.0.1

# Atualizar versão e build number
npm run version 1.0.1 2
```

## 📱 Estrutura do Projeto

### Aplicativo Móvel (Raiz)

```
app/
├── _layout.tsx              # Layout raiz
├── index.tsx               # Tela inicial (redirecionamento)
├── auth/
│   └── login.tsx           # Tela de login
├── (tabs)/                 # Navegação por abas
│   ├── _layout.tsx         # Layout das abas
│   ├── index.tsx           # Dashboard
│   ├── imoveis.tsx         # Lista de imóveis
│   ├── nova-vistoria.tsx   # Nova vistoria
│   ├── vistorias.tsx       # Histórico de vistorias
│   └── perfil.tsx          # Perfil do usuário
└── api/                    # API Routes
    ├── health+api.ts       # Health check
    ├── inspections+api.ts  # CRUD de vistorias
    ├── properties+api.ts   # CRUD de imóveis
    ├── sync+api.ts         # Sincronização
    └── dashboard/
        └── stats+api.ts    # Estatísticas do dashboard

src/
├── components/             # Componentes reutilizáveis
├── contexts/              # Contextos React
├── services/              # Serviços (API, Storage, Sync)
├── theme/                 # Cores e estilos globais
└── config/                # Configurações (Firebase)

scripts/
├── build.js               # Script de automação de build
├── deploy.js              # Script de automação de deploy
└── version.js             # Script de atualização de versão
```

### API Backend

```
grifo-api-backend/
├── src/
│   ├── config/            # Configurações da aplicação
│   ├── controllers/       # Controladores da API
│   ├── middlewares/       # Middlewares Express
│   ├── models/            # Modelos de dados
│   ├── routes/            # Rotas da API
│   ├── services/          # Serviços de negócio
│   ├── utils/             # Utilitários
│   └── app.ts             # Configuração do Express
├── tests/                 # Testes automatizados
└── dist/                  # Código compilado (build)
```

### Portal Web

```
grifo-portal/
├── src/
│   ├── assets/            # Recursos estáticos
│   ├── components/        # Componentes React
│   ├── contexts/          # Contextos React
│   ├── hooks/             # Hooks personalizados
│   ├── pages/             # Páginas da aplicação
│   ├── services/          # Serviços (API, Auth)
│   ├── styles/            # Estilos globais
│   └── utils/             # Utilitários
└── dist/                  # Código compilado (build)
```

## 🎨 Design System

### Cores
```typescript
const colors = {
  primary: '#000000',      // Preto principal
  secondary: '#C8A157',    // Dourado
  accent: '#FFD700',       // Dourado claro
  success: '#10B981',      // Verde
  warning: '#F59E0B',      // Amarelo
  error: '#EF4444',        // Vermelho
  // ... outras cores
}
```

### Componentes
- **CustomButton**: Botão com gradiente e estados
- **LoadingOverlay**: Overlay de carregamento
- **Cards**: Componentes de cartão padronizados

## 🔐 Autenticação

O app utiliza Firebase Authentication com email/senha:

```typescript
// Login
await signIn(email, password);

// Logout
await signOut();
```

### Estrutura do Usuário
```typescript
interface UserData {
  uid: string;
  email: string;
  name: string;
  empresaId: string;
  role: 'admin' | 'vistoriador' | 'cliente';
  createdAt: Date;
}
```

## 📊 API Endpoints

### Base URL
- Desenvolvimento: `http://localhost:8081`
- Produção: `https://your-domain.com`

### Endpoints Disponíveis

#### Health Check
```
GET /api/health
```

#### Vistorias
```
GET /api/inspections?empresaId=xxx&vistoriadorId=xxx
POST /api/inspections
```

#### Imóveis
```
GET /api/properties?empresaId=xxx&search=xxx
```

#### Sincronização
```
POST /api/sync
```

#### Dashboard Stats
```
GET /api/dashboard/stats?empresaId=xxx&vistoriadorId=xxx
```

## 💾 Armazenamento Local

### AsyncStorage Keys
- `pending_inspections`: Vistorias pendentes de sincronização
- `offline_data_*`: Dados offline por categoria
- `user_preferences`: Preferências do usuário

### Estrutura de Vistoria
```typescript
interface PendingInspection {
  id: string;
  empresaId: string;
  imovelId: string;
  tipo: 'entrada' | 'saida' | 'manutencao';
  fotos: string[];
  checklist: Record<string, string>;
  observacoes: string;
  createdAt: string;
  status: 'pending' | 'synced' | 'error';
}
```

## 🔄 Sincronização

### Fluxo de Sincronização
1. Vistoria salva localmente
2. Tentativa de sincronização automática
3. Retry em caso de falha
4. Notificação de status

### Serviços
- **StorageService**: Gerenciamento do AsyncStorage
- **SyncService**: Lógica de sincronização
- **ApiService**: Comunicação com API

## 📱 Funcionalidades por Tela

### Dashboard
- Estatísticas gerais
- Vistorias pendentes
- Ações rápidas
- Botão para dashboard web

### Nova Vistoria
- Seleção de imóvel
- Tipo de vistoria
- Captura de fotos
- Checklist interativo
- Observações

### Imóveis
- Lista de propriedades
- Busca por endereço/código
- Estatísticas por status
- Detalhes do imóvel

### Vistorias
- Histórico completo
- Filtros por status
- Vistorias pendentes
- Detalhes da vistoria

### Perfil
- Dados do usuário
- Configurações
- Informações da empresa
- Logout

## 🔧 Configuração para Android

### Permissões (app.json)
```json
{
  "android": {
    "permissions": [
      "android.permission.CAMERA",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_EXTERNAL_STORAGE"
    ]
  }
}
```

### Build para Android
```bash
# Development build
expo build:android

# Production build
expo build:android --type app-bundle
```

## 🚀 Deploy

### Web (Dashboard)
```bash
npm run build:web
```

### Mobile
```bash
# Android
expo build:android

# iOS
expo build:ios
```

## 🧪 Testes

### Executar testes
```bash
npm test
```

### Testar API
```bash
# Health check
curl http://localhost:8081/api/health

# Get inspections
curl "http://localhost:8081/api/inspections?empresaId=test"
```

## 📝 Logs e Debug

### Logs importantes
- Erros de sincronização
- Falhas de API
- Problemas de autenticação
- Cache do Metro

### Debug no Android
```bash
# Logs do dispositivo
adb logcat

# Reload da aplicação
adb shell input keyevent 82
```

## 🔒 Segurança

### Boas Práticas
- Validação de dados no cliente e servidor
- Sanitização de inputs
- Autenticação obrigatória
- Criptografia de dados sensíveis

### Variáveis de Ambiente
```bash
EXPO_PUBLIC_API_URL=https://api.grifovistorias.com
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
```

## 🐛 Troubleshooting

### Problemas Comuns

#### Metro Cache Error
```bash
npx expo start --clear
```

#### Problemas de Sincronização
1. Verificar conexão de internet
2. Validar dados da vistoria
3. Checar logs da API

#### Erro de Permissão da Câmera
1. Verificar permissões no dispositivo
2. Reinstalar o app
3. Verificar configuração no app.json

### Logs Úteis
```bash
# Limpar cache
npx expo start --clear

# Debug mode
npx expo start --dev-client

# Logs detalhados
npx expo start --verbose
```

## 📞 Suporte

Para suporte técnico:
- Email: suporte@grifovistorias.com
- Documentação: [Link para docs]
- Issues: [Link para GitHub Issues]

## 📚 Documentação Adicional

- [**PROD-ATUALIZADA.md**](./PROD-ATUALIZADA.md) - Documentação detalhada sobre a configuração de produção, incluindo:
  - Configurações de ambiente para cada componente
  - Variáveis de ambiente necessárias
  - Instruções de deploy
  - Status atual do projeto
  - Próximos passos

- [**PROJETO_SEPARADO.md**](./PROJETO_SEPARADO.md) - Informações sobre a estrutura do projeto e como os componentes se relacionam

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**Desenvolvido por Nathan Silva**  
**Grifo Vistorias © 2024**