companies/
├─ 📄 LCpGcbSKgKy4I0uLkAI3
│   └─ name: string
│   └─ cnpj: string
│   └─ address: object
│   └─ contact: object
│   └─ settings: object
│   └─ subscription: object
│   └─ createdAt: object
│   └─ updatedAt: object
├─ 📄 p7s2zgw9vjTjorDJRDte
│   └─ name: string
│   └─ cnpj: string
│   └─ address: object
│   └─ contact: object
│   └─ settings: object
│   └─ subscription: object
│   └─ createdAt: object
│   └─ updatedAt: object
📁 contestations/
├─ 📄 VtRpUPTWFrihIn1zU6Ls
│   └─ inspectionId: string
│   └─ propertyId: string
│   └─ reason: string
│   └─ description: string
│   └─ status: string
│   └─ documents: object
│   └─ evidence: object
│   └─ response: object
│   └─ respondedAt: object
│   └─ respondedBy: object
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
├─ 📄 aJOJO8khewZTneIzxtkJ
│   └─ inspectionId: string
│   └─ propertyId: string
│   └─ reason: string
│   └─ description: string
│   └─ status: string
│   └─ documents: object
│   └─ evidence: object
│   └─ response: object
│   └─ respondedAt: object
│   └─ respondedBy: object
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
📁 empresas/
├─ 📄 empresa_visionaria
│   └─ nome: string
│   └─ cnpj: string
│   └─ email: string
│   └─ telefone: string
│   └─ endereco: object
│   └─ plano: string
│   └─ ativo: boolean
│   └─ atualizado_em: object
│   └─ criado_em: object
│   └─ cores: object
│   └─ logoUrl: string
│   └─ createdAt: object
│   └─ updatedAt: object
│
│   └─ 📂 contestacoes/
│   ├─ 📄 contestacao1
│   │   └─ vistoria_id: string
│   │   └─ cliente_id: string
│   │   └─ motivo: string
│   │   └─ detalhes: string
│   │   └─ evidencias: object
│   │   └─ status: string
│   │   └─ resposta: string
│   │   └─ resolvido_em: object
│   │   └─ empresa_id: string
│   │   └─ criado_em: object
│
│   └─ 📂 imoveis/
│   ├─ 📄 imovel1
│   │   └─ tipo: string
│   │   └─ endereco: object
│   │   └─ proprietario: object
│   │   └─ caracteristicas: object
│   │   └─ ativo: boolean
│   │   └─ empresa_id: string
│   │   └─ atualizado_em: object
│   │   └─ criado_em: object
│
│   └─ 📂 notificacoes/
│   ├─ 📄 notificacao1
│   │   └─ usuario_id: string
│   │   └─ tipo: string
│   │   └─ titulo: string
│   │   └─ mensagem: string
│   │   └─ dados: object
│   │   └─ lida: boolean
│   │   └─ lida_em: object
│   │   └─ empresa_id: string
│   │   └─ criado_em: object
│
│   └─ 📂 relatorios/
│   ├─ 📄 relatorio1
│   │   └─ usuario_id: string
│   │   └─ tipo: string
│   │   └─ titulo: string
│   │   └─ parametros: object
│   │   └─ status: string
│   │   └─ url_download: string
│   │   └─ concluido_em: object
│   │   └─ empresa_id: string
│   │   └─ criado_em: object
│
│   └─ 📂 sincronizacoes/
│   ├─ 📄 sync1
│   │   └─ usuario_id: string
│   │   └─ tipo: string
│   │   └─ dados: object
│   │   └─ status: string
│   │   └─ tentativas: number
│   │   └─ erro: string
│   │   └─ processado_em: object
│   │   └─ empresa_id: string
│   │   └─ criado_em: object
│
│   └─ 📂 uploads/
│   ├─ 📄 upload1
│   │   └─ usuario_id: string
│   │   └─ nome_original: string
│   │   └─ nome_arquivo: string
│   │   └─ tipo_mime: string
│   │   └─ tamanho: number
│   │   └─ categoria: string
│   │   └─ url: string
│   │   └─ metadata: object
│   │   └─ empresa_id: string
│   │   └─ criado_em: object
│
│   └─ 📂 usuarios/
│   ├─ 📄 4YDC4naAFnWItuMELMef0SdHEYq2
│   │   └─ uid: string
│   │   └─ email: string
│   │   └─ nome: string
│   │   └─ papel: string
│   │   └─ telefone: string
│   │   └─ ativo: boolean
│   │   └─ empresaId: string
│   │   └─ lastLogin: object
│   │   └─ updatedAt: object
│   │   └─ createdAt: object
│
│   └─ 📂 vistorias/
│   ├─ 📄 vistoria1
│   │   └─ propriedade_id: string
│   │   └─ vistoriador_id: string
│   │   └─ tipo: string
│   │   └─ status: string
│   │   └─ data_vistoria: object
│   │   └─ observacoes: string
│   │   └─ fotos: object
│   │   └─ checklists: object
│   │   └─ resultado: object
│   │   └─ empresa_id: string
│   │   └─ atualizado_em: object
│   │   └─ criado_em: object
📁 inspections/
├─ 📄 83Gzb6HdZYN1FIqupUWm
│   └─ propertyId: string
│   └─ inspectorId: string
│   └─ type: string
│   └─ status: string
│   └─ scheduledDate: object
│   └─ completedDate: object
│   └─ report: object
│   └─ photos: object
│   └─ observations: string
│   └─ priority: string
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
├─ 📄 QFwLitQvt4wpPn2IAFBU
│   └─ propertyId: string
│   └─ inspectorId: string
│   └─ type: string
│   └─ status: string
│   └─ scheduledDate: object
│   └─ report: object
│   └─ photos: object
│   └─ observations: string
│   └─ priority: string
│   └─ companyId: string
│   └─ createdAt: object
│   └─ completedDate: object
│   └─ updatedAt: object
├─ 📄 R0uMFWjxgK3HkNDi3K5b
│   └─ propertyId: string
│   └─ inspectorId: string
│   └─ type: string
│   └─ status: string
│   └─ scheduledDate: object
│   └─ completedDate: object
│   └─ report: object
│   └─ photos: object
│   └─ observations: string
│   └─ priority: string
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
├─ 📄 S8ZU9W8aoBTSpg4y2bhx
│   └─ propertyId: string
│   └─ inspectorId: string
│   └─ type: string
│   └─ status: string
│   └─ scheduledDate: object
│   └─ report: object
│   └─ photos: object
│   └─ observations: string
│   └─ priority: string
│   └─ companyId: string
│   └─ createdAt: object
│   └─ completedDate: object
│   └─ updatedAt: object
📁 properties/
├─ 📄 5EkRqKQQx4mlY4DdL4ie
│   └─ address: object
│   └─ owner: object
│   └─ type: string
│   └─ subtype: string
│   └─ area: number
│   └─ rooms: number
│   └─ bathrooms: number
│   └─ parking: number
│   └─ value: number
│   └─ status: string
│   └─ description: string
│   └─ features: object
│   └─ documents: object
│   └─ images: object
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
├─ 📄 JwVEJr98O2iqeGQt1Isy
│   └─ address: object
│   └─ owner: object
│   └─ type: string
│   └─ subtype: string
│   └─ area: number
│   └─ rooms: number
│   └─ bathrooms: number
│   └─ parking: number
│   └─ value: number
│   └─ status: string
│   └─ description: string
│   └─ features: object
│   └─ documents: object
│   └─ images: object
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
├─ 📄 MTRCQofU9T0BV7hkIL9k
│   └─ address: object
│   └─ owner: object
│   └─ type: string
│   └─ subtype: string
│   └─ area: number
│   └─ rooms: number
│   └─ bathrooms: number
│   └─ parking: number
│   └─ value: number
│   └─ status: string
│   └─ description: string
│   └─ features: object
│   └─ documents: object
│   └─ images: object
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
├─ 📄 YELZQPhorqKYxU5zI85Z
│   └─ address: object
│   └─ owner: object
│   └─ type: string
│   └─ subtype: string
│   └─ area: number
│   └─ rooms: number
│   └─ bathrooms: number
│   └─ parking: number
│   └─ value: number
│   └─ status: string
│   └─ description: string
│   └─ features: object
│   └─ documents: object
│   └─ images: object
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
├─ 📄 bVaTwX3MkB61noW8c6nj
│   └─ address: object
│   └─ owner: object
│   └─ type: string
│   └─ subtype: string
│   └─ area: number
│   └─ rooms: number
│   └─ bathrooms: number
│   └─ parking: number
│   └─ value: number
│   └─ status: string
│   └─ description: string
│   └─ features: object
│   └─ documents: object
│   └─ images: object
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
📁 settings/
├─ 📄 0CCdQERxAoYMxWo2bAmK
│   └─ key: string
│   └─ value: string
│   └─ description: string
│   └─ category: string
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
├─ 📄 2FlpkTIZdbYMBa8uCI9r
│   └─ key: string
│   └─ value: string
│   └─ description: string
│   └─ category: string
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
├─ 📄 3uBhQ48z0UCVGhaQGbdA
│   └─ key: string
│   └─ value: boolean
│   └─ description: string
│   └─ category: string
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
├─ 📄 6HWBllEWUx6OzRC1xc7s
│   └─ key: string
│   └─ value: number
│   └─ description: string
│   └─ category: string
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
├─ 📄 BNNbkqapBqIKNcVA9qXg
│   └─ key: string
│   └─ value: string
│   └─ description: string
│   └─ category: string
│   └─ companyId: string
│   └─ createdAt: object
│   └─ updatedAt: object
📁 uploads/
├─ 📄 f5e1981e-a631-40a3-a817-26b2e11ab73a
│   └─ id: string
│   └─ originalName: string
│   └─ filename: string
│   └─ mimetype: string
│   └─ size: number
│   └─ url: string
│   └─ uploadedBy: string
│   └─ empresaId: string
│   └─ category: string
│   └─ createdAt: string
📁 users/
├─ 📄 JFeUvxvUTRSlBj6w7RhKyBBOEmf2
│   └─ email: string
│   └─ name: string
│   └─ role: string
│   └─ company: string
│   └─ permissions: object
│   └─ profile: object
│   └─ preferences: object
│   └─ isActive: boolean
│   └─ lastLogin: object
│   └─ createdAt: object
│   └─ lastLoginAt: object
│   └─ updatedAt: object
📁 usuarios/
├─ 📄 ZB3AruewFuUpm6clAOSDn35YvkD2
│   └─ uid: string
│   └─ empresaId: string
│   └─ papel: string
│   └─ nome: string
│   └─ telefone: string
│   └─ ativo: boolean
│   └─ email: string
│   └─ lastLogin: object
│   └─ createdAt: object
│   └─ updatedAt: object

✅ Estrutura do Firestore listada com sucesso.

🖼️ Listando arquivos do Firebase Storage...
1. banco-visionaria.firebasestorage.app/favicon.icon.jpeg
2. favicon.icon.jpeg

✅ 2 arquivos encontrados no Storage.
PS C:\Users\paran\OneDrive\Área de Trabalho\banco>