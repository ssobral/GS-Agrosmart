import logo from '../assets/Logo.png'
import Icon from '../components/DashboardIcon'
import { NoAuthNavigation } from '../components/Navigate'
import '../styles/Inicial.css'
import '../styles/sobre.css'

const objetivos = [
  {
    numero: 2, meta: '2.4', cor: '#8b6819',
    titulo: 'Fome zero e agricultura sustentável',
    descricao: 'Queremos apoiar práticas agrícolas mais resilientes, transformando dados do campo em informação útil para o cuidado com a lavoura.',
  },
  {
    numero: 6, meta: '6.4', cor: '#087c98',
    titulo: 'Água potável e saneamento',
    descricao: 'Buscamos incentivar o uso eficiente da água, oferecendo informações para revisar as rotinas de irrigação e evitar desperdícios.',
  },
  {
    numero: 9, meta: '9.5', cor: '#ba4b1c',
    titulo: 'Indústria, inovação e infraestrutura',
    descricao: 'Unimos aprendizado, sensores e inteligência artificial para aproximar a inovação tecnológica dos desafios do agronegócio.',
  },
  {
    numero: 12, meta: '12.2', cor: '#8a6520',
    titulo: 'Consumo e produção responsáveis',
    descricao: 'Nossa proposta é apoiar decisões que considerem o uso responsável dos recursos naturais ao longo da produção agrícola.',
  },
]

const etapas = [
  { icone: 'temperature', titulo: 'Monitorar', texto: 'Acompanhar a temperatura e a umidade do ar para entender as condições da lavoura.' },
  { icone: 'history', titulo: 'Compreender', texto: 'Consultar o histórico e receber sugestões de IA com base nas leituras disponíveis.' },
  { icone: 'controls', titulo: 'Decidir', texto: 'Usar essas informações para revisar a programação de irrigação no Painel de controle.' },
]

export default function Sobre() {
  return <div className="inicial-page about-page">
    <header className="container agro-container agro-header about-header">
      <nav aria-label="Navegação principal">
        <button className="agro-brand about-brand" type="button" onClick={() => NoAuthNavigation('/')} aria-label="AgroSmart — início">
          <img src={logo} alt="" className="agro-logo" />
          <span>Agro<span className="brand-green">Smart</span></span>
        </button>
        <button className="about-back-button" type="button" onClick={() => NoAuthNavigation('/')}>
          <span aria-hidden="true">←</span> Voltar ao início
        </button>
      </nav>
    </header>

    <main className="container agro-container about-main">
      <section className="about-intro" aria-labelledby="about-title">
        <div>
          <p className="hero-eyebrow"><span aria-hidden="true" />Sobre o AgroSmart</p>
          <h1 id="about-title">Da sala de aula<br />ao <span>campo.</span></h1>
          <p className="about-lead">Somos estudantes da FIAP com vontade de transformar conhecimento em soluções para o mercado.</p>
          <p>O AgroSmart nasceu dessa vontade: conectar tecnologia e agricultura para apoiar decisões mais conscientes, aproximando o que aprendemos dos desafios de quem produz.</p>
          <p>Acreditamos que inovar também é cuidar. Por isso, desenvolvemos nosso projeto com os Objetivos de Desenvolvimento Sustentável da ONU como referência para o impacto que queremos construir.</p>
        </div>
        <aside className="about-purpose" aria-labelledby="about-purpose-title">
          <span className="about-purpose-icon"><Icon name="sprout" /></span>
          <span className="about-kicker">Nosso propósito</span>
          <h2 id="about-purpose-title">Cultivar decisões melhores.</h2>
          <p>Transformar dados em informação acessível para aproximar produtividade, uso responsável dos recursos e sustentabilidade no campo.</p>
          <span className="about-origin">Uma iniciativa de estudantes da FIAP</span>
        </aside>
      </section>

      <section className="about-business" aria-labelledby="about-business-title">
        <div className="about-section-heading">
          <span className="about-kicker">Nossa proposta de valor</span>
          <h2 id="about-business-title">Tecnologia com aplicação no dia a dia.</h2>
        </div>
        <div className="about-business-grid">
          <article>
            <span className="about-small-icon"><Icon name="user" /></span>
            <h3>Para quem criamos</h3>
            <p>Produtores e equipes agrícolas que buscam acompanhar as condições da lavoura e organizar as informações da operação em um só lugar.</p>
          </article>
          <article>
            <span className="about-small-icon"><Icon name="layers" /></span>
            <h3>O valor que buscamos entregar</h3>
            <p>Mais clareza para identificar mudanças, consultar o histórico e planejar o manejo com apoio de dados e recomendações de IA.</p>
          </article>
          <article>
            <span className="about-small-icon"><Icon name="sprout" /></span>
            <h3>Como queremos evoluir</h3>
            <p>Nosso projeto acadêmico está em evolução. Queremos aprender com as necessidades reais do campo e construir soluções cada vez mais úteis para o mercado.</p>
          </article>
        </div>
      </section>

      <section className="about-how" aria-labelledby="about-how-title">
        <div className="about-section-heading">
          <span className="about-kicker">Do dado à decisão</span>
          <h2 id="about-how-title">Como o AgroSmart ajuda</h2>
        </div>
        <ol className="about-steps">
          {etapas.map(({ icone, titulo, texto }, indice) => <li key={titulo}>
            <div className="about-step-top"><span>0{indice + 1}</span><Icon name={icone} /></div>
            <h3>{titulo}</h3>
            <p>{texto}</p>
          </li>)}
        </ol>
      </section>

      <section className="about-sustainability" aria-labelledby="about-ods-title">
        <div className="about-section-heading">
          <span className="about-kicker">Compromisso com o futuro</span>
          <h2 id="about-ods-title">Os ODS que orientam nosso projeto</h2>
          <p>Escolhemos quatro objetivos da ONU que se conectam à nossa proposta. Eles orientam a contribuição que buscamos desenvolver com o AgroSmart.</p>
        </div>
        <div className="about-ods-grid">
          {objetivos.map(({ numero, meta, cor, titulo, descricao }) => <article className="about-ods" key={numero} style={{ '--ods-color': cor }}>
            <span className="about-ods-number">{String(numero).padStart(2, '0')}</span>
            <div>
              <span className="about-ods-label">ODS {numero} · Meta {meta}</span>
              <h3>{titulo}</h3>
              <p>{descricao}</p>
              <a href={`https://brasil.un.org/pt-br/sdgs/${numero}`} target="_blank" rel="noopener noreferrer">Conheça o ODS {numero} na ONU <span aria-hidden="true">↗</span><span className="visually-hidden"> (abre em nova aba)</span></a>
            </div>
          </article>)}
        </div>
      </section>

      <section className="about-closing" aria-labelledby="about-closing-title">
        <div>
          <h2 id="about-closing-title">O futuro do campo começa com boas decisões.</h2>
          <p>Estamos aprendendo, construindo e conectando tecnologia a esse futuro.</p>
        </div>
        <button className="about-home-button" type="button" onClick={() => NoAuthNavigation('/')}>Voltar à tela inicial <span aria-hidden="true">→</span></button>
      </section>
    </main>
    <footer className="container agro-container about-footer">AgroSmart · Tecnologia, conhecimento e cuidado com o campo.</footer>
  </div>
}
