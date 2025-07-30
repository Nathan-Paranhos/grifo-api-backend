# 📋 Parâmetros Completos da API Grifo

## 🔍 Resumo Executivo

Este documento detalha **TODOS** os parâmetros necessários para cada endpoint da API Grifo, incluindo:
- Parâmetros de consulta (query)
- Parâmetros de corpo (body)
- Parâmetros de rota (path)
- Configurações necessárias no banco de dados

---

## 📊 Endpoints com Parâmetros

### 🔐 1. AUTENTICAÇÃO

#### Headers Obrigatórios (Todos os endpoints protegidos)
```
Authorization: Bearer <firebase_token>
Content-Type: application/json
```

---

### 👥 2. USUÁRIOS

#### POST `/api/users` - Criar Usuário
**Body (JSON):**
```json
{
  "nome": "string" (obrigatório, min 1 char),
  "email": "string" (obrigatório, formato email),
  "role": "admin|gerente|vistoriador" (obrigatório),
  "telefone": "string" (opcional),
  "ativo": boolean (opcional, default: true)
}
```

#### PUT `/api/users/:id` - Atualizar Usuário
**Path:**
- `id`: string (obrigatório) - ID do usuário

**Body (JSON):**
```json
{
  "nome": "string" (opcional, min 1 char),
  "email": "string" (opcional, formato email),
  "role": "admin|gerente|vistoriador" (opcional),
  "telefone": "string" (opcional),
  "ativo": boolean (opcional)
}
```

#### GET `/api/users` - Listar Usuários
**Query Parameters:**
```
empresaId: string (obrigatório)
vistoriadorId: string (opcional)
limit: number (opcional, default: 10)
page: number (opcional, default: 1)
role: string (opcional)
ativo: boolean (opcional)
```

---

### 🏢 3. PROPRIEDADES/IMÓVEIS

#### POST `/api/properties` - Criar Propriedade
**Body (JSON):**
```json
{
  "endereco": "string" (obrigatório, min 1 char),
  "bairro": "string" (obrigatório, min 1 char),
  "cidade": "string" (obrigatório, min 1 char),
  "estado": "string" (obrigatório, min 1 char),
  "cep": "string" (obrigatório, min 8 chars),
  "tipo": "string" (obrigatório, min 1 char),
  "areaTotal": number (opcional, positivo),
  "areaConstruida": number (opcional, positivo),
  "descricao": "string" (opcional),
  "enderecoCompleto": "string" (opcional),
  "proprietario": {
    "nome": "string" (obrigatório se objeto presente),
    "telefone": "string" (opcional),
    "email": "string" (opcional, formato email),
    "cpf": "string" (opcional),
    "rg": "string" (opcional)
  },
  "inquilino": {
    "nome": "string" (opcional),
    "telefone": "string" (opcional),
    "email": "string" (opcional, formato email),
    "cpf": "string" (opcional),
    "rg": "string" (opcional)
  },
  "valorAluguel": number (opcional, positivo),
  "valorIptu": number (opcional, positivo),
  "observacoes": "string" (opcional),
  "ativo": boolean (opcional, default: true)
}
```

#### GET `/api/properties` - Listar Propriedades
**Query Parameters:**
```
empresaId: string (obrigatório)
limit: number (opcional, default: 10)
offset: number (opcional, default: 0)
tipo: string (opcional)
status: string (opcional)
```

---

### 🔍 4. INSPEÇÕES/VISTORIAS

#### POST `/api/inspections` - Criar Inspeção
**Body (JSON):**
```json
{
  "empresaId": "string" (obrigatório, min 1 char),
  "vistoriadorId": "string" (obrigatório, min 1 char),
  "imovelId": "string" (obrigatório, min 1 char),
  "tipo": "string" (obrigatório, min 1 char),
  "status": "string" (opcional),
  "dataVistoria": "string" (opcional, ISO date),
  "observacoes": "string" (opcional),
  "fotos": [
    {
      "url": "string" (obrigatório),
      "descricao": "string" (opcional),
      "categoria": "string" (opcional)
    }
  ],
  "checklists": [
    {
      "categoria": "string" (obrigatório),
      "itens": [
        {
          "item": "string" (obrigatório),
          "status": "string" (obrigatório),
          "observacao": "string" (opcional)
        }
      ]
    }
  ],
  "imovel": {
    "endereco": "string" (obrigatório),
    "bairro": "string" (obrigatório),
    "cidade": "string" (obrigatório),
    "estado": "string" (obrigatório),
    "cep": "string" (obrigatório),
    "tipo": "string" (obrigatório),
    "areaTotal": number (opcional),
    "areaConstruida": number (opcional),
    "proprietario": {
      "nome": "string" (obrigatório),
      "telefone": "string" (opcional),
      "email": "string" (opcional, formato email)
    },
    "inquilino": {
      "nome": "string" (obrigatório),
      "telefone": "string" (opcional),
      "email": "string" (opcional, formato email)
    }
  }
}
```

