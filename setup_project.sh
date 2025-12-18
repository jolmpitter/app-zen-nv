#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Iniciando Configuração e Build do Projeto Next.js ===${NC}"

# 1. Verificação de Ambiente
echo "--> Verificando ambiente..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Erro: Node.js não encontrado!${NC}"
    echo "Por favor instale o Node.js v18 ou superior."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "Node version: $NODE_VERSION"

# 2. Gerenciador de Pacotes
if [ -f "yarn.lock" ]; then
    MANAGER="yarn"
    INSTALL_CMD="yarn install"
    BUILD_CMD="yarn build"
elif [ -f "pnpm-lock.yaml" ]; then
    MANAGER="pnpm"
    INSTALL_CMD="pnpm install"
    BUILD_CMD="pnpm build"
else
    MANAGER="npm"
    INSTALL_CMD="npm install --legacy-peer-deps" # Evita conflitos estritos
    BUILD_CMD="npm run build"
fi

echo -e "${GREEN}Detectado gerenciador de pacotes: $MANAGER${NC}"

# 3. Instalação
echo "--> Instalando dependências..."
$INSTALL_CMD
if [ $? -ne 0 ]; then
    echo -e "${RED}Falha na instalação das dependências.${NC}"
    exit 1
fi

# 4. Banco de Dados e Build
echo "--> Configurando banco de dados local e executando build..."
# Gera o cliente Prisma e cria o banco dev.db (SQLite)
npx prisma generate
npx prisma db push --accept-data-loss # Sincroniza o schema com o banco local

$BUILD_CMD
if [ $? -ne 0 ]; then
    echo -e "${RED}Falha no build! Verifique os logs acima.${NC}"
    exit 1
else
    echo -e "${GREEN}Build concluído com sucesso!${NC}"
fi
