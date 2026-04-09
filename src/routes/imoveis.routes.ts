import { Hono } from 'hono'
import type { AppEnv } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import {
  getTipoImovelByHash,
  getTipoNegocioByHash
} from '../services/imoveis-filters.service'

const router = new Hono<AppEnv>()

router.get('/imoveis/:hash/tipoimovel', async (c) => {
  const hash = c.req.param('hash')
  const lang = c.req.query('lang')
  const type = c.req.query('type')

  const payload = await getTipoImovelByHash(c.env, hash, { lang, type })

  return c.json(payload)
})

router.get('/imoveis/:hash/tiponegocio', async (c) => {
  const hash = c.req.param('hash')
  const lang = c.req.query('lang')
  const type = c.req.query('type')

  const payload = await getTipoNegocioByHash(c.env, hash, { lang, type })

  return c.json(payload)
})

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