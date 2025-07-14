# Serviços da Aplicação

## Visão Geral

Esta pasta contém os serviços principais da aplicação Grifo Vistorias:

- **apiService.ts**: Responsável por fazer requisições à API backend
- **storageService.ts**: Gerencia o armazenamento local usando AsyncStorage
- **syncService.ts**: Gerencia a sincronização de dados offline
- **uploadService.ts**: Gerencia o upload de fotos para o Firebase Storage
- **pdfService.ts**: Gera relatórios em PDF das vistorias
- **zipService.ts**: Compacta fotos de vistorias em arquivos ZIP
- **exportService.ts**: Exporta e importa dados de vistorias em formato JSON

## ApiService

O `ApiService` é responsável por todas as comunicações com o backend da aplicação. Ele encapsula a lógica de requisições HTTP, autenticação e tratamento de erros.

### Principais Funcionalidades

- **makeRequest**: Método base para todas as requisições HTTP, com suporte a autenticação via Firebase
- **getInspections**: Busca vistorias com filtros por empresa, vistoriador e status
- **createInspection**: Cria uma nova vistoria no backend
- **getDashboardStats**: Obtém estatísticas para o dashboard
- **syncPendingInspections**: Sincroniza vistorias pendentes com o servidor
- **uploadPhotos**: Faz upload de fotos para o Firebase Storage
- **healthCheck**: Verifica a disponibilidade da API

### Interfaces Principais

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface InspectionData {
  id: string;
  empresaId: string;
  vistoriadorId: string;
  imovelId: string;
  tipo: 'entrada' | 'saida' | 'manutencao';
  fotos: string[];
  checklist: Record<string, string>;
  observacoes: string;
  createdAt: string;
  status: 'pending' | 'synced' | 'error';
}
```

### Exemplo de Uso

```typescript
// Buscar vistorias de uma empresa
const response = await ApiService.getInspections({
  empresaId: '123456',
  status: 'pending',
  limit: 10
});

if (response.success && response.data) {
  // Processar os dados
  const inspections = response.data;
} else {
  // Tratar erro
  console.error(response.error);
}
```

## StorageService

O `StorageService` gerencia o armazenamento local de dados usando AsyncStorage, permitindo que a aplicação funcione offline.

### Principais Funcionalidades

- **savePendingInspection**: Salva uma vistoria pendente no armazenamento local
- **getPendingInspections**: Recupera todas as vistorias pendentes
- **removePendingInspection**: Remove uma vistoria pendente específica
- **updatePendingInspectionStatus**: Atualiza o status de uma vistoria pendente
- **clearPendingInspections**: Limpa todas as vistorias pendentes
- **saveOfflineData**: Salva dados genéricos para uso offline
- **getOfflineData**: Recupera dados offline
- **clearOfflineData**: Remove dados offline específicos

### Exemplo de Uso

```typescript
// Salvar uma vistoria pendente
const newInspection = {
  id: 'local-123',
  empresaId: '456',
  imovelId: '789',
  tipo: 'entrada',
  fotos: ['data:image/jpeg;base64,...'],
  checklist: { item1: 'ok', item2: 'damaged' },
  observacoes: 'Observações da vistoria',
  createdAt: new Date().toISOString(),
  status: 'pending'
};

await StorageService.savePendingInspection(newInspection);

// Recuperar vistorias pendentes
const pendingInspections = await StorageService.getPendingInspections();
```
## SyncService

O `SyncService` gerencia a sincronização de dados entre o armazenamento local e o servidor, lidando com conectividade intermitente.

### Principais Funcionalidades

- **isOnline**: Verifica se o dispositivo está conectado à internet
- **syncPendingInspections**: Sincroniza todas as vistorias pendentes com o servidor
- **autoSync**: Realiza sincronização automática quando o dispositivo fica online
- **getSyncStatus**: Obtém o status atual da sincronização
- **retryFailedInspections**: Tenta sincronizar novamente as vistorias que falharam
```

## UploadService

O `UploadService` é responsável pelo gerenciamento de uploads de fotos e arquivos para o Firebase Storage, garantindo que as imagens das vistorias sejam armazenadas corretamente na nuvem.

### Principais Funcionalidades

- **uploadPhoto**: Faz upload de uma única foto para o Firebase Storage
- **uploadMultiplePhotos**: Faz upload de múltiplas fotos em lote
- **getUploadProgress**: Obtém o progresso atual de uploads em andamento
- **cancelUpload**: Cancela um upload em andamento
- **getDownloadURL**: Obtém a URL de download de uma foto já enviada
- **deletePhoto**: Remove uma foto do Firebase Storage

### Exemplo de Uso

```typescript
// Upload de uma única foto
const uploadResult = await UploadService.uploadPhoto({
  inspectionId: 'insp-123',
  photoUri: 'file:///data/user/0/com.grifovistorias/cache/photo-123.jpg',
  fileName: 'sala-principal.jpg',
  metadata: {
    roomType: 'sala',
    damageType: 'none'
  }
});

if (uploadResult.success) {
  console.log('Foto enviada com sucesso:', uploadResult.downloadUrl);
} else {
  console.error('Falha no upload:', uploadResult.error);
}

// Upload de múltiplas fotos
const batchUploadResult = await UploadService.uploadMultiplePhotos({
  inspectionId: 'insp-123',
  photos: [
    { uri: 'file:///path/to/photo1.jpg', fileName: 'cozinha.jpg' },
    { uri: 'file:///path/to/photo2.jpg', fileName: 'banheiro.jpg' }
  ],
  onProgress: (progress) => {
    console.log(`Progresso: ${progress.percentage}%`);
  }
});
```

