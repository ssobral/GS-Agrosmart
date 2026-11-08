import logo from '../assets/Logo.png'
import '../styles/Inicial.css'
import { NoAuthNavigation } from '../components/Navigate'

function Icon({ name }) {
  const paths = {
    signal: <><circle cx="16" cy="16" r="3" fill="currentColor" stroke="none" /><path d="M10 10a8.5 8.5 0 0 0 0 12m12-12a8.5 8.5 0 0 1 0 12M6 6a14 14 0 0 0 0 20M26 6a14 14 0 0 1 0 20" /></>,
    chart: <path d="M4 20h5v10H4zm8-8h5v18h-5zm8 4h4v14h-4zm7-11h5v25h-5z" fill="currentColor" stroke="none" />,
    leaf: <><path d="M29 4C12 3 4 10 6 20c2 9 20 9 23-16Z" fill="currentColor" stroke="none" /><path d="M4 29c4-10 10-16 18-19" /><path d="M8 22c3-6 8-10 14-12" stroke="white" strokeWidth="1.2" /></>,
    user: <><circle cx="16" cy="9" r="5" /><path d="M5 28v-3c0-9 22-9 22 0v3Z" /></>,
    plus: <path d="M16 5v22M5 16h22" />,
  }
  return <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const benefits = [
  { icon: 'signal', lines: <>Monitoramento<br />em tempo real</> },
  { icon: 'chart', lines: <>Análises<br />inteligentes</> },
  { icon: 'leaf', lines: <>Mais produtividade<br />e sustentabilidade</> },
]

export default function Inicial() {
  return (
    <div className="inicial-page">
      <svg className="corner-leaf" viewBox="0 0 400 260" fill="none" aria-hidden="true">
        <defs><linearGradient id="leaf-green" x1="120" y1="0" x2="310" y2="260" gradientUnits="userSpaceOnUse"><stop stopColor="#148508" /><stop offset="1" stopColor="#59aa43" /></linearGradient></defs>
        <path d="M150 0H400V248C259 271 181 143 0 167Z" fill="url(#leaf-green)" />
        <path d="M207 215C260 151 308 95 400 73" stroke="white" strokeWidth="2.5" />
      </svg>
      <header className="container agro-container agro-header">
        <nav className="d-flex align-items-center" aria-label="Navegação principal">
          <a className="agro-brand d-inline-flex align-items-center text-decoration-none" href="./" aria-label="AgroSmart — início">
            <img src={logo} alt="" className="agro-logo" />
            <span>Agro<span className="brand-green">Smart</span></span>
          </a>
          <span className="nav-divider" aria-hidden="true" />
          <button className="about-button" type="button" onClick={() => NoAuthNavigation('/sobre')}>Sobre</button>
        </nav>
      </header>
      <main className="container agro-container agro-main">
        <div className="row align-items-center hero-row">
          <section className="col-12 col-lg-7 hero-copy" aria-labelledby="hero-title">
            <p className="hero-eyebrow d-flex align-items-center"><span aria-hidden="true" />Agricultura inteligente</p>
            <h1 id="hero-title">Tecnologia e dados para uma lavoura mais <span>produtiva</span> e <span>sustentável.</span></h1>
            <p className="hero-description">O AgroSmart é uma plataforma de monitoramento agrícola que integra sensores, análise de dados e inteligência artificial para apoiar decisões no campo, com mais eficiência e segurança.</p>
            <ul className="benefits d-flex justify-content-between list-unstyled mb-0">
              {benefits.map(({ icon, lines }) => (
                <li key={icon}>
                  <span className="benefit-icon d-flex align-items-center justify-content-center"><Icon name={icon} /></span>
                  <p>{lines}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="col-12 col-lg-5 access-column" aria-labelledby="access-title">
            <div className="card access-card text-center">
              <h2 id="access-title">Já é cliente?</h2>
              <p>Acesse sua conta e acompanhe sua<br className="d-none d-xl-block" /> operação agrícola.</p>
              <div className="d-grid access-actions">
                <button className="btn login-button d-flex align-items-center justify-content-center" type="button" onClick={() => NoAuthNavigation('/login')}><Icon name="user" />Login</button>
                <button className="btn register-button d-flex align-items-center justify-content-center" type="button" onClick={() => NoAuthNavigation('/novos-clientes')}><Icon name="plus" />Não sou cliente ainda</button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <svg className="bottom-wave" viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="wave-green"><stop stopColor="#25642a" /><stop offset="1" stopColor="#16840c" /></linearGradient></defs>
        <path d="M0 0C220 35 245 160 600 200H0Z" fill="url(#wave-green)" />
      </svg>
    </div>
  )
}
