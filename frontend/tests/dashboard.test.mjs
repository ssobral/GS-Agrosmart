import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let Cards
let Dashboard
let helpers
let Historico
let HistoricoCharts
let Sidebar
let Controle
let ControleStatus
let controleHelpers
let AcionamentoManual
let ConfirmacaoProgramacao
let App
let Sobre
let NovosClientes
before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'error',
  })
  Cards = (await server.ssrLoadModule('/src/components/DashboardCards.jsx')).default
  Dashboard = (await server.ssrLoadModule('/src/pages/Dashboard.jsx')).default
  helpers = await server.ssrLoadModule('/src/components/dashboard.js')
  Historico = (await server.ssrLoadModule('/src/pages/Historico.jsx')).default
  HistoricoCharts = (await server.ssrLoadModule('/src/components/HistoricoCharts.jsx')).default
  Sidebar = (await server.ssrLoadModule('/src/components/MonitoringLayout.jsx')).MonitoringSidebar
  Controle = (await server.ssrLoadModule('/src/pages/Controle.jsx')).default
  ControleStatus = (await server.ssrLoadModule('/src/components/ControleStatus.jsx')).default
  controleHelpers = await server.ssrLoadModule('/src/components/controle.js')
  AcionamentoManual = (await server.ssrLoadModule('/src/components/AcionamentoManual.jsx')).default
  ConfirmacaoProgramacao = (await server.ssrLoadModule('/src/components/ConfirmacaoProgramacao.jsx')).default
  App = (await server.ssrLoadModule('/src/App.jsx')).default
  Sobre = (await server.ssrLoadModule('/src/pages/Sobre.jsx')).default
  NovosClientes = (await server.ssrLoadModule('/src/pages/NovosClientes.jsx')).default
})
after(async () => { await server?.close() })

function reading(id, overrides = {}) {
  return {
    id, recebido_em: `2026-11-${String(id).padStart(2, '0')}T12:30:00+00:00`,
    temperatura: 20 + id, umidade: 60 + id,
    status_temperatura: 'ideal', status_umidade: 'ideal', status_geral: 'ideal',
    ...overrides,
  }
}

const render = (registros) => renderToStaticMarkup(createElement(Cards, { registros }))

test('direct access to informational pages renders without the authentication wrapper', (t) => {
  const originalWindow = globalThis.window
  t.after(() => { globalThis.window = originalWindow })
  for (const [rota, componente] of [['/sobre', Sobre], ['/novos-clientes', NovosClientes]]) {
    for (const pathname of [rota, `${rota}/`]) {
      globalThis.window = { location: { pathname, href: `http://localhost:5173${pathname}` } }
      const pagina = App()
      assert.equal(pagina.type, componente)
      const html = renderToStaticMarkup(pagina)
      assert.match(html, /Voltar à tela inicial/)
      assert.doesNotMatch(html, /Verificando sessão/)
    }
  }
})

test('header branding has no link, notifications or sidebar logout', () => {
  const html = renderToStaticMarkup(createElement(Dashboard))
  const header = html.match(/<header[\s\S]*?<\/header>/)[0]
  const sidebar = html.match(/<aside[\s\S]*?<\/aside>/)[0]
  assert.match(header, /<div class="dash-brand"/)
  assert.doesNotMatch(header, /<a |dash-notification|dash-header-divider/)
  assert.match(header, /aria-expanded="false"/)
  assert.doesNotMatch(sidebar, /Logout|Sair/)
})

test('empty database has no fabricated values, graph points or OK status', () => {
  const html = render([])
  assert.match(html, /Sem dados/)
  assert.match(html, /Nenhuma leitura disponível/)
  assert.doesNotMatch(html, /dash-chart|dash-badge--ok|86%|26°C/)
})

test('only real records are plotted and the last record supplies the current values', () => {
  for (let count = 1; count <= 5; count++) {
    const registros = Array.from({ length: count }, (_, index) => reading(index + 1))
    const html = render(registros)
    assert.equal((html.match(/<circle[^>]*r="4\.4"/g) || []).length, count * 2)
    assert.match(html, new RegExp(`<strong>${60 + count}%</strong>`))
    assert.match(html, new RegExp(`<strong>${20 + count}°C</strong>`))
    const labels = Array.from(html.matchAll(/class="dash-date-label"[^>]*>([^<]+)/g), (match) => match[1])
    assert.equal(labels.length, count * 2)
    for (const label of labels) assert.match(label, /^\d{2}\/\d{2}\/2026$/)
    assert.match(html, /dash-status-panel--ok/)
    assert.doesNotMatch(html, /NaN|Infinity/)
  }
})

