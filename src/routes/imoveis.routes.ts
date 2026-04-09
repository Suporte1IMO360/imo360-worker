import { Hono } from 'hono'
import type { AppEnv } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import {
  getCesByHash,
  getConcelhosByHash,
  getDisponibilidadesByHash,
  getDistritosByHash,
  getEstadosByHash,
  getOtherPlacesByHash,
  getPlacesByHash,
  getTipoImovelByHash,
  getTipoNegocioByHash,
  getZonasByHash
} from '../services/imoveis-filters.service'

const router = new Hono<AppEnv>()

router.get('/naturezas/:hash', async (c) => {
  const hash = c.req.param('hash')
  const lang = c.req.query('lang')
  const type = c.req.query('type')

  const payload = await getTipoImovelByHash(c.env, hash, { lang, type })

  return c.json(payload)
})

router.get('/negocios/:hash', async (c) => {
  const hash = c.req.param('hash')
  const lang = c.req.query('lang')
  const type = c.req.query('type')

  const payload = await getTipoNegocioByHash(c.env, hash, { lang, type })

  return c.json(payload)
})

router.get('/places/:hash', async (c) => {
  const hash = c.req.param('hash')
  const qry = c.req.query('qry')
  const type = c.req.query('type')

  const payload = await getPlacesByHash(c.env, hash, { qry, type })

  return c.json(payload)
})

router.get('/otherplaces/:hash', async (c) => {
  const hash = c.req.param('hash')
  const qry = c.req.query('qry')
  const type = c.req.query('type')

  const payload = await getOtherPlacesByHash(c.env, hash, { qry, type })

  return c.json(payload)
})

router.get('/disponibilidades/:hash', async (c) => {
  const hash = c.req.param('hash')
  const lang = c.req.query('lang')
  const type = c.req.query('type')

  const payload = await getDisponibilidadesByHash(c.env, hash, { lang, type })

  return c.json(payload)
})

router.get('/estados/:hash', async (c) => {
  const hash = c.req.param('hash')
  const lang = c.req.query('lang')
  const type = c.req.query('type')

  const payload = await getEstadosByHash(c.env, hash, { lang, type })

  return c.json(payload)
})

router.get('/zonas/:hash', async (c) => {
  const hash = c.req.param('hash')
  const type = c.req.query('type')
  const id = c.req.query('id')

  const payload = await getZonasByHash(c.env, hash, { type, id })

  return c.json(payload)
})

router.get('/ces/:hash', async (c) => {
  const hash = c.req.param('hash')
  const type = c.req.query('type')
  const id = c.req.query('id')

  const payload = await getCesByHash(c.env, hash, { type, id })

  return c.json(payload)
})

router.get('/distritos/:hash', async (c) => {
  const hash = c.req.param('hash')
  const type = c.req.query('type')

  const payload = await getDistritosByHash(c.env, hash, { type })

  return c.json(payload)
})

router.get('/concelhos/:hash', async (c) => {
  const hash = c.req.param('hash')
  const type = c.req.query('type')
  const distrito_id = c.req.query('distrito_id')

  const payload = await getConcelhosByHash(c.env, hash, { type, distrito_id })

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