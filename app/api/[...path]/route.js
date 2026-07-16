// DataAutomation API Proxy — forwards /api/* requests to the VPS backend.

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5001'

const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade', 'content-length',
])

function stripHopByHop(headers) {
  for (const h of HOP_BY_HOP) headers.delete(h)
  return headers
}

async function proxy(req, ctx) {
  const { path } = await ctx.params
  const pathStr = (path || []).join('/')
  const incoming = new URL(req.url)
  const target = `${BACKEND_URL}/${pathStr}${incoming.search}`
  console.log('[proxy]', req.method, target)

  const headers = stripHopByHop(new Headers(req.headers))
  headers.set('host', new URL(BACKEND_URL).host)

  const init = {
    method: req.method,
    headers,
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body
    init.duplex = 'half'
  }

  try {
    const res = await fetch(target, init)
    const responseHeaders = stripHopByHop(new Headers(res.headers))
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: 'Backend unavailable', details: message }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
  }
}

export async function GET(req, ctx) { return proxy(req, ctx) }
export async function POST(req, ctx) { return proxy(req, ctx) }
export async function PUT(req, ctx) { return proxy(req, ctx) }
export async function DELETE(req, ctx) { return proxy(req, ctx) }
export async function PATCH(req, ctx) { return proxy(req, ctx) }
export async function HEAD(req, ctx) { return proxy(req, ctx) }
export async function OPTIONS(req, ctx) { return proxy(req, ctx) }
