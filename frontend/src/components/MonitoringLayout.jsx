import { useEffect, useRef, useState } from 'react'
import logo from '../assets/Logo.png'
import '../styles/dashboad.css'
import { sair } from './Auth'
import { AuthNavigation } from './Navigate'
import Icon from './DashboardIcon'

function Landscape() {
  return <svg className="dash-landscape" viewBox="0 0 1600 260" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="dash-field" x2="0" y2="1"><stop stopColor="#d9efce" /><stop offset="1" stopColor="#c0e3ac" /></linearGradient></defs>
    <path d="M0 15C180 45 220 155 360 207S700 260 950 220s280 46 650-65v105H0Z" fill="#e9f6e4" />
    <path d="M0 58c180 30 210 130 410 156s326 69 590 11 260 50 600-45v80H0Z" fill="#dff1d6" />
    <path d="M0 115c155 15 244 90 410 105s335 67 620 24 322-138 570-73v89H0Z" fill="url(#dash-field)" />
    {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${-130 + i * 48} 270Q${45 + i * 23} ${142 + i * 6} 420 231M${1050 + i * 55} 275Q${1420 + i * 20} ${167 + i * 4} 1630 ${207 + i * 7}`} fill="none" stroke="#eff8e8" strokeWidth="7" opacity=".7" />)}
    <path d="M1497 183v-56c-25 4-39-9-42-23 22-11 41 5 42 23 2-23 21-37 45-34-5 22-20 34-43 34" fill="#c8e8b8" />
  </svg>
}

export function MonitoringSidebar({ activePage }) {
  function navegar(event, path) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    return AuthNavigation(path)
  }
  const classe = (page) => `dash-nav-item${activePage === page ? ' dash-nav-item--active' : ''}`
  return <aside className="dash-sidebar">
    <nav aria-label="Menu principal">
      <a className={classe('dashboard')} href="/dashboard" aria-current={activePage === 'dashboard' ? 'page' : undefined} onClick={(event) => navegar(event, '/dashboard')}><Icon name="home" />Dashboard</a>
      <a className={classe('controle')} href="/controle" aria-current={activePage === 'controle' ? 'page' : undefined} onClick={(event) => navegar(event, '/controle')}><Icon name="controls" /><span className="dash-nav-label">Painel de controle</span></a>
      <a className={classe('historico')} href="/historico" aria-current={activePage === 'historico' ? 'page' : undefined} onClick={(event) => navegar(event, '/historico')}><Icon name="history" />Histórico</a>
      <a className={classe('contato')} href="/contato" aria-current={activePage === 'contato' ? 'page' : undefined} onClick={(event) => navegar(event, '/contato')}><Icon name="mail" />Contate-nos</a>
    </nav>
  </aside>
}

export default function MonitoringLayout({ activePage, nome, titulo, subtitulo, children, className = '' }) {
  const [saindo, setSaindo] = useState(false)
  const [erroLogout, setErroLogout] = useState('')
  const [menuAberto, setMenuAberto] = useState(false)
  const conta = useRef(null)
  const botaoConta = useRef(null)
  const botaoLogout = useRef(null)

  useEffect(() => {
    if (!menuAberto) return
    botaoLogout.current?.focus()
    function fecharAoClicarFora(event) {
      if (!conta.current?.contains(event.target)) setMenuAberto(false)
    }
    function fecharAoTeclar(event) {
      if (event.key === 'Escape') {
        setMenuAberto(false)
        botaoConta.current?.focus()
      }
    }
    document.addEventListener('pointerdown', fecharAoClicarFora)
    document.addEventListener('keydown', fecharAoTeclar)
    return () => {
      document.removeEventListener('pointerdown', fecharAoClicarFora)
      document.removeEventListener('keydown', fecharAoTeclar)
    }
  }, [menuAberto])

  async function encerrarSessao() {
    if (saindo) return
    setSaindo(true)
    setErroLogout('')
    try {
      await sair()
    } catch (error) {
      setErroLogout(error.message)
    } finally {
      setSaindo(false)
    }
  }

  return <div className="dash-page">
    <header className="dash-header">
      <div className="dash-brand" aria-label="AgroSmart"><img src={logo} alt="" /><span>Agro<span>Smart</span></span></div>
      <div className="dash-account" ref={conta} onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMenuAberto(false)
      }}>
        <button ref={botaoConta} type="button" className="dash-profile" aria-expanded={menuAberto} aria-controls="dash-profile-menu" onClick={() => setMenuAberto((aberto) => !aberto)}>
          <span className="dash-avatar"><Icon name="user" /></span><span className="dash-profile-name" title={nome}>{nome}</span><Icon name="chevron" />
        </button>
        {menuAberto && <div className="dash-profile-menu" id="dash-profile-menu">
          <button ref={botaoLogout} type="button" className="dash-logout" disabled={saindo} onClick={encerrarSessao}>{saindo ? 'Saindo...' : 'Logout'}</button>
        </div>}
      </div>
    </header>
    <div className="dash-layout">
      <MonitoringSidebar activePage={activePage} />
      <main className={`dash-main ${className}`} id={activePage}>
        <div className="dash-heading"><h1>{titulo}</h1><p>{subtitulo}</p></div>
        {erroLogout && <p className="dash-message" role="alert">{erroLogout}</p>}
        {children}
      </main>
    </div>
    <Landscape />
  </div>
}
