import { Hono } from 'hono'
import type { AppEnv } from '../types/env'
import { getWebsitePayloadByHash } from '../services/website.service'
import { getHomepageBlocksByHash } from '../services/homepage-blocks.service'
import { getAboutByHash } from '../services/about.service'
import { getServicesByHash } from '../services/services.service'
import { getContactsByHash } from '../services/contacts.service'
import { getCustomModalByHash } from '../services/custom-modal.service'
import { getSlidersByHash } from '../services/sliders.service'
import {
  getTeamByHash,
  getTeamConsultantByHashes,
  getTeamHomepageByHash
} from '../services/team.service'
import { getImoveisByConsultantHash } from '../services/imoveis-random.service'
import {
  getEmpreendimentosByHash,
  getEmpreendimentosConcelhosByHash,
  getEmpreendimentosDistritosByHash,
  getEmpreendimentoDetailByHashes,
  getEmpreendimentosFreguesiasByHash,
  submitEmpreendimentoContactByHash
} from '../services/empreendimentos.service'
import { getCategoriesByHash } from '../services/categories.service'
import {
  getArticleDetailByHash,
  getArticleDetailBySlug,
  getArticlesByHash
} from '../services/articles.service'

const router = new Hono<AppEnv>()

router.get('/website/:hash/homepage/blocks', async (c) => {
  const hash = c.req.param('hash')
  const lang = c.req.query('lang')

  const payload = await getHomepageBlocksByHash(c.env, hash, lang)

  return c.json(payload)
})

router.get('/about/:hash', async (c) => {
  const hash = c.req.param('hash')
  const lang = c.req.query('lang')

  const payload = await getAboutByHash(c.env, hash, lang)

  return c.json(payload)
})

router.get('/services/:hash', async (c) => {
  const hash = c.req.param('hash')
  const lang = c.req.query('lang')

  const payload = await getServicesByHash(c.env, hash, lang)

  return c.json(payload)
})

router.get('/website/:hash', async (c) => {
  const hash = c.req.param('hash')
  const shouldUseCache = c.env.APP_ENV !== 'local'

  const cacheUrl = new URL(c.req.url)
  cacheUrl.search = ''
  const cacheKey = new Request(cacheUrl.toString(), {
    method: 'GET'
  })

  const cachedResponse = shouldUseCache ? await caches.default.match(cacheKey) : null

  if (cachedResponse) {
    return cachedResponse
  }

  const payload = await getWebsitePayloadByHash(c.env, hash)

  if (!payload) {
    return c.json(
      {
        ok: false,
        error: 'website_not_found',
        message: 'Website nao encontrado para este hash.'
      },
      404
    )
  }

  const ttl = Number(c.env.CACHE_TTL_WEBSITE || '2592000')
  const response = c.json(payload)
  response.headers.set('Cache-Control', `public, max-age=${ttl}`)

  if (shouldUseCache) {
    await caches.default.put(cacheKey, response.clone())
  }

  return response
})

router.get('/contacts/:hash', async (c) => {
  const hash = c.req.param('hash')

  const payload = await getContactsByHash(c.env, hash)

  return c.json(payload)
})

router.get('/custom/modal/:hash', async (c) => {
  const hash = c.req.param('hash')
  const lang = c.req.query('lang')

  const payload = await getCustomModalByHash(c.env, hash, lang)

  return c.json(payload)
})

router.get('/sliders/:hash', async (c) => {
  const hash = c.req.param('hash')

  const payload = await getSlidersByHash(c.env, hash)

  return c.json(payload)
})

router.get('/team/:hash', async (c) => {
  const hash = c.req.param('hash')
  const url = new URL(c.req.url)

  const payload = await getTeamByHash(c.env, hash, url.searchParams, url)

  return c.json(payload)
})

router.get('/team/:hash/homepage', async (c) => {
  const hash = c.req.param('hash')
  const url = new URL(c.req.url)

  const payload = await getTeamHomepageByHash(c.env, hash, url.searchParams)

  return c.json(payload)
})

