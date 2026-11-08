import { useState } from 'react'
import '../styles/login.css'
import logo from '../assets/Logo.png'
import { autenticar } from '../components/Auth'
import { AuthNavigation, NoAuthNavigation } from '../components/Navigate'

function LoginIcon({ name }) {
  const paths = {
    user: <><circle cx="12" cy="6.5" r="4" /><path d="M3.5 23v-3a6 6 0 0 1 6-6h5a6 6 0 0 1 6 6v3" /></>,
    lock: <><rect x="3" y="10" width="18" height="14" rx="3" /><path d="M7 10V6a5 5 0 0 1 10 0v4" /><circle cx="12" cy="16" r="1" /><path d="M12 17v3" /></>,
    eye: <><path d="M1 13s4-7 11-7 11 7 11 7-4 7-11 7S1 13 1 13Z" /><circle cx="12" cy="13" r="3.5" /></>,
    hidden: <><path d="m2 2 20 22M9 6.5a12 12 0 0 1 3-.5c7 0 11 7 11 7a21 21 0 0 1-4 4.5M6 8a22 22 0 0 0-5 5s4 7 11 7a12 12 0 0 0 4-.7" /><path d="M9 11a3.5 3.5 0 0 0 5 5" /></>,
  }
  return <svg viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (loading) return

    const data = new FormData(event.currentTarget)
    setLoading(true)
    setMessage('')
    try {
      await autenticar(data.get('clientId').trim(), data.get('password'))
      await AuthNavigation('/dashboard')
    } catch (error) {
      setMessage(error instanceof TypeError
        ? 'Não foi possível conectar ao servidor. Tente novamente.'
        : error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand" aria-label="AgroSmart — Monitoramento agrícola inteligente">
          <img className="login-logo" src={logo} alt="" />
          <div className="login-wordmark">Agro<span>Smart</span></div>
          <p>Monitoramento agrícola inteligente</p>
        </div>

        <h1 id="login-title">Acesso à Plataforma</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <LoginIcon name="user" />
            <label className="login-sr-only" htmlFor="login-client-id">ID de Cliente</label>
            <input id="login-client-id" name="clientId" type="text" placeholder="ID de Cliente" autoComplete="username" required />
          </div>
          <div className="login-field">
            <LoginIcon name="lock" />
            <label className="login-sr-only" htmlFor="login-password">Senha</label>
            <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Senha" autoComplete="current-password" required />
            <button className="login-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} aria-controls="login-password">
              <LoginIcon name={showPassword ? 'hidden' : 'eye'} />
            </button>
          </div>
          <button className="login-submit" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>

        <div className="login-separator"><span />ou<span /></div>
        <button className="login-contact" type="button" onClick={() => NoAuthNavigation('/novos-clientes')}>
          Ainda não é cliente? Contate-nos
        </button>
        {message && <p className="login-message" role="status">{message}</p>}
      </section>
    </main>
  )
}
