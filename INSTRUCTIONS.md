# 🚀 Gestão de Tráfego & CRM - Setup Guide

## 🛠️ Pré-requisitos

Certifique-se de ter instalado:
- **Node.js** (versão 18 ou superior)
- **npm** (geralmente vem com o Node.js)
- **Git**

## 📦 Instalação

1.  **Instale as dependências:**
    Abra o terminal na pasta do projeto e execute:
    ```bash
    npm install
    ```

2.  **Configure o Banco de Dados:**
    Certifique-se de que suas variáveis de ambiente (`.env`) estão configuradas corretamente com a URL do seu banco de dados PostgreSQL.
    
    Gere o cliente do Prisma:
    ```bash
    npx prisma generate
    ```

    Envie o schema para o banco de dados:
    ```bash
    npx prisma db push
    ```

3.  **Popular o Banco de Dados (Seed):**
    Para inserir os dados iniciais (usuários, métricas de exemplo, leads):
    ```bash
    npx ts-node scripts/seed.ts
    ```
    *Isso criará o usuário gerente `john@doe.com` com senha `johndoe123`.*

## ▶️ Rodando o Projeto

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Acesse o aplicativo em: [http://localhost:3000](http://localhost:3000)

## 🔑 Acesso Inicial

-   **Login:** `john@doe.com`
-   **Senha:** `johndoe123`
-   **Função:** Gerente (Acesso total)

## 📱 Funcionalidades Principais

-   **Dashboard:** Visão completa de métricas, gráficos de evolução, funil de conversão e comparações.
-   **CRM:** Gestão de leads com quadro Kanban/Tabela Interativa.
-   **Gestão de Usuários:** Cadastro e controle de gestores e atendentes.
-   **Meta Ads:** Integração e análise avançada de campanhas.

---
*Desenvolvido com Next.js 14, Tailwind CSS, Shadcn/UI e Prisma.*
