export function paginaPublica(path) {
  const pathname = new URL(path, window.location.href).pathname.replace(/\/+$/, '') || '/'
  return pathname === '/' || pathname === '/login' || pathname === '/sobre' || pathname === '/novos-clientes'
}

export function redirecionarLogin() {
  window.location.replace('/login')
}

export async function requisicaoAutenticada(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
  })
  if (response.status === 401) {
    redirecionarLogin()
    throw new Error('Sessão inválida ou expirada.')
  }
  return response
}

export async function verificarSessao(options = {}) {
  const response = await requisicaoAutenticada('/api/session', options)
  if (!response.ok) throw new Error('Não foi possível verificar a sessão.')
  const sessao = await response.json()
  if (sessao.authenticated !== true || !Number.isFinite(sessao.expires_at)
    || sessao.expires_at * 1000 <= Date.now()) {
    throw new Error('Sessão inválida ou expirada.')
  }
  return sessao
}

export async function sair() {
  const response = await requisicaoAutenticada('/api/logout', { method: 'POST' })
  if (!response.ok) throw new Error('Não foi possível sair. Tente novamente.')
  window.location.replace('/')
}

export async function autenticar(id, senha) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id, senha }),
  })

  if (response.status === 401) {
    throw new Error('ID ou senha incorretos.')
  }
  if (response.status === 422) {
    throw new Error('Informe um ID numérico e uma senha válida.')
  }
  if ([502, 503, 504].includes(response.status)) {
    throw new Error('O servidor está indisponível. Tente conectar novamente em instantes.')
  }
  if (!response.ok) {
    throw new Error('Não foi possível entrar. Tente novamente em instantes.')
  }

  return response.json()
}

