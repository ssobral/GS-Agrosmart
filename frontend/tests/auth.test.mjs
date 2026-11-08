import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'


const authSource = await readFile(new URL('../src/components/Auth.jsx', import.meta.url), 'utf8')
const authUrl = `data:text/javascript;base64,${Buffer.from(authSource).toString('base64')}`
const auth = await import(authUrl)
const navigationSource = (await readFile(new URL('../src/components/Navigate.jsx', import.meta.url), 'utf8'))
  .replace("'./Auth'", JSON.stringify(authUrl))
const navigation = await import(`data:text/javascript;base64,${Buffer.from(navigationSource).toString('base64')}`)

test('session checks and navigation', async (t) => {
  const originalFetch = globalThis.fetch
  const originalWindow = globalThis.window
  t.after(() => {
    globalThis.fetch = originalFetch
    globalThis.window = originalWindow
  })

  const assigned = []
  const replaced = []
  globalThis.window = { location: {
    href: 'http://localhost:5173/dashboard',
    assign: (path) => assigned.push(path),
    replace: (path) => replaced.push(path),
  } }
  t.beforeEach(() => { assigned.length = 0; replaced.length = 0 })

  function response(status, body) {
    return { status, ok: status >= 200 && status < 300, json: async () => body }
  }

  await t.test('checks the server on every navigation with credentials and no cache', async () => {
    const requests = []
    globalThis.fetch = async (...args) => {
      requests.push(args)
      return response(200, { authenticated: true, expires_at: Date.now() / 1000 + 3600 })
    }
    await navigation.AuthNavigation('/dashboard')
    await navigation.AuthNavigation('/historico')
    assert.deepEqual(assigned, ['/dashboard', '/historico'])
    assert.equal(requests.length, 2)
    for (const [path, options] of requests) {
      assert.equal(path, '/api/session')
      assert.equal(options.credentials, 'include')
      assert.equal(options.cache, 'no-store')
    }
  })

  await t.test('unauthorized, server errors, invalid payloads and expiry block navigation', async () => {
    for (const [status, body] of [
      [401, {}], [500, {}], [200, { authenticated: false }],
      [200, { authenticated: true }],
      [200, { authenticated: true, expires_at: Date.now() / 1000 - 1 }],
    ]) {
      globalThis.fetch = async () => response(status, body)
      await navigation.AuthNavigation('/dashboard')
      assert.equal(assigned.length, 0)
      assert.equal(replaced.at(-1), '/login')
    }
  })

  await t.test('network errors block navigation', async () => {
    globalThis.fetch = async () => { throw new TypeError('offline') }
    await navigation.AuthNavigation('/dashboard')
    assert.equal(assigned.length, 0)
    assert.equal(replaced.at(-1), '/login')
  })

  await t.test('login distinguishes unavailable server from incorrect credentials', async () => {
    for (const status of [502, 503, 504]) {
      globalThis.fetch = async () => response(status, {})
      await assert.rejects(auth.autenticar('123', 'teste'), /servidor está indisponível/)
    }
    globalThis.fetch = async () => response(401, {})
    await assert.rejects(auth.autenticar('123', 'teste'), /ID ou senha incorretos/)
  })

  await t.test('NoAuthNavigation cannot bypass a private route check', async () => {
    globalThis.fetch = async () => response(401, {})
    await navigation.NoAuthNavigation('/dashboard')
    assert.equal(assigned.length, 0)
    assert.equal(replaced.at(-1), '/login')
  })

  await t.test('landing, login, about and new clients stay public', () => {
    globalThis.fetch = async () => { assert.fail('public routes must not require a session') }
    navigation.NoAuthNavigation('/')
    navigation.NoAuthNavigation('/login')
    navigation.NoAuthNavigation('/sobre')
    navigation.NoAuthNavigation('/novos-clientes')
    assert.deepEqual(assigned, ['/', '/login', '/sobre', '/novos-clientes'])
    assert.equal(auth.paginaPublica('/login/?from=dashboard'), true)
    assert.equal(auth.paginaPublica('/sobre/?from=inicio'), true)
    assert.equal(auth.paginaPublica('/novos-clientes/?from=login'), true)
    assert.equal(auth.paginaPublica('/unknown'), false)
  })

  await t.test('private API 401 redirects to login', async () => {
    globalThis.fetch = async () => response(401, {})
    await assert.rejects(auth.requisicaoAutenticada('/api/leituras'))
    assert.equal(replaced.at(-1), '/login')
  })

  await t.test('logout revokes the session before redirecting', async () => {
    let request
    globalThis.fetch = async (...args) => {
      request = args
      assert.equal(replaced.length, 0)
      return response(204)
    }
    await auth.sair()
    assert.equal(request[0], '/api/logout')
    assert.equal(request[1].method, 'POST')
    assert.equal(request[1].credentials, 'include')
    assert.equal(replaced.at(-1), '/')
  })

  await t.test('failed logout reports failure without claiming session was revoked', async () => {
    globalThis.fetch = async () => response(500, {})
    await assert.rejects(auth.sair())
    assert.equal(replaced.length, 0)
  })
})