test('either irregular measurement makes the overall status irregular', () => {
  for (const statuses of [['baixo', 'ideal'], ['ideal', 'alto'], ['alto', 'baixo']]) {
    const html = render([reading(1, {
      status_temperatura: statuses[0], status_umidade: statuses[1],
    })])
    assert.match(html, /dash-status-panel--alert/)
    assert.match(html, /<strong>Irregular<\/strong>/)
  }
})

test('only the latest status determines the overall condition', () => {
  const html = render([
    reading(1, { status_temperatura: 'alto', status_umidade: 'baixo' }),
    reading(2),
  ])
  assert.match(html, /dash-status-panel--ok/)
  assert.doesNotMatch(html, /<strong>Irregular<\/strong>/)
})

test('dates use Sao Paulo day and never include time', () => {
  assert.equal(helpers.formatarDataColeta('2026-11-07T01:00:00+00:00'), '06/11/2026')
  assert.equal(helpers.formatarDataColeta('2026-11-07T12:30:00+00:00'), '07/11/2026')
})

test('chart bounds cover negative, repeated and extreme valid measurements', () => {
  for (const valores of [[-20, 60], [0, 100], [25], [25, 25, 25], [20.1, 20.2]]) {
    const { min, max, step } = helpers.escalaGrafico(valores)
    assert.ok(min <= Math.min(...valores))
    assert.ok(max >= Math.max(...valores))
    assert.ok(max > min && step > 0)
  }
})

test('dashboard requests the five latest refined records with the session cookie', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  let request
  const registros = [reading(1), reading(2)]
  globalThis.fetch = async (...args) => {
    request = args
    return { status: 200, ok: true, json: async () => registros }
  }
  assert.deepEqual(await helpers.buscarRegistrosDashboard(), registros)
  assert.equal(request[0], '/api/leituras/refined?limite=5')
  assert.equal(request[1].credentials, 'include')
  assert.equal(request[1].cache, 'no-store')
})

test('history uses the shared navigation and offers AI generation without showing suggestions before clicking', () => {
  const html = renderToStaticMarkup(createElement(Historico))
  const dashboard = renderToStaticMarkup(createElement(Dashboard))
  assert.equal(html.match(/<header[\s\S]*?<\/header>/)[0], dashboard.match(/<header[\s\S]*?<\/header>/)[0])
  assert.match(html, /Histórico de Monitoramento/)
  assert.match(html, /class="dash-nav-item dash-nav-item--active" href="\/historico" aria-current="page"/)
  assert.match(html, /Ações sugeridas<\/h2><button class="history-generate-button" type="button" aria-expanded="false" aria-controls="history-suggestions">Gerar por IA<\/button>/)
  assert.match(html, /<div id="history-suggestions" class="history-recommendations-content" role="region" aria-label="Recomendações" aria-live="polite" aria-busy="false"><\/div>/)
  assert.doesNotMatch(html, /feitas por IA|Suas sugestões aparecerão aqui/)
  const sidebar = html.match(/<aside[\s\S]*?<\/aside>/)[0]
  assert.ok(sidebar.indexOf('Dashboard') < sidebar.indexOf('Painel de controle'))
  assert.ok(sidebar.indexOf('Painel de controle') < sidebar.indexOf('Histórico'))
  assert.ok(sidebar.indexOf('Histórico') < sidebar.indexOf('Contate-nos'))
})

test('history charts plot only the available readings, including a single point', () => {
  for (const count of [0, 1, 3, 20]) {
    const registros = Array.from({ length: count }, (_, index) => reading(index + 1))
    const html = renderToStaticMarkup(createElement(HistoricoCharts, { registros }))
    assert.equal((html.match(/class="history-point"/g) || []).length, count * 2)
    assert.doesNotMatch(html, /NaN|Infinity/)
    if (!count) {
      assert.match(html, /Nenhuma leitura disponível/)
      assert.doesNotMatch(html, /<svg class="history-chart/)
    } else {
      assert.match(html, new RegExp(`Últimos ${count} ${count === 1 ? 'registro' : 'registros'}`))
      assert.match(html, /<tspan[^>]*>01\/11<\/tspan><tspan[^>]*>09:30<\/tspan>/)
      assert.match(html, new RegExp(`${20 + count}°C em`))
    }
  }
})

test('history requests the last 20 real readings and preserves chronological order', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  const registros = Array.from({ length: 20 }, (_, index) => reading(index + 1))
  let request
  globalThis.fetch = async (...args) => {
    request = args
    return { status: 200, ok: true, json: async () => registros }
  }
  assert.deepEqual(await helpers.buscarRegistros(20), registros)
  assert.equal(request[0], '/api/leituras/refined?limite=20')
  assert.equal(request[1].credentials, 'include')
  assert.equal(request[1].cache, 'no-store')
})

