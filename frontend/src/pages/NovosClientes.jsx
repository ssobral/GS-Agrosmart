import logo from '../assets/Logo.png'
import Icon from '../components/DashboardIcon'
import { NoAuthNavigation } from '../components/Navigate'
import '../styles/Inicial.css'
import '../styles/novosClientes.css'

const emailContato = 'agrosmartgs@hotmail.com'
const linkContato = `mailto:${emailContato}?subject=${encodeURIComponent('Quero conhecer o AgroSmart')}`

const beneficios = [
  { icone: 'temperature', titulo: 'Sua lavoura mais perto', texto: 'Acompanhe a temperatura e a umidade do ar em um só lugar.' },
  { icone: 'history', titulo: 'Dados que ajudam a decidir', texto: 'Consulte o histórico e receba sugestões de inteligência artificial.' },
  { icone: 'sprinkler', titulo: 'Mais organização no manejo', texto: 'Planeje as rotinas de irrigação pelo Painel de controle.' },
]

export default function NovosClientes() {
  return <div className="inicial-page prospect-page">
    <header className="container agro-container agro-header prospect-header">
      <nav aria-label="Navegação principal">
        <button className="agro-brand prospect-brand" type="button" onClick={() => NoAuthNavigation('/')} aria-label="AgroSmart — início">
          <img src={logo} alt="" className="agro-logo" />
          <span>Agro<span className="brand-green">Smart</span></span>
        </button>
        <button className="prospect-back-button" type="button" onClick={() => NoAuthNavigation('/')}>
          <span aria-hidden="true">←</span> Voltar à tela inicial
        </button>
      </nav>
    </header>

    <main className="container agro-container prospect-main">
      <section className="prospect-copy" aria-labelledby="prospect-title">
        <p className="hero-eyebrow"><span aria-hidden="true" />Faça parte do AgroSmart</p>
        <h1 id="prospect-title">Tecnologia para cuidar melhor da sua <span>lavoura.</span></h1>
        <p className="prospect-description">Transforme as informações do campo em decisões mais conscientes. Conheça o AgroSmart e descubra como sensores, dados e inteligência artificial podem apoiar sua operação agrícola.</p>
        <ul className="prospect-benefits">
          {beneficios.map(({ icone, titulo, texto }) => <li key={titulo}>
            <span className="prospect-benefit-icon"><Icon name={icone} /></span>
            <div><h2>{titulo}</h2><p>{texto}</p></div>
          </li>)}
        </ul>
      </section>

      <section className="prospect-contact" aria-labelledby="prospect-contact-title">
        <span className="prospect-contact-icon"><Icon name="mail" /></span>
        <p className="prospect-eyebrow">Vamos conversar?</p>
        <h2 id="prospect-contact-title">O primeiro passo começa com um contato.</h2>
        <p className="prospect-contact-description">Para iniciar as negociações, entre em contato com nossa equipe pelo e-mail:</p>
        <a className="prospect-email" href={linkContato}>{emailContato}</a>
        <a className="prospect-mail-button" href={linkContato}><Icon name="mail" />Iniciar conversa por e-mail</a>
        <small className="prospect-disclaimer">A negociação é fictícia e faz parte de um projeto acadêmico. Ao entrar em contato com o e-mail acima, você receberá um e-mail com os dados de login.</small>
        <small className="prospect-disclaimer">Como o retorno é automático, o e-mail pode cair na caixa de spam ou no lixo eletrônico. Verifique essas pastas caso não encontre a resposta na caixa de entrada.</small>
      </section>
    </main>
    <footer className="container agro-container prospect-footer">AgroSmart · Mais informação para cultivar boas decisões.</footer>
  </div>
}
