import { Hono } from 'hono'
import type { AppEnv } from './types/env'
import websiteRoutes from './routes/website.routes'
import imoveisRoutes from './routes/imoveis.routes'

const app = new Hono<AppEnv>()

function buildRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

app.use('*', async (c, next) => {
  const incomingRequestId = c.req.header('x-request-id')?.trim()
  const requestId = incomingRequestId || buildRequestId()

  c.set('requestId', requestId)
  await next()

  c.header('x-request-id', requestId)
})

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
  const requestId = c.get('requestId')

  if (err.message === 'Invalid hash') {
    return c.json(
      {
        ok: false,
        error: 'invalid_hash',
        message: 'Hash invalido para esta configuracao.',
        request_id: requestId
      },
      400
    )
  }

  console.error('Unhandled error', {
    requestId,
    method: c.req.method,
    path: new URL(c.req.url).pathname,
    message: err.message,
    stack: err.stack
  })

  return c.json(
    {
      ok: false,
      error: 'internal_error',
      message: 'Internal Server Error',
      request_id: requestId
    },
    500
  )
})

export default app