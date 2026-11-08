import { useEffect, useReducer, useState } from 'react'
import Icon from './DashboardIcon'
import { estadoInicialAcionamento, formatarContagem, reduzirAcionamento } from './controle'
import ConfirmarOperacao from './ConfirmarOperacao'

export default function AcionamentoManual() {
  const [duracao, setDuracao] = useState('1')
  const [estado, dispatch] = useReducer(reduzirAcionamento, estadoInicialAcionamento)
  const contando = estado.status === 'contando'
  const confirmando = estado.status === 'confirmando'

  useEffect(() => {
    if (!contando) return
    function atualizar() {
      dispatch({ tipo: 'atualizar', agora: Date.now() })
    }
    const intervalo = setInterval(atualizar, 1000)
    window.addEventListener('focus', atualizar)
    document.addEventListener('visibilitychange', atualizar)
    return () => {
      clearInterval(intervalo)
      window.removeEventListener('focus', atualizar)
      document.removeEventListener('visibilitychange', atualizar)
    }
  }, [contando])

  return <section className="dash-card control-manual" aria-labelledby="control-manual-title">
    <div className="dash-card-heading"><span className="dash-card-icon"><Icon name="sprinkler" /></span><h2 id="control-manual-title">Acionamento imediato</h2></div>
    <div className="control-manual-illustration"><Icon name="sprinkler" /></div>
    {contando && <span className="control-device-status control-device-status--ok">Simulação em andamento</span>}
    <p>Informe a duração e confirme para iniciar a contagem.</p>
    <form onSubmit={(event) => {
      event.preventDefault()
      dispatch({ tipo: 'pedir_confirmacao', minutos: Number(duracao) })
    }}>
      <label htmlFor="manual-duration">Duração do acionamento <span>(minutos)</span></label>
      <input id="manual-duration" type="number" min="1" max="60" step="1" required value={duracao} onChange={(event) => setDuracao(event.target.value)} disabled={contando || confirmando} />
      <button className="control-primary-button" type="submit" disabled={contando || confirmando}>
        <Icon name={contando ? 'clock' : 'sprinkler'} />
        {contando ? <>Tempo restante: <span role="timer" aria-label="Tempo restante" aria-live="off">{formatarContagem(estado.restante)}</span></> : 'Acionar sprinklers agora'}
      </button>
    </form>
    {contando && <progress className="control-countdown-progress" aria-label="Progresso da simulação" max={estado.minutos * 60} value={estado.minutos * 60 - estado.restante} />}
    {contando && <p className="control-feedback" role="status">Contagem iniciada para {estado.minutos} {estado.minutos === 1 ? 'minuto' : 'minutos'}.</p>}
    {estado.status === 'concluido' && <p className="control-feedback" role="status">Contagem concluída. Você pode iniciar outra simulação.</p>}
    {confirmando && <ConfirmarOperacao titulo="Confirmar acionamento?" icone="sprinkler" textoCancelar="Cancelar" cancelar={() => dispatch({ tipo: 'cancelar' })} confirmar={() => dispatch({ tipo: 'confirmar', agora: Date.now() })}>
      <p>Iniciar a contagem de <strong>{estado.minutos} {estado.minutos === 1 ? 'minuto' : 'minutos'}</strong>?</p>
      <p className="control-confirm-note">Esta é uma simulação local. Nenhum comando será enviado aos sprinklers.</p>
    </ConfirmarOperacao>}
  </section>
}
