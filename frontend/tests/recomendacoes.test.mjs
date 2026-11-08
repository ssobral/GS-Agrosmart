import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let gerarRecomendacoes

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'error',
  })
  const modulo = await server.ssrLoadModule('/src/components/recomendacoes.js')
  gerarRecomendacoes = modulo.gerarRecomendacoes
})
after(async () => { await server?.close() })

function mockFetch(t, callback) {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  globalThis.fetch = callback
}

test('generation posts with the session cookie and returns the complete recommendation text', async (t) => {
  const texto = '1. Observe a temperatura.\n\n2. Verifique a umidade do ar.'
  let request
  const controller = new AbortController()
  mockFetch(t, async (...args) => {
    request = args
    return { ok: true, json: async () => ({ recomendacoes: ` ${texto}\n` }) }
  })
  assert.equal(await gerarRecomendacoes({ signal: controller.signal }), texto)
  assert.equal(request[0], '/api/recomendacoes')
  assert.equal(request[1].method, 'POST')
  assert.equal(request[1].credentials, 'include')
  assert.equal(request[1].cache, 'no-store')
  assert.equal(request[1].signal, controller.signal)
  assert.equal(request[1].body, undefined)
})

test('insufficient readings are displayed using the message supplied by the backend', async (t) => {
  const texto = 'Dados insuficientes. Aguarde pelo menos 5 leituras para gerar uma análise.'
  mockFetch(t, async () => ({ ok: true, json: async () => ({ recomendacoes: texto }) }))
  assert.equal(await gerarRecomendacoes(), texto)
})

test('service failures preserve the backend explanation and allow another request', async (t) => {
  mockFetch(t, async () => ({ ok: false, status: 503, json: async () => ({ detail: 'Serviço de IA indisponível.' }) }))
  await assert.rejects(gerarRecomendacoes(), /Serviço de IA indisponível/)
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ recomendacoes: 'Nova análise.' }) })
  assert.equal(await gerarRecomendacoes(), 'Nova análise.')
})

test('invalid, empty or non-JSON replies never count as successful generation', async (t) => {
  mockFetch(t, async () => ({}))
  for (const dados of [null, {}, { recomendacoes: [] }, { recomendacoes: ' \n ' }]) {
    globalThis.fetch = async () => ({ ok: true, json: async () => dados })
    await assert.rejects(gerarRecomendacoes(), /não retornou sugestões válidas/)
  }
  globalThis.fetch = async () => ({ ok: false, status: 502, json: async () => { throw new SyntaxError() } })
  await assert.rejects(gerarRecomendacoes(), /Não foi possível gerar/)
})

test('expired sessions redirect to login instead of displaying a recommendation', async (t) => {
  const originalWindow = globalThis.window
  t.after(() => { globalThis.window = originalWindow })
  let destino
  globalThis.window = { location: { replace: (path) => { destino = path } } }
  mockFetch(t, async () => ({ status: 401, ok: false }))
  await assert.rejects(gerarRecomendacoes(), /Sessão inválida ou expirada/)
  assert.equal(destino, '/login')
})

test('connection failures have a readable message and cancellation is preserved', async (t) => {
  mockFetch(t, async () => { throw new TypeError('Failed to fetch') })
  await assert.rejects(gerarRecomendacoes(), /Não foi possível conectar ao serviço de IA/)
  const erro = new DOMException('Aborted', 'AbortError')
  globalThis.fetch = async () => { throw erro }
  await assert.rejects(gerarRecomendacoes(), (result) => result === erro)
})