router.get('/team/:agency/consultant/:hash', async (c) => {
  const agency = c.req.param('agency')
  const hash = c.req.param('hash')
  const url = new URL(c.req.url)

  const payload = await getTeamConsultantByHashes(c.env, agency, hash, url.searchParams)

  if (!payload) {
    return c.json({ ok: false, error: 'not_found', message: 'Consultor nao encontrado.' }, 404)
  }

  return c.json(payload)
})

router.get('/team/consultant/:hash/imovs', async (c) => {
  const hash = c.req.param('hash')
  const url = new URL(c.req.url)

  const payload = await getImoveisByConsultantHash(c.env, hash, url.searchParams, url)

  return c.json(payload)
})

router.get('/empreendimentos/:hash', async (c) => {
  const hash = c.req.param('hash')
  const url = new URL(c.req.url)

  const payload = await getEmpreendimentosByHash(c.env, hash, url.searchParams, url)

  return c.json(payload)
})

router.get('/empreendimentos/:hash/distritos', async (c) => {
  const hash = c.req.param('hash')

  const payload = await getEmpreendimentosDistritosByHash(c.env, hash)

  return c.json(payload)
})

router.get('/empreendimentos/:hash/concelhos', async (c) => {
  const hash = c.req.param('hash')
  const url = new URL(c.req.url)

  const payload = await getEmpreendimentosConcelhosByHash(c.env, hash, url.searchParams)

  return c.json(payload)
})

router.get('/empreendimentos/:hash/freguesias', async (c) => {
  const hash = c.req.param('hash')
  const url = new URL(c.req.url)

  const payload = await getEmpreendimentosFreguesiasByHash(c.env, hash, url.searchParams)

  return c.json(payload)
})

router.get('/empreendimentos/:hash/preview/:hash2', async (c) => {
  const hash = c.req.param('hash')
  const hash2 = c.req.param('hash2')
  const url = new URL(c.req.url)

  const payload = await getEmpreendimentoDetailByHashes(c.env, hash, hash2, url.searchParams)

  if (!payload) {
    return c.json({ ok: false, error: 'not_found', message: 'Empreendimento nao encontrado.' }, 404)
  }

  return c.json(payload)
})

router.post('/empreendimentos/:hash/contact', async (c) => {
  const hash = c.req.param('hash')
  const contentType = c.req.header('content-type') || ''

  let payload: Record<string, unknown> = {}

  if (contentType.includes('application/json')) {
    const parsed = await c.req.json<Record<string, unknown>>()
    payload = parsed || {}
  } else {
    const parsed = await c.req.parseBody()
    payload = Object.fromEntries(Object.entries(parsed))
  }

  const result = await submitEmpreendimentoContactByHash(c.env, hash, payload)

  return c.json(result.body, result.status as 200 | 400)
})

router.get('/categories/:hash/list', async (c) => {
  const hash = c.req.param('hash')
  const lang = c.req.query('lang')

  const payload = await getCategoriesByHash(c.env, hash, lang)

  return c.json(payload)
})

router.get('/articles/:hash/list', async (c) => {
  const hash = c.req.param('hash')
  const url = new URL(c.req.url)

  const payload = await getArticlesByHash(c.env, hash, url.searchParams, url)

  return c.json(payload)
})

router.get('/articles/:hash/detail', async (c) => {
  const hash = c.req.param('hash')
  const lang = c.req.query('lang')

  const payload = await getArticleDetailByHash(c.env, hash, lang)

  if (!payload) {
    return c.json({ ok: false, error: 'not_found', message: 'Artigo nao encontrado.' }, 404)
  }

  return c.json(payload)
})

router.get('/articles/:slug', async (c) => {
  const slug = c.req.param('slug')
  const lang = c.req.query('lang')
  const user = c.req.query('user')

  if (!user) {
    return c.json({ ok: false, error: 'invalid_request', message: 'Parametro user em falta.' }, 400)
  }

  const payload = await getArticleDetailBySlug(c.env, slug, user, lang)

  if (!payload) {
    return c.json({ message: 'Artigo nao encontrado.' }, 404)
  }

  return c.json(payload)
})

export default router