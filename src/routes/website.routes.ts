import { Hono } from 'hono'
import type { AppEnv } from '../types/env'
import { getWebsitePayloadByHash } from '../services/website.service'
import { getHomepageBlocksByHash } from '../services/homepage-blocks.service'
import { getAboutByHash } from '../services/about.service'
import { getServicesByHash } from '../services/services.service'
import { getContactsByHash } from '../services/contacts.service'
import { getCustomModalByHash } from '../services/custom-modal.service'
import { getSlidersByHash } from '../services/sliders.service'

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

export default router