test('sidebar validates the session before navigating between all internal pages', async (t) => {
  const originalFetch = globalThis.fetch
  const originalWindow = globalThis.window
  t.after(() => {
    globalThis.fetch = originalFetch
    globalThis.window = originalWindow
  })
  const assigned = []
  const replaced = []
  globalThis.window = { location: { assign: (path) => assigned.push(path), replace: (path) => replaced.push(path) } }
  const links = Sidebar({ activePage: 'dashboard' }).props.children.props.children
  for (const [index, path] of [[0, '/dashboard'], [1, '/controle'], [2, '/historico'], [3, '/contato']]) {
    const requests = []
    globalThis.fetch = async (...args) => {
      requests.push(args)
      return { status: 200, ok: true, json: async () => ({ authenticated: true, expires_at: Date.now() / 1000 + 3600 }) }
    }
    const event = { preventDefault() { this.defaultPrevented = true } }
    await links[index].props.onClick(event)
    assert.equal(event.defaultPrevented, true)
    assert.equal(requests[0][0], '/api/session')
    assert.equal(assigned.at(-1), path)
  }
  assigned.length = 0
  globalThis.fetch = async () => ({ status: 401, ok: false })
  await links[2].props.onClick({ preventDefault() {} })
  assert.equal(assigned.length, 0)
  assert.equal(replaced.at(-1), '/login')
  await links[1].props.onClick({ preventDefault() {} })
  assert.equal(assigned.length, 0)
  assert.equal(replaced.at(-1), '/login')
})

test('control page uses shared navigation and offers irrigation and schedule fields', () => {
  const html = renderToStaticMarkup(createElement(Controle))
  assert.match(html, /class="dash-nav-item dash-nav-item--active" href="\/controle" aria-current="page"/)
  assert.match(html, /Acionamento imediato/)
  assert.match(html, /Acionar sprinklers agora/)
  assert.match(html, /Ativações por dia/)
  assert.match(html, /Primeiro horário/)
  assert.match(html, /Duração de cada ativação/)
  assert.match(html, /Salvar programação/)
  assert.match(html, /id="daily-frequency"[^>]*min="1"[^>]*max="24"/)
  assert.match(html, /<button class="control-primary-button" type="submit" disabled=""/)
})

test('control page highlights each irregular measure using real values', () => {
  const html = renderToStaticMarkup(createElement(ControleStatus, { leitura: reading(1, {
    temperatura: 43.7, umidade: 40, status_temperatura: 'alto', status_umidade: 'baixo',
  }) }))
  assert.match(html, /Irregularidades identificadas/)
  assert.match(html, /Duas medidas estão/)
  assert.match(html, /43,7°C/)
  assert.match(html, /40%/)
  assert.match(html, />Alta<\/span>/)
  assert.match(html, />Baixa<\/span>/)
  assert.equal((html.match(/control-sensor--alert/g) || []).length, 2)
  const empty = renderToStaticMarkup(createElement(ControleStatus))
  assert.match(empty, /Aguardando leitura dos sensores/)
  assert.doesNotMatch(empty, /Condições dentro da faixa ideal|control-sensor--alert/)
})

test('daily schedule previews evenly distributed local times including midnight rollover', () => {
  assert.deepEqual(controleHelpers.preverHorarios(3, '06:30'), ['06:30', '14:30', '22:30'])
  assert.deepEqual(controleHelpers.preverHorarios(2, '23:30'), ['23:30', '11:30'])
  for (const frequency of [0, 25, 2.5]) assert.deepEqual(controleHelpers.preverHorarios(frequency, '06:00'), [])
  for (const time of ['', '24:00', '12:60', '6:00']) assert.deepEqual(controleHelpers.preverHorarios(2, time), [])
  for (let frequency = 1; frequency <= 24; frequency++) {
    assert.equal(new Set(controleHelpers.preverHorarios(frequency, '07:15')).size, frequency)
  }
})

