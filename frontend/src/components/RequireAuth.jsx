import { useEffect, useRef, useState } from 'react'
import { redirecionarLogin, verificarSessao } from './Auth'
import { AuthNavigation } from './Navigate'

export default function RequireAuth({ children }) {
  const [autenticado, setAutenticado] = useState(false)
  const conteudo = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    const controle = { verificacao: null, expiracao: null }

    function bloquear() {
      if (conteudo.current) conteudo.current.hidden = true
    }

    function verificar() {
      bloquear()
      if (controle.verificacao) return controle.verificacao
      controle.verificacao = verificarSessao({ signal: controller.signal }).then((sessao) => {
        if (controller.signal.aborted) return
        setAutenticado(true)
        if (conteudo.current) conteudo.current.hidden = false
        clearTimeout(controle.expiracao)
        controle.expiracao = setTimeout(() => {
          bloquear()
          redirecionarLogin()
        }, Math.max(0, sessao.expires_at * 1000 - Date.now()))
      }).catch(() => {
        if (!controller.signal.aborted) {
          bloquear()
          setAutenticado(false)
          redirecionarLogin()
        }
      }).finally(() => { controle.verificacao = null })
      return controle.verificacao
    }

    function aoMudarVisibilidade() {
      if (document.visibilityState === 'visible') verificar()
      else bloquear()
    }

    verificar()
    
    window.addEventListener('pageshow', verificar)
    window.addEventListener('focus', verificar)
    window.addEventListener('popstate', verificar)
    window.addEventListener('hashchange', verificar)
    window.addEventListener('pagehide', bloquear)
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    const intervalo = setInterval(verificar, 60_000)

    return () => {
      controller.abort()
      clearTimeout(controle.expiracao)
      clearInterval(intervalo)
      window.removeEventListener('pageshow', verificar)
      window.removeEventListener('focus', verificar)
      window.removeEventListener('popstate', verificar)
      window.removeEventListener('hashchange', verificar)
      window.removeEventListener('pagehide', bloquear)
      document.removeEventListener('visibilitychange', aoMudarVisibilidade)
    }
  }, [])

  function verificarNavegacao(event) {
    const link = event.target.closest('a[href]')
    if (!link || event.defaultPrevented || event.button !== 0
      || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey
      || link.hasAttribute('download') || (link.target && link.target !== '_self')) return
    const destino = new URL(link.href, window.location.href)
    if (destino.origin !== window.location.origin) return
    event.preventDefault()
    event.stopPropagation()
    void AuthNavigation(destino.href)
  }

  return <>
    {!autenticado && <p role="status">Verificando sessão...</p>}
    <div ref={conteudo} hidden={!autenticado} onClickCapture={verificarNavegacao}>
      {autenticado && children}
    </div>
  </>
}