```typescript
// Sincronizar vistorias pendentes
const result = await SyncService.syncPendingInspections(
  'vistoriador-123',
  'empresa-456'
);

if (result.success) {
  console.log(`Sincronizadas ${result.synced} vistorias`);
} else {
  console.error('Falha na sincronização:', result.errors);
}

// Verificar status da sincronização
const status = await SyncService.getSyncStatus();
console.log(`Pendentes: ${status.pendingCount}, Última sincronização: ${status.lastSyncAt}`);
```

## Configuração de Variáveis de Ambiente

Os serviços utilizam variáveis de ambiente definidas nos arquivos `.env.development`, `.env.staging` e `.env.production`. Estas variáveis são acessadas através do `Constants.expoConfig.extra` do Expo.

### Como as variáveis de ambiente são carregadas:

1. As variáveis são definidas nos arquivos `.env.*`
2. O arquivo `app.config.js` carrega essas variáveis e as disponibiliza no objeto `extra`
3. Os serviços acessam as variáveis através de `Constants.expoConfig.extra.NOME_DA_VARIAVEL`

### Exemplo de uso:

```typescript
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || '';
```

## PDFService

O `PDFService` é responsável por gerar relatórios em PDF das vistorias realizadas, utilizando a biblioteca `react-native-pdf-lib`.

### Principais Funcionalidades

- **ensurePDFDirectoryExists**: Garante que o diretório para armazenar PDFs exista
- **generatePDF**: Gera um PDF com os dados da vistoria (título, data, ID, checklist e observações)
- **addImagesToPDF**: Adiciona imagens a um PDF existente
- **sharePDF**: Compartilha o PDF gerado
- **deletePDF**: Remove um PDF específico
- **clearAllPDFs**: Limpa o diretório temporário de PDFs

### Exemplo de Uso

```typescript
// Gerar e compartilhar um PDF
const pdfResult = await PDFService.generatePDF(inspection);

if (pdfResult.success && pdfResult.filePath) {
  // Adicionar imagens ao PDF
  if (inspection.fotos && inspection.fotos.length > 0) {
    await PDFService.addImagesToPDF(pdfResult.filePath, inspection.fotos);
  }
  
  // Compartilhar o PDF
  await PDFService.sharePDF(pdfResult.filePath);
}
```

## ZipService

O `ZipService` é responsável por compactar fotos de vistorias em arquivos ZIP para facilitar o compartilhamento, utilizando a biblioteca `jszip`.

### Principais Funcionalidades

- **ensureZipDirectoryExists**: Garante que o diretório para armazenar ZIPs exista
- **compressPhotos**: Cria um arquivo ZIP a partir das fotos de uma vistoria
- **shareZip**: Compartilha o arquivo ZIP gerado
- **deleteZip**: Remove um arquivo ZIP específico
- **clearAllZips**: Limpa o diretório temporário de ZIPs

### Exemplo de Uso

```typescript
// Compactar e compartilhar fotos
const zipResult = await ZipService.compressPhotos(inspection.id, inspection.fotos);

if (zipResult.success && zipResult.filePath) {
  // Compartilhar o ZIP
  await ZipService.shareZip(zipResult.filePath);
}
```

## ExportService

O `ExportService` é responsável por exportar e importar dados de vistorias em formato JSON para backup ou transferência.

### Principais Funcionalidades

- **ensureExportDirectoryExists**: Garante que o diretório para armazenar arquivos de exportação exista
- **exportAllInspections**: Exporta todas as vistorias pendentes em um único arquivo JSON
- **exportInspection**: Exporta uma vistoria específica em um arquivo JSON
- **shareExportFile**: Compartilha o arquivo de exportação
- **importInspections**: Importa vistorias de um arquivo JSON
- **clearAllExports**: Limpa o diretório de exportação

### Exemplo de Uso

```typescript
// Exportar todas as vistorias
const exportResult = await ExportService.exportAllInspections();

if (exportResult.success && exportResult.filePath) {
  // Compartilhar o arquivo de exportação
  await ExportService.shareExportFile(exportResult.filePath);
}

// Importar vistorias
const importResult = await ExportService.importInspections(filePath);

if (importResult.success) {
  console.log(`Importadas ${importResult.count} vistorias`);
}
```

## Troubleshooting

Se você estiver enfrentando problemas com as variáveis de ambiente:

1. Verifique se os arquivos `.env.*` existem e contêm as variáveis necessárias
2. Verifique se o `app.config.js` está carregando corretamente as variáveis
3. Reinicie o servidor de desenvolvimento com `npm run dev:clear`
4. Se estiver construindo para produção, verifique se as variáveis estão sendo passadas corretamente para o EAS Build

### Problemas Comuns de Sincronização

Se estiver enfrentando problemas com a sincronização de dados:

1. Verifique a conectividade do dispositivo usando `NetInfo.fetch()`
2. Verifique se há vistorias com status de erro usando `SyncService.getSyncStatus()`
3. Tente forçar uma nova sincronização com `SyncService.retryFailedInspections()`
4. Verifique os logs de erro no console para identificar problemas específicos

### Problemas com Geração de PDFs e ZIPs

Se estiver enfrentando problemas com a geração de PDFs ou ZIPs:

1. Verifique se as bibliotecas necessárias estão instaladas (`react-native-pdf-lib`, `jszip`)
2. Verifique se o dispositivo tem espaço de armazenamento suficiente
3. Verifique se as permissões de armazenamento estão concedidas
4. Para problemas com imagens, verifique se os caminhos das fotos estão corretos e acessíveis