test('saving sprinkler schedule sends authenticated values to the backend', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  let request
  const programacao = { frequencia_diaria: 2, primeiro_horario: '06:00', duracao_minutos: 5 }
  globalThis.fetch = async (...args) => {
    request = args
    return { status: 200, ok: true, json: async () => ({ programacao }) }
  }
  assert.deepEqual(await controleHelpers.salvarProgramacao(programacao), { programacao })
  assert.equal(request[0], '/api/controle/programacao')
  assert.equal(request[1].method, 'POST')
  assert.equal(request[1].credentials, 'include')
  assert.deepEqual(JSON.parse(request[1].body), programacao)
})

test('daily schedule confirmation shows the exact saved or cancelled frequency', () => {
  const programacao = { frequencia_diaria: 3, primeiro_horario: '06:30', duracao_minutos: 5 }
  for (const tipo of ['salvar', 'cancelar']) {
    const html = renderToStaticMarkup(createElement(ConfirmacaoProgramacao, {
      operacao: { tipo, programacao }, confirmar() {}, voltar() {},
    }))
    assert.match(html, /<dialog/)
    assert.match(html, /3 ativações por dia/)
    assert.match(html, /06:30/)
    assert.match(html, /5 minutos por ativação/)
    assert.match(html, tipo === 'salvar' ? /Confirmar programação diária\?/ : /Cancelar programação diária\?/)
    assert.match(html, />Voltar<\/button>/)
  }
})

test('schedule cancellation uses authentication and reports errors without pretending success', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })
  let request
  globalThis.fetch = async (...args) => {
    request = args
    return { status: 200, ok: true, json: async () => ({ programacao: null, mensagem: 'Programação cancelada.' }) }
  }
  const result = await controleHelpers.cancelarProgramacao()
  assert.equal(request[0], '/api/controle/programacao/cancelar')
  assert.equal(request[1].method, 'POST')
  assert.equal(request[1].credentials, 'include')
  assert.equal(result.programacao, null)
  globalThis.fetch = async () => ({ status: 500, ok: false, json: async () => ({ detail: 'Não foi possível cancelar.' }) })
  await assert.rejects(controleHelpers.cancelarProgramacao(), /Não foi possível cancelar/)
})

test('manual simulation is available without a device connection', () => {
  const html = renderToStaticMarkup(createElement(AcionamentoManual))
  assert.doesNotMatch(html, /Simulação local|Simulação feita apenas nesta página/)
  assert.match(html, /Acionar sprinklers agora/)
  assert.doesNotMatch(html, /disabled|Conexão pendente/)
})

test('countdown only starts after confirmation and cancellation starts nothing', () => {
  const { estadoInicialAcionamento: initial, reduzirAcionamento: reduce } = controleHelpers
  const popup = reduce(initial, { tipo: 'pedir_confirmacao', minutos: 5 })
  assert.equal(popup.status, 'confirmando')
  assert.equal(popup.fim, null)
  assert.equal(popup.restante, 0)
  const cancelled = reduce(popup, { tipo: 'cancelar' })
  assert.equal(cancelled.status, 'ocioso')
  assert.equal(reduce(cancelled, { tipo: 'atualizar', agora: 50_000 }), cancelled)
  for (const minutos of [0, 61, 1.5, NaN]) {
    assert.equal(reduce(initial, { tipo: 'pedir_confirmacao', minutos }), initial)
  }
})

test('confirmation locks the action for the selected duration and elapsed time unlocks it', () => {
  const { estadoInicialAcionamento: initial, reduzirAcionamento: reduce, formatarContagem } = controleHelpers
  const popup = reduce(initial, { tipo: 'pedir_confirmacao', minutos: 5 })
  const running = reduce(popup, { tipo: 'confirmar', agora: 1_000 })
  assert.equal(running.status, 'contando')
  assert.equal(running.fim, 301_000)
  assert.equal(formatarContagem(running.restante), '05:00')
  assert.equal(reduce(running, { tipo: 'confirmar', agora: 10_000 }), running)
  assert.equal(reduce(running, { tipo: 'pedir_confirmacao', minutos: 10 }), running)
  const tick = reduce(running, { tipo: 'atualizar', agora: 11_000 })
  assert.equal(formatarContagem(tick.restante), '04:50')
  const done = reduce(tick, { tipo: 'atualizar', agora: 401_000 })
  assert.equal(done.status, 'concluido')
  assert.equal(done.restante, 0)
  assert.equal(reduce(done, { tipo: 'pedir_confirmacao', minutos: 1 }).status, 'confirmando')
})