#### GET `/api/inspections` - Listar Inspeções
**Query Parameters:**
```
empresaId: string (obrigatório)
vistoriadorId: string (opcional)
limit: number (opcional, default: 10)
page: number (opcional, default: 1)
propertyId: string (opcional)
status: string (opcional)
```

---

### 🔄 5. SINCRONIZAÇÃO

#### POST `/api/sync/sync` - Sincronizar Dados
**Body (JSON):**
```json
{
  "pendingInspections": [
    {
      "id": "string" (obrigatório),
      "empresaId": "string" (obrigatório),
      "imovelId": "string" (obrigatório),
      "tipo": "entrada|saida|manutencao" (obrigatório),
      "fotos": ["string"] (opcional),
      "checklist": {} (opcional, objeto chave-valor),
      "observacoes": "string" (opcional),
      "createdAt": "string" (obrigatório, ISO date),
      "status": "pending|synced|error" (obrigatório)
    }
  ],
  "vistoriadorId": "string" (obrigatório, min 1 char),
  "empresaId": "string" (obrigatório, min 1 char)
}
```

#### GET `/api/sync` - Informações de Sincronização
**Query Parameters:**
```
empresaId: string (obrigatório)
vistoriadorId: string (opcional)
```

---

### ⚖️ 6. CONTESTAÇÕES

#### POST `/api/contestations` - Criar Contestação
**Body (JSON):**
```json
{
  "empresaId": "string" (obrigatório, min 1 char),
  "inspectionId": "string" (obrigatório, min 1 char),
  "motivo": "string" (obrigatório, min 1 char),
  "detalhes": "string" (opcional),
  "clienteId": "string" (opcional),
  "evidencias": [
    {
      "tipo": "foto|documento" (obrigatório),
      "url": "string" (obrigatório, formato URL)
    }
  ]
}
```

#### PUT `/api/contestations/:id/status` - Atualizar Status
**Path:**
- `id`: string (obrigatório) - ID da contestação

**Body (JSON):**
```json
{
  "status": "pendente|em_analise|aprovada|rejeitada" (obrigatório),
  "resposta": "string" (opcional)
}
```

#### GET `/api/contestations` - Listar Contestações
**Query Parameters:**
```
empresaId: string (obrigatório)
inspectionId: string (opcional)
status: string (opcional)
clienteId: string (opcional)
```

---

### 🏢 7. EMPRESAS

#### GET `/api/empresas` - Listar Empresas
**Query Parameters:**
```
ativo: boolean (opcional)
limit: number (opcional)
```

#### GET `/api/empresas/:id` - Buscar Empresa
**Path:**
- `id`: string (obrigatório) - ID da empresa

---

### 📊 8. DASHBOARD

#### GET `/api/dashboard` - Estatísticas Gerais
**Query Parameters:**
```
empresaId: string (obrigatório)
vistoriadorId: string (opcional)
limit: number (opcional, default: 10)
page: number (opcional, default: 1)
```

---

## 🗄️ Configurações do Banco de Dados

### 📋 Coleções Necessárias no Firestore

