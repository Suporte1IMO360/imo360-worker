# imo360-worker

Starter real para migrar partes da tua API/Lumen para Cloudflare Workers com TypeScript, Hono, MySQL e Hyperdrive.

## O que este starter já contempla

- Estrutura por domínio, não por controller gigante.
- Endpoints iniciais inspirados nas tuas rotas: `/api/website/:hash`, `/api/contacts/:hash`, `/api/imoveis/:hash`, `/api/preview/:hash`.
- Suporte a Hashids, compatível com a lógica atual baseada em `decode($hash)[0]`.
- Ligação MySQL preparada para Cloudflare Hyperdrive.
- Middleware de auth opcional para futuras rotas protegidas.
- Parsing de filtros do endpoint `imoveis`.
- Documentação para correr localmente, publicar numa repo e instalar/deploy na Cloudflare.

## 1. Pré-requisitos

- Node.js 20+
- npm ou pnpm
- Conta Cloudflare
- Base de dados MySQL acessível com TLS
- Salt de Hashids igual ao projeto atual

## 2. Instalação local

```bash
npm install
cp .dev.vars.example .dev.vars
```

Editar `.dev.vars` e colocar as configs reais do Hashids do Lumen:

```env
HASHIDS_SALT=F28F86043514AEB26943F1A67F21B94251201F322199855F1DF1B982E3CF7C92
HASHIDS_MIN_LENGTH=6
HASHIDS_ALPHABET=abcdefghijklmnopqrstuvwxyz1234567890

# Opcional: segunda conexao hashids (ex.: 'alternative' no Laravel)
HASHIDS_ALTERNATIVE_SALT=F28F86043514AEB26943F1A67F21B94251201F322199855F1DF1B982E3CF7C92
HASHIDS_ALTERNATIVE_MIN_LENGTH=25
HASHIDS_ALTERNATIVE_ALPHABET=abcdefghijklmnopqrstuvwxyz1234567890
```

## 3. Executar localmente

```bash
npm run dev
```

Por omissão o Wrangler serve localmente e injeta as vars de `.dev.vars`.

## 4. Criar Hyperdrive

Primeiro autentica a CLI:

```bash
npx wrangler login
```

Depois cria o Hyperdrive apontando ao teu MySQL:

```bash
npx wrangler hyperdrive create imo360-mysql \
  --connection-string="mysql://USER:PASSWORD@HOST:3306/DATABASE"
```

A Cloudflare devolve um ID. Copia esse ID para `wrangler.jsonc` em `hyperdrive[0].id`.

## 5. Secrets

Define os secrets na Cloudflare:

```bash
npx wrangler secret put HASHIDS_SALT
npx wrangler secret put API_AUTH_TOKEN
```

`API_AUTH_TOKEN` é opcional neste starter e só será usado em rotas protegidas.

## 6. Deploy

```bash
npm run deploy
```

## 7. Git / Repo

Criar repo local:

```bash
git init
git add .
git commit -m "Initial Cloudflare Worker starter"
```

Depois ligar ao GitHub:

```bash
git remote add origin git@github.com:TEU-USER/imo360-worker.git
git branch -M main
git push -u origin main
```

## 8. Rotas atuais do starter

- `GET /health`
- `GET /api/website/:hash`
- `GET /api/contacts/:hash`
- `GET /api/imoveis/:hash`
- `GET /api/preview/:hash`

## 9. Notas importantes

- O endpoint `website` foi simplificado para um primeiro esqueleto seguro; o teu método atual é muito maior e deve ser migrado por blocos.
- O endpoint `imoveis` já aceita filtros base e paginação, mas ainda não replica todos os `whereHas` e joins do projeto original.
- O objetivo deste starter é dar-te base executável e organizada para ires migrando domínio a domínio.
