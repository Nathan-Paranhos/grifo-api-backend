-- Schema do banco PostgreSQL para o sistema Grifo
-- Execute este script para criar as tabelas necessárias

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    endereco JSONB,
    plano VARCHAR(50) DEFAULT 'basico',
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de propriedades/imóveis
CREATE TABLE IF NOT EXISTS propriedades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    endereco JSONB NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    proprietario JSONB,
    caracteristicas JSONB,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de vistorias/inspeções
CREATE TABLE IF NOT EXISTS vistorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    vistoriador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente',
    data_vistoria TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    fotos JSONB DEFAULT '[]',
    checklists JSONB DEFAULT '[]',
    resultado JSONB,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contestações
CREATE TABLE IF NOT EXISTS contestacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    vistoria_id UUID NOT NULL REFERENCES vistorias(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES usuarios(id),
    motivo TEXT NOT NULL,
    detalhes TEXT,
    evidencias JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'Pendente',
    resposta TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolvido_em TIMESTAMP WITH TIME ZONE
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    dados JSONB,
    lida BOOLEAN DEFAULT false,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lida_em TIMESTAMP WITH TIME ZONE
);

-- Tabela de uploads/arquivos
CREATE TABLE IF NOT EXISTS uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome_original VARCHAR(255) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    tamanho INTEGER NOT NULL,
    categoria VARCHAR(50),
    url VARCHAR(500),
    metadata JSONB,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relatórios
CREATE TABLE IF NOT EXISTS relatorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    parametros JSONB,
    status VARCHAR(50) DEFAULT 'Processando',
    url_download VARCHAR(500),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    concluido_em TIMESTAMP WITH TIME ZONE
);

-- Tabela de sincronização
CREATE TABLE IF NOT EXISTS sincronizacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    dados JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'Pendente',
    tentativas INTEGER DEFAULT 0,
    erro TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processado_em TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_firebase_uid ON usuarios(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_propriedades_empresa_id ON propriedades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_empresa_id ON vistorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_propriedade_id ON vistorias(propriedade_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_vistoriador_id ON vistorias(vistoriador_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_status ON vistorias(status);
CREATE INDEX IF NOT EXISTS idx_vistorias_data ON vistorias(data_vistoria);
CREATE INDEX IF NOT EXISTS idx_contestacoes_empresa_id ON contestacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contestacoes_vistoria_id ON contestacoes(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_empresa_id ON notificacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_uploads_empresa_id ON uploads(empresa_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_empresa_id ON relatorios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sincronizacao_empresa_id ON sincronizacao(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sincronizacao_status ON sincronizacao(status);

-- Triggers para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_propriedades_updated_at BEFORE UPDATE ON propriedades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vistorias_updated_at BEFORE UPDATE ON vistorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para busca de texto completo
CREATE OR REPLACE FUNCTION buscar_propriedades(empresa_uuid UUID, termo TEXT)
RETURNS TABLE(
    id UUID,
    endereco JSONB,
    tipo VARCHAR(50),
    proprietario JSONB,
    relevancia REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.endereco,
        p.tipo,
        p.proprietario,
        similarity(p.endereco::text || ' ' || p.tipo, termo) as relevancia
    FROM propriedades p
    WHERE p.empresa_id = empresa_uuid
    AND p.ativo = true
    AND (p.endereco::text || ' ' || p.tipo) % termo
    ORDER BY relevancia DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Função para estatísticas do dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats(empresa_uuid UUID, vistoriador_uuid UUID DEFAULT NULL)
RETURNS TABLE(
    total_vistorias BIGINT,
    pendentes BIGINT,
    concluidas BIGINT,
    em_andamento BIGINT,
    canceladas BIGINT,
    media_tempo_conclusao INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_vistorias,
        COUNT(CASE WHEN status = 'Pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'Concluída' THEN 1 END) as concluidas,
        COUNT(CASE WHEN status = 'Em Andamento' THEN 1 END) as em_andamento,
        COUNT(CASE WHEN status = 'Cancelada' THEN 1 END) as canceladas,
        AVG(CASE WHEN status = 'Concluída' AND data_vistoria IS NOT NULL 
            THEN data_vistoria - criado_em END) as media_tempo_conclusao
    FROM vistorias
    WHERE empresa_id = empresa_uuid
    AND (vistoriador_uuid IS NULL OR vistoriador_id = vistoriador_uuid)
    AND criado_em >= NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schema pronto para produção

-- Comentários sobre o schema
COMMENT ON TABLE empresas IS 'Tabela principal de empresas/clientes do sistema';
COMMENT ON TABLE usuarios IS 'Usuários do sistema vinculados às empresas';
COMMENT ON TABLE propriedades IS 'Imóveis/propriedades a serem vistoriados';
COMMENT ON TABLE vistorias IS 'Vistorias/inspeções realizadas';
COMMENT ON TABLE contestacoes IS 'Contestações de vistorias pelos clientes';
COMMENT ON TABLE notificacoes IS 'Sistema de notificações do aplicativo';
COMMENT ON TABLE uploads IS 'Arquivos enviados (fotos, documentos)';
COMMENT ON TABLE relatorios IS 'Relatórios gerados pelo sistema';
COMMENT ON TABLE sincronizacao IS 'Controle de sincronização offline/online';

-- Versão do schema
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO schema_version (version) VALUES ('1.0.0') ON CONFLICT DO NOTHING;