#### 1. **users** (Usuários)
```json
{
  "id": "string",
  "nome": "string",
  "email": "string",
  "role": "admin|gerente|vistoriador",
  "empresaId": "string",
  "telefone": "string",
  "ativo": boolean,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### 2. **companies** (Empresas)
```json
{
  "id": "string",
  "nome": "string",
  "cnpj": "string",
  "email": "string",
  "telefone": "string",
  "endereco": {
    "rua": "string",
    "numero": "string",
    "cidade": "string",
    "estado": "string",
    "cep": "string"
  },
  "ativo": boolean,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### 3. **properties** (Propriedades)
```json
{
  "id": "string",
  "endereco": "string",
  "bairro": "string",
  "cidade": "string",
  "estado": "string",
  "cep": "string",
  "tipo": "string",
  "empresaId": "string",
  "proprietario": {
    "nome": "string",
    "telefone": "string",
    "email": "string",
    "cpf": "string",
    "rg": "string"
  },
  "inquilino": {
    "nome": "string",
    "telefone": "string",
    "email": "string",
    "cpf": "string",
    "rg": "string"
  },
  "valorAluguel": number,
  "valorIptu": number,
  "ativo": boolean,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### 4. **vistorias** (Inspeções)
```json
{
  "id": "string",
  "empresaId": "string",
  "vistoriadorId": "string",
  "imovelId": "string",
  "tipo": "entrada|saida|manutencao",
  "status": "pendente|em_andamento|concluida|cancelada",
  "dataVistoria": "timestamp",
  "observacoes": "string",
  "fotos": [
    {
      "url": "string",
      "descricao": "string",
      "categoria": "string"
    }
  ],
  "checklists": [
    {
      "categoria": "string",
      "itens": [
        {
          "item": "string",
          "status": "string",
          "observacao": "string"
        }
      ]
    }
  ],
  "hasContestation": boolean,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### 5. **contestations** (Contestações)
```json
{
  "id": "string",
  "inspectionId": "string",
  "empresaId": "string",
  "clienteId": "string",
  "motivo": "string",
  "detalhes": "string",
  "status": "pendente|em_analise|aprovada|rejeitada",
  "evidencias": [
    {
      "tipo": "foto|documento",
      "url": "string"
    }
  ],
  "resposta": "string",
  "dataContestacao": "timestamp",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 🔧 Índices Recomendados no Firestore

### Para Performance Otimizada:

```javascript
// Coleção: users
// Índices compostos:
- empresaId + role
- empresaId + ativo
- empresaId + createdAt

// Coleção: properties
// Índices compostos:
- empresaId + tipo
- empresaId + ativo
- empresaId + createdAt

// Coleção: vistorias
// Índices compostos:
- empresaId + status
- empresaId + vistoriadorId
- empresaId + tipo
- empresaId + createdAt
- vistoriadorId + status
- imovelId + status

// Coleção: contestations
// Índices compostos:
- empresaId + status
- empresaId + createdAt
- inspectionId + status
- clienteId + status
```

---

## ⚠️ Validações Importantes

### 1. **Autenticação Firebase**
- Todos os endpoints (exceto `/health`) requerem token Firebase válido
- Token deve ser enviado no header: `Authorization: Bearer <token>`

### 2. **Validação de Empresa**
- Usuários só podem acessar dados da própria empresa
- Admins têm acesso a todas as empresas

### 3. **Validação de Roles**
- `admin`: Acesso total
- `gerente`: Acesso à empresa e usuários subordinados
- `vistoriador`: Acesso limitado às próprias vistorias

### 4. **Formatos de Data**
- Todas as datas devem estar no formato ISO 8601
- Exemplo: `2024-01-15T10:30:00.000Z`

### 5. **Limites de Requisição**
- Rate limit: 100 requisições por minuto por IP
- Tamanho máximo do body: 10MB
- Timeout: 30 segundos

---

## 🚀 Exemplos de Uso

### Criar uma Nova Vistoria
```bash
curl -X POST https://grifo-api.onrender.com/api/inspections \
  -H "Authorization: Bearer <firebase_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "empresaId": "emp_123",
    "vistoriadorId": "vist_456",
    "imovelId": "prop_789",
    "tipo": "entrada",
    "status": "pendente",
    "observacoes": "Vistoria de entrada do inquilino"
  }'
```

### Sincronizar Dados
```bash
curl -X POST https://grifo-api.onrender.com/api/sync/sync \
  -H "Authorization: Bearer <firebase_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pendingInspections": [
      {
        "id": "local_123",
        "empresaId": "emp_123",
        "imovelId": "prop_789",
        "tipo": "entrada",
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "vistoriadorId": "vist_456",
    "empresaId": "emp_123"
  }'
```

---

## 📞 Suporte

Para dúvidas sobre implementação ou configuração:
- Consulte a documentação completa em `/api-docs`
- Verifique os logs da aplicação
- Teste endpoints com `/health` para verificar status

---

*Documentação gerada automaticamente - Última atualização: Janeiro 2024*