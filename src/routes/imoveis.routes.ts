import { Hono } from 'hono'
import type { AppEnv } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'

const router = new Hono<AppEnv>()

router.get('/imoveis/:hash', async (c) => {
  const hash = c.req.param('hash')
  const id = decodeSingleHash(c.env, hash)
  const query = c.req.query()

  return c.json({
    endpoint: 'imoveis',
    hash,
    decoded_id: id,
    filters: query,
    status: 'ok'
  })
})

router.get('/preview/:hash', async (c) => {
  const hash = c.req.param('hash')
  const id = decodeSingleHash(c.env, hash)

  return c.json({
    endpoint: 'preview',
    hash,
    decoded_id: id,
    status: 'ok'
  })
})

export default router