import { Hono } from 'hono'
import type { AppEnv } from './types/env'
import websiteRoutes from './routes/website.routes'
import imoveisRoutes from './routes/imoveis.routes'

const app = new Hono<AppEnv>()

app.get('/health', (c) => {
  return c.json({
    ok: true,
    env: c.env.APP_ENV,
    message: 'Worker a funcionar'
  })
})

app.route('/api', websiteRoutes)
app.route('/api', imoveisRoutes)

app.onError((err, c) => {
  if (err.message === 'Invalid hash') {
    return c.json(
      {
        ok: false,
        error: 'invalid_hash',
        message: 'Hash invalido para esta configuracao.'
      },
      400
    )
  }

  console.error('Unhandled error:', err)

  return c.json(
    {
      ok: false,
      error: 'internal_error',
      message: 'Internal Server Error'
    },
    500
  )
})

export default app