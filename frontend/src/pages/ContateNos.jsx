import { useEffect, useState } from 'react'
import MonitoringLayout from '../components/MonitoringLayout'
import Icon from '../components/DashboardIcon'
import { redirecionarLogin, verificarSessao } from '../components/Auth'
import '../styles/contato.css'

const assuntos = [
  {
    icone: 'sprinkler',
    titulo: 'Suporte aos sprinklers',
    descricao: 'Problemas no acionamento, dúvidas sobre a programação diária ou algum comportamento inesperado? Fale com a equipe para receber orientação.',
  },
  {
    icone: 'layers',
    titulo: 'Expansão do plano',
    descricao: 'Quer ampliar a área monitorada, incluir novos sensores ou conhecer opções para sua operação? Converse conosco sobre os próximos passos.',
  },
  {
    icone: 'mail',
    titulo: 'Dúvidas e atendimento geral',
    descricao: 'Precisa de ajuda com o acesso, os dados de monitoramento ou o uso da plataforma? Nossa equipe pode orientar você.',
  },
]

export default function ContateNos() {
  const [nome, setNome] = useState('Usuário')
  useEffect(() => {
    const controller = new AbortController()
    verificarSessao({ signal: controller.signal }).then((sessao) => {
      if (!controller.signal.aborted) setNome(sessao.user?.name?.trim() || 'Usuário')
    }).catch(() => {
      if (!controller.signal.aborted) redirecionarLogin()
    })
    return () => controller.abort()
  }, [])

  return <MonitoringLayout activePage="contato" nome={nome} titulo="Contate-nos" subtitulo="Estamos aqui para ajudar você e sua operação" className="contact-main">
    <section className="contact-intro" aria-labelledby="contact-intro-title">
      <div className="contact-intro-copy">
        <span className="contact-eyebrow">Atendimento AgroSmart</span>
        <h2 id="contact-intro-title">Como podemos ajudar?</h2>
        <p>Do suporte aos equipamentos à expansão do seu plano, entre em contato com nossa equipe para encontrar o melhor caminho para sua lavoura.</p>
      </div>
      <div className="contact-phone">
        <span className="contact-phone-icon"><Icon name="phone" /></span>
        <div><span>Contate-nos via telefone</span><strong>(11) 9XXXX-XXXX</strong></div>
      </div>
    </section>
    <div className="contact-topics">
      {assuntos.map(({ icone, titulo, descricao }) => <section className="dash-card contact-topic" key={titulo}>
        <span className="dash-card-icon"><Icon name={icone} /></span>
        <h2>{titulo}</h2>
        <p>{descricao}</p>
      </section>)}
    </div>
    <section className="contact-help" aria-labelledby="contact-help-title">
      <span className="dash-card-icon"><Icon name="check" /></span>
      <div><h2 id="contact-help-title">Para agilizar seu atendimento</h2><p>Tenha seu ID de cliente em mãos e conte o que precisa. Em caso de erro, informe o que aconteceu e, se possível, a data e o horário da ocorrência.</p></div>
    </section>
  </MonitoringLayout>
}
