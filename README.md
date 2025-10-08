# Fono API

API RESTful construída com Fastify, TypeScript, Prisma e PostgreSQL, oferecendo uma arquitetura moderna e type-safe para desenvolvimento backend.

## 🚀 Tecnologias

- **[Fastify](https://fastify.dev/)** - Framework web de alto desempenho
- **[TypeScript](https://www.typescriptlang.org/)** - Superset tipado do JavaScript
- **[Prisma](https://www.prisma.io/)** - ORM moderno para Node.js
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional
- **[Zod](https://zod.dev/)** - Validação de schemas TypeScript-first
- **[Docker](https://www.docker.com/)** - Containerização e orquestração
- **[Biome](https://biomejs.dev/)** - Linter e formatter ultra-rápido

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [pnpm](https://pnpm.io/) (versão 10.17.0 ou superior)
- [Docker](https://www.docker.com/) e Docker Compose

## 🛠️ Instalando Ferramentas Necessárias

### Instalando o pnpm

O pnpm é um gerenciador de pacotes rápido e eficiente. Escolha o método de instalação de acordo com seu sistema operacional:

#### macOS / Linux

```bash
# Usando npm (se já tiver Node.js instalado)
npm install -g pnpm

# Ou usando curl
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Ou usando Homebrew (macOS)
brew install pnpm
```

#### Windows

```powershell
# Usando npm
npm install -g pnpm

# Ou usando Scoop
scoop install nodejs-lts pnpm

# Ou usando Chocolatey
choco install pnpm
```

#### Verificar instalação

```bash
pnpm --version
# Deve retornar algo como: 10.17.0
```

### Instalando e Configurando o Biome

O Biome é usado para formatação e linting do código. Este projeto usa o Biome através do Ultracite.

#### Instalação Global (Opcional)

Embora o Biome seja instalado automaticamente como dependência do projeto, você pode instalá-lo globalmente:

```bash
pnpm add -g @biomejs/biome
```

#### Configuração no Editor

##### VS Code / Cursor

1. **Instale a extensão do Biome**:

   - Abra o VS Code/Cursor
   - Vá em Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Procure por "Biome"
   - Instale a extensão oficial: **Biome** (biomejs.biome)

2. **Configure o editor** (opcional):

   Abra as configurações (Ctrl+, / Cmd+,) e adicione ao `settings.json`:

   ```json
   {
     "[javascript]": {
       "editor.defaultFormatter": "biomejs.biome",
       "editor.formatOnSave": true,
       "editor.codeActionsOnSave": {
         "quickfix.biome": "explicit",
         "source.organizeImports.biome": "explicit"
       }
     },
     "[typescript]": {
       "editor.defaultFormatter": "biomejs.biome",
       "editor.formatOnSave": true,
       "editor.codeActionsOnSave": {
         "quickfix.biome": "explicit",
         "source.organizeImports.biome": "explicit"
       }
     },
     "[json]": {
       "editor.defaultFormatter": "biomejs.biome",
       "editor.formatOnSave": true
     },
     "[jsonc]": {
       "editor.defaultFormatter": "biomejs.biome",
       "editor.formatOnSave": true
     }
   }
   ```

3. **Verifique a configuração**:
   - O Biome deve detectar automaticamente o arquivo `biome.jsonc` na raiz do projeto
   - Abra qualquer arquivo `.ts` e salve para ver a formatação automática funcionando

##### JetBrains IDEs (WebStorm, IntelliJ IDEA)

1. Vá em **Settings/Preferences** → **Languages & Frameworks** → **JavaScript** → **Biome**
2. Marque **Enable**
3. Configure o caminho para o executável do Biome (geralmente auto-detectado)
4. Marque **Run on save** para formatação automática

##### Neovim

Adicione ao seu `init.lua` ou `init.vim`:

```lua
-- Para nvim-lspconfig
require('lspconfig').biome.setup{}

-- Para conform.nvim
require("conform").setup({
  formatters_by_ft = {
    javascript = { "biome" },
    typescript = { "biome" },
    json = { "biome" },
  },
})
```

##### Outros Editores

Para outros editores, consulte a [documentação oficial do Biome](https://biomejs.dev/guides/integrate-in-editor/).

#### Comandos Úteis do Biome/Ultracite

```bash
# Formatar e corrigir automaticamente
npx ultracite fix

# Verificar problemas sem corrigir
npx ultracite check

# Formatar apenas (sem lint)
npx biome format --write .

# Executar lint
npx biome lint .
```

## 🔧 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd fono-api
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fono?schema=public"
```

### 4. Inicie o banco de dados

Execute o Docker Compose para subir o PostgreSQL:

```bash
docker-compose up -d
```

Isso irá criar um container PostgreSQL com:

- **Usuário**: postgres
- **Senha**: postgres
- **Database**: fono
- **Porta**: 5432

### 5. Execute as migrations

Para criar as tabelas no banco de dados:

```bash
npx prisma migrate dev
```

Ou, se preferir aplicar migrations existentes:

```bash
npx prisma migrate deploy
```

### 6. Inicie o servidor

```bash
pnpm dev
```

O servidor estará rodando em `http://localhost:3000`

## 📚 Documentação da API

A API conta com documentação interativa gerada automaticamente. Após iniciar o servidor, acesse:

- **Swagger UI**: [http://localhost:3000/reference](http://localhost:3000/reference)

## 🛣️ Como Criar uma Nova Rota

### Estrutura Básica

As rotas são organizadas como plugins do Fastify no diretório `src/routes/`. Cada rota é um arquivo TypeScript que exporta um plugin assíncrono tipado com Zod.

### Passo a Passo (Exemplo Didático)

> **📚 IMPORTANTE**: Os exemplos abaixo usam uma rota fictícia de "produtos" para fins educacionais. Esta rota **NÃO existe** no projeto. Use-a como modelo para criar suas próprias rotas reais.

#### 1. Crie um novo arquivo de rota

Crie um arquivo em `src/routes/`, por exemplo `get-products.ts`:

```typescript
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { STATUS_CODE } from "@/constants/status-code";
import { prisma } from "@/lib/prisma";

export const getProductsRoute: FastifyPluginAsyncZod = async (server) => {
  await server.get(
    "/products",
    {
      schema: {
        tags: ["products"],
        summary: "Lista todos os produtos",
        description:
          "Retorna uma lista de todos os produtos cadastrados no sistema",
        querystring: z.object({
          page: z.coerce
            .number()
            .min(1)
            .default(1)
            .describe("Número da página"),
          limit: z.coerce
            .number()
            .min(1)
            .max(100)
            .default(10)
            .describe("Itens por página"),
        }),
        response: {
          200: z
            .object({
              products: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  price: z.number(),
                  createdAt: z.date(),
                })
              ),
              total: z.number(),
              page: z.number(),
            })
            .describe("Lista de produtos retornada com sucesso"),
          400: z
            .object({
              error: z.string(),
            })
            .describe("Requisição inválida"),
        },
      },
    },
    async (request, reply) => {
      const { page, limit } = request.query;
      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.product.count(),
      ]);

      return {
        products,
        total,
        page,
      };
    }
  );
};
```

#### 2. Registre a rota no app

Abra `src/app.ts` e registre a nova rota:

```typescript
import { getProductsRoute } from "./routes/get-products";

// ... outras importações e configurações

// Registre a rota com o prefixo da API
app.register(getProductsRoute, {
  prefix: API_PREFIX, // geralmente '/api'
});
```

### Tipos de Rotas Suportadas

> **💡 Os exemplos abaixo são ilustrativos** e mostram a sintaxe básica para cada tipo de rota HTTP.

#### GET - Buscar dados

```typescript
server.get("/resource/:id", { schema: {...} }, async (request, reply) => {
  const { id } = request.params
  // lógica aqui
})
```

#### POST - Criar recurso

```typescript
server.post("/resource", { schema: {...} }, async (request, reply) => {
  const data = request.body
  // lógica de criação
  return reply.status(201).send(result)
})
```

#### PUT - Atualizar recurso

```typescript
server.put("/resource/:id", { schema: {...} }, async (request, reply) => {
  const { id } = request.params
  const data = request.body
  // lógica de atualização
})
```

#### DELETE - Remover recurso

```typescript
server.delete("/resource/:id", { schema: {...} }, async (request, reply) => {
  const { id } = request.params
  // lógica de remoção
  return reply.status(204).send()
})
```

### Validação com Zod

O projeto usa Zod para validação de schemas. Você pode validar:

- **Body**: `body: z.object({...})`
- **Query params**: `querystring: z.object({...})`
- **Route params**: `params: z.object({...})`
- **Headers**: `headers: z.object({...})`
- **Response**: `response: { statusCode: z.object({...}) }`

### Boas Práticas

1. **Sempre defina o schema completo** com tags, summary, description e response
2. **Use constantes** para status codes (`STATUS_CODE.OK`, `STATUS_CODE.CREATED`, etc.)
3. **Trate erros adequadamente** com try-catch quando necessário
4. **Valide entrada e saída** usando schemas Zod
5. **Documente responses** para todos os status codes possíveis
6. **Use mensagens descritivas** em português para erros de validação
7. **Agrupe rotas relacionadas** usando tags no schema

## 📁 Estrutura do Projeto

```
fono-api/
├── src/
│   ├── routes/           # Definição de rotas da API
│   │   ├── health.ts     # Rota de health check
│   │   └── create-user.ts # Rota de criação de usuários
│   ├── constants/        # Constantes da aplicação
│   │   ├── common.ts     # Constantes gerais
│   │   ├── status-code.ts # Códigos HTTP
│   │   └── validation.ts  # Constantes de validação
│   ├── lib/              # Bibliotecas e configurações
│   │   └── prisma.ts     # Cliente Prisma
│   ├── app.ts            # Configuração do Fastify
│   ├── server.ts         # Inicialização do servidor
│   └── env.ts            # Validação de variáveis de ambiente
├── prisma/
│   ├── schema.prisma     # Schema do banco de dados
│   └── migrations/       # Migrations do Prisma
├── docker/
│   └── setup.sql         # Script de inicialização do DB
├── docker-compose.yml    # Configuração do Docker
├── tsconfig.json         # Configuração do TypeScript
├── biome.jsonc           # Configuração do Biome
└── package.json          # Dependências e scripts
```

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento com hot-reload
pnpm dev

# Executar migrations
npx prisma migrate dev

# Gerar Prisma Client
npx prisma generate

# Abrir Prisma Studio (GUI do banco)
npx prisma studio

# Formatar e lint do código
npx ultracite fix

# Verificar código sem corrigir
npx ultracite check
```

## 🔍 Endpoints Disponíveis

> **✅ Estas são as rotas REAIS** que estão implementadas e funcionando no projeto atual.

### Health Check

```http
GET /health
GET /api/health
```

Resposta:

```json
{
  "status": "ok"
}
```

### Criar Usuário

```http
POST /api/users
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123456",
  "name": "Nome do Usuário"
}
```

Resposta (201):

```json
{
  "id": "clxxx..."
}
```

## 🐳 Docker

Para parar o banco de dados:

```bash
docker-compose down
```

Para remover volumes (dados serão perdidos):

```bash
docker-compose down -v
```

Para ver logs do banco:

```bash
docker-compose logs -f database
```

## 🔐 Segurança

- Senhas devem ter no mínimo 8 caracteres
- Email deve ser único no sistema
- CORS configurado para aceitar todas as origens (ajuste para produção)
- Use variáveis de ambiente para dados sensíveis

## 📝 Convenções de Código

Este projeto utiliza [Ultracite](https://ultracite.com/) com [Biome](https://biomejs.dev/) para garantir qualidade e consistência do código. As regras incluem:

- Type safety máximo
- Validação de acessibilidade
- Práticas modernas de TypeScript
- Formatação automática

Execute `npx ultracite fix` antes de commitar alterações.

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feat/nova-feature`)
2. Commit suas mudanças seguindo [Conventional Commits](https://www.conventionalcommits.org/)
3. Push para a branch (`git push origin feat/nova-feature`)
4. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
