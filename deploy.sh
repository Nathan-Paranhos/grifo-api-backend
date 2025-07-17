#!/bin/bash

# Script de Deploy para Grifo API Backend
# Este script prepara e executa o deploy da aplicação

echo "🚀 Iniciando processo de deploy..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script no diretório raiz do projeto."
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Erro: Node.js não está instalado."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Erro: npm não está instalado."
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências."
    exit 1
fi

echo "🔨 Compilando TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro na compilação."
    exit 1
fi

echo "🧪 Verificando se a aplicação inicia corretamente..."
# Verificar se o arquivo principal existe
if [ ! -f "dist/index.js" ]; then
    echo "❌ Erro: Arquivo compilado não encontrado em dist/index.js"
    exit 1
fi

echo "✅ Build concluído com sucesso!"
echo "📁 Arquivos compilados estão em: ./dist/"
echo ""
echo "🌐 Para deploy no Render.com:"
echo "1. Faça push do código para o repositório Git"
echo "2. Configure as variáveis de ambiente no dashboard do Render"
echo "3. O deploy será automático via render.yaml"
echo ""
echo "🔧 Para executar localmente em produção:"
echo "   npm start"
echo ""
echo "📚 Documentação da API estará disponível em:"
echo "   http://localhost:3000/api-docs (local)"
echo "   https://seu-dominio.onrender.com/api-docs (produção)"
echo ""
echo "✨ Deploy preparado com sucesso!"