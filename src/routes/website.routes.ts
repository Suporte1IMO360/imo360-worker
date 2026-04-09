import { Hono } from 'hono'
import type { AppEnv } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import { getWebsitePayloadByHash } from '../services/website.service'

const router = new Hono<AppEnv>()

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
  const id = decodeSingleHash(c.env, hash)

  return c.json({
    endpoint: 'contacts',
    hash,
    decoded_id: id,
    status: 'ok'
  })
})

export default router