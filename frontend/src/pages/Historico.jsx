import { useEffect, useRef, useState } from 'react'
import MonitoringLayout from '../components/MonitoringLayout'
import HistoricoCharts from '../components/HistoricoCharts'
import Icon from '../components/DashboardIcon'
import useMonitoramento from '../components/useMonitoramento'
import { gerarRecomendacoes } from '../components/recomendacoes'
import '../styles/historico.css'

export default function Historico() {
  const { nome, registros, carregando, erro } = useMonitoramento(20)
  const [recomendacoes, setRecomendacoes] = useState('')
  const [gerando, setGerando] = useState(false)
  const [erroIA, setErroIA] = useState('')
  const requisicaoIA = useRef(null)
  const exibirSugestoes = gerando || Boolean(recomendacoes) || Boolean(erroIA)

  useEffect(() => () => requisicaoIA.current?.abort(), [])

  async function gerarSugestoes() {
    if (requisicaoIA.current) return
    const controller = new AbortController()
    requisicaoIA.current = controller
    setGerando(true)
    setErroIA('')
    setRecomendacoes('')
    try {
      const texto = await gerarRecomendacoes({ signal: controller.signal })
      if (!controller.signal.aborted) setRecomendacoes(texto)
    } catch (erro) {
      if (!controller.signal.aborted) setErroIA(erro.message || 'Não foi possível gerar as sugestões. Tente novamente.')
    } finally {
      if (!controller.signal.aborted) setGerando(false)
      requisicaoIA.current = null
    }
  }

  return <MonitoringLayout activePage="historico" nome={nome} titulo="Histórico de Monitoramento" subtitulo="Acompanhe os últimos registros de temperatura e umidade do ar" className="history-main">
    {erro && <p className="dash-message" role="alert">{erro}{registros.length > 0 && ' Exibindo os últimos registros recebidos.'}</p>}
    <HistoricoCharts registros={registros} carregando={carregando} />
    <section className="dash-card history-recommendations" aria-labelledby="history-actions-title">
      <div className="dash-card-heading">
        <span className="dash-card-icon"><Icon name="sprout" /></span>
        <h2 id="history-actions-title">Ações sugeridas</h2>
        <button
          className="history-generate-button"
          type="button"
          aria-expanded={exibirSugestoes}
          aria-controls="history-suggestions"
          disabled={gerando}
          onClick={gerarSugestoes}
        >{gerando ? 'Gerando...' : 'Gerar por IA'}</button>
      </div>
      <div id="history-suggestions" className="history-recommendations-content" role="region" aria-label="Recomendações" aria-live="polite" aria-busy={gerando}>
        {gerando && <div className="history-suggestions" role="status">
          <span className="dash-card-icon"><Icon name="clock" /></span>
          <p>Analisando as últimas leituras e gerando sugestões...</p>
        </div>}
        {erroIA && <div className="history-suggestions"><p className="dash-message" role="alert">{erroIA}</p></div>}
        {recomendacoes && <div className="history-suggestions">
          <span className="dash-card-icon"><Icon name="sprout" /></span>
          <p className="history-recommendations-text">{recomendacoes}</p>
        </div>}
      </div>
    </section>
  </MonitoringLayout>
}
