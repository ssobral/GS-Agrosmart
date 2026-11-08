import { paginaPublica, redirecionarLogin, verificarSessao } from './Auth'

export function NoAuthNavigation(path) {
  if (!paginaPublica(path)) return AuthNavigation(path)
  window.location.assign(path)
}

export async function AuthNavigation(path) {
  try {
    await verificarSessao()
  } catch {
    redirecionarLogin()
    return
  }

  window.location.assign(path)
}
