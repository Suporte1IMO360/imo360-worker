import { Hono } from 'hono'
import type { AppEnv } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'

const router = new Hono<AppEnv>()

router.get('/website/:hash', async (c) => {
  const hash = c.req.param('hash')
  const id = decodeSingleHash(c.env, hash)

  return c.json({
    endpoint: 'website',
    hash,
    decoded_id: id,
    status: 'ok'
  })
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