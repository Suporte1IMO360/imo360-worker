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

# Opcional: Cloudflare Images (modo hibrido com fallback para URL_IMO360)
USE_CLOUDFLARE_IMAGES=false
CF_IMAGES_BASE_URL=https://imagedelivery.net/SEU_ACCOUNT_HASH
CF_IMAGES_VARIANT=public

# Opcional: prefixo legado para ficheiros (equivalente ao defaultpathwebsite)
# Exemplo fixo: agencias/imagens
# Exemplo por agencia: agencias/{agency_id}/imagens
# Exemplo estilo Laravel User::defaultpathwebsite: users/{hash}/website
WEBSITE_DEFAULT_PATH=
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
npx wrangler secret put HASHIDS_ALTERNATIVE_SALT
```

Se fores usar Cloudflare Images no ambiente remoto, define tambem:

```bash
npx wrangler secret put USE_CLOUDFLARE_IMAGES
npx wrangler secret put CF_IMAGES_BASE_URL
npx wrangler secret put CF_IMAGES_VARIANT
```

Quando `USE_CLOUDFLARE_IMAGES=true`, o endpoint tenta montar URL no formato:

`CF_IMAGES_BASE_URL/<image_id>/CF_IMAGES_VARIANT`

Se o valor guardado na base nao parecer um `image_id`, o worker faz fallback para o formato legado com `URL_IMO360`.

Se precisares de manter o comportamento do Laravel `defaultpathwebsite`, define `WEBSITE_DEFAULT_PATH`.
Podes usar `{hash}` (hash da rota), `{agency_hash}`, `{user_hash}` ou `{agency_id}` no template.

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
- `GET /api/website/:hash/homepage/blocks?lang=pt|en|es|fr|de`
- `GET /api/about/:hash?lang=pt|en|es|fr|de`
- `GET /api/services/:hash?lang=pt|en|es|fr|de`
- `GET /api/contacts/:hash`
- `GET /api/sliders/:hash`
- `GET /api/team/:hash[?lang=pt|en|es|fr|de][&text=<nome>][&sort=0|1][&page=<n>]`
- `GET /api/team/:hash/homepage[?lang=pt|en|es|fr|de][&text=<nome>][&sort=0|1]`
- `GET /api/team/:agency/consultant/:hash[?lang=pt|en|es|fr|de]`
- `GET /api/team/consultant/:hash/imovs` (filtros Laravel de `imoveis`, `per_page=9`)
- `GET /api/empreendimentos/:hash[?lang=pt|en|es|fr|de][&distrito_id=<id>][&concelho_id=<id>][&freguesia_id=<id>][&text=<q>][&sort=0|1|2|3][&page=<n>]`
- `GET /api/empreendimentos/:hash/distritos`
- `GET /api/empreendimentos/:hash/concelhos[&distrito_id=<id>]`
- `GET /api/empreendimentos/:hash/freguesias[&concelho_id=<id>]`
- `GET /api/empreendimentos/:hash/preview/:hash2[?lang=pt|en|es|fr|de]`
- `POST /api/empreendimentos/:hash/contact`
- `GET /api/categories/:hash/list[?lang=pt|en|es|fr|de]`
- `GET /api/articles/:hash/list[?lang=pt|en|es|fr|de][&category=<category_hash>][&page=<n>]`
- `GET /api/articles/:hash/detail[?lang=pt|en|es|fr|de]`
- `GET /api/articles/:slug[?lang=pt|en|es|fr|de][&user=<agency_hash>]`
- `GET /api/naturezas/:hash?lang=pt|en|es|fr|de[&type=1]`
- `GET /api/negocios/:hash?lang=pt|en|es|fr|de[&type=1]`
- `GET /api/places/:hash?qry=<texto>[&type=1]`
- `GET /api/otherplaces/:hash?qry=<texto>[&type=1]`
- `GET /api/disponibilidades/:hash?lang=pt|en|es|fr|de[&type=1]`
- `GET /api/estados/:hash?lang=pt|en|es|fr|de[&type=1]`
- `GET /api/zonas/:hash[?type=1][&id=<zona_id>]`
- `GET /api/ces/:hash[?type=1][&id=<ce_id>]`
- `GET /api/distritos/:hash[?type=1]`
- `GET /api/concelhos/:hash[?type=1][&distrito_id=<distrito_id>]`
- `GET /api/concelho/:concelhoid`
- `GET /api/freguesias/:hash[?type=1][&concelho_id=<concelho_id>]`
- `GET /api/freguesias/:id` (apenas id numerico)
- `GET /api/imoveisrandom/:hash?lang=pt|en|es|fr|de`
- `GET /api/imoveis/:hash/virtualtour?lang=pt|en|es|fr|de`
- `GET /api/imoveis/:hash/exclusive?lang=pt|en|es|fr|de`
- `GET /api/imoveis/:hash/similar?lang=pt|en|es|fr|de[&imov_id=<hash>][&imovsubnature_id=<id>][&distrito_id=<id>][&concelho_id=<id>]`
- `GET /api/imoveis/:hash` (filtros Laravel: place, referencia, tipologias, preco, areas, equipamentos, infraestruturas, zonaenvolventes, flags, sort, page)
- `GET /api/preview/:hash`
- `GET /api/property/preview/:slug`
- `GET /api/preview/:hash/images`
- `GET /api/preview/:hash/video`
- `GET /api/preview/:hash/virtualtour`
- `GET /api/preview/:hash/virtualstaging`
- `GET /api/custom/modal/:hash?lang=pt|en|es|fr|de`

## 8.1 Validar apenas endpoint website

Com o worker a correr, executa:

```bash
npm run test:website
```

Variaveis opcionais para testar outros hashes:

```bash
BASE_URL=http://localhost:8788 \
WEBSITE_VALID_HASH=34mm93 \
WEBSITE_ALT_HASH=12rdzpm54o34mm938g97vnl6k \
WEBSITE_INVALID_HASH=hash-invalido-123 \
npm run test:website
```

## 9. Notas importantes

- O endpoint `website` foi simplificado para um primeiro esqueleto seguro; o teu método atual é muito maior e deve ser migrado por blocos.
- O endpoint `imoveis` já aceita filtros base e paginação, mas ainda não replica todos os `whereHas` e joins do projeto original.
- O objetivo deste starter é dar-te base executável e organizada para ires migrando domínio a domínio.
