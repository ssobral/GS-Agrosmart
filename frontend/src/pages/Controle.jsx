import { useEffect, useRef, useState } from 'react'
import MonitoringLayout from '../components/MonitoringLayout'
import ControleStatus from '../components/ControleStatus'
import AcionamentoManual from '../components/AcionamentoManual'
import ConfirmacaoProgramacao from '../components/ConfirmacaoProgramacao'
import Icon from '../components/DashboardIcon'
import useMonitoramento from '../components/useMonitoramento'
import { buscarControle, cancelarProgramacao, preverHorarios, salvarProgramacao } from '../components/controle'
import '../styles/controle.css'

export default function Controle() {
  const { nome, registros, carregando, erro } = useMonitoramento(1)
  const [controle, setControle] = useState(null)
  const [carregandoControle, setCarregandoControle] = useState(true)
  const [frequencia, setFrequencia] = useState('')
  const [primeiroHorario, setPrimeiroHorario] = useState('')
  const [duracao, setDuracao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [confirmacao, setConfirmacao] = useState(null)
  const mutacaoEmAndamento = useRef(false)
  const [erroControle, setErroControle] = useState('')
  const [mensagemProgramacao, setMensagemProgramacao] = useState('')
  const horarios = preverHorarios(Number(frequencia), primeiroHorario)
  const desabilitado = carregandoControle || salvando || excluindo || confirmacao !== null
  const alterada = controle?.programacao && (
    Number(frequencia) !== controle.programacao.frequencia_diaria
    || primeiroHorario !== controle.programacao.primeiro_horario
    || Number(duracao) !== controle.programacao.duracao_minutos
  )

  useEffect(() => {
    const controller = new AbortController()
    buscarControle({ signal: controller.signal }).then((dados) => {
      if (controller.signal.aborted) return
      setControle(dados)
      if (dados.programacao) {
        setFrequencia(String(dados.programacao.frequencia_diaria))
        setPrimeiroHorario(dados.programacao.primeiro_horario)
        setDuracao(String(dados.programacao.duracao_minutos))
      }
    }).catch(() => {
      if (!controller.signal.aborted) setErroControle('Não foi possível carregar a configuração dos sprinklers.')
    }).finally(() => {
      if (!controller.signal.aborted) setCarregandoControle(false)
    })
    return () => controller.abort()
  }, [])

  function registrarProgramacao(event) {
    event.preventDefault()
    if (desabilitado) return
    setConfirmacao({ tipo: 'salvar', programacao: {
      frequencia_diaria: Number(frequencia), primeiro_horario: primeiroHorario, duracao_minutos: Number(duracao),
    } })
  }

  async function confirmarProgramacao() {
    if (!confirmacao || mutacaoEmAndamento.current) return
    mutacaoEmAndamento.current = true
    const operacao = confirmacao
    setConfirmacao(null)
    setSalvando(operacao.tipo === 'salvar')
    setExcluindo(operacao.tipo === 'cancelar')
    setMensagemProgramacao('')
    setErroControle('')
    try {
      const dados = operacao.tipo === 'salvar'
        ? await salvarProgramacao(operacao.programacao)
        : await cancelarProgramacao()
      setControle((atual) => ({ ...atual, programacao: dados.programacao }))
      if (!dados.programacao) {
        setFrequencia('')
        setPrimeiroHorario('')
        setDuracao('')
      }
      setMensagemProgramacao(dados.mensagem)
    } catch (error) {
      setErroControle(error.message)
    } finally {
      setSalvando(false)
      setExcluindo(false)
      mutacaoEmAndamento.current = false
    }
  }

  return <MonitoringLayout activePage="controle" nome={nome} titulo="Painel de Controle" subtitulo="Acompanhe as condições da lavoura e gerencie a irrigação" className="control-main">
    {erro && <p className="dash-message" role="alert">{erro}{registros.length > 0 && ' Exibindo a última leitura recebida.'}</p>}
    <ControleStatus leitura={registros.at(-1)} carregando={carregando} />
    {erroControle && <p className="dash-message" role="alert">{erroControle}</p>}
    <div className="control-grid">
      <AcionamentoManual />
      <section className="dash-card control-schedule" aria-labelledby="control-schedule-title">
        <div className="dash-card-heading"><span className="dash-card-icon"><Icon name="clock" /></span><h2 id="control-schedule-title">Programação diária</h2></div>
        <p className="control-description">Registre a frequência e o tempo de irrigação para cada dia.</p>
        <form onSubmit={registrarProgramacao}>
          <div className="control-form-fields">
            <div><label htmlFor="daily-frequency">Ativações por dia</label><input id="daily-frequency" type="number" min="1" max="24" step="1" required placeholder="Ex.: 2" value={frequencia} onChange={(event) => { setFrequencia(event.target.value); setMensagemProgramacao('') }} disabled={desabilitado} /></div>
            <div><label htmlFor="first-activation">Primeiro horário</label><input id="first-activation" type="time" required value={primeiroHorario} onChange={(event) => { setPrimeiroHorario(event.target.value); setMensagemProgramacao('') }} disabled={desabilitado} /></div>
            <div className="control-form-full"><label htmlFor="scheduled-duration">Duração de cada ativação <span>(minutos)</span></label><input id="scheduled-duration" type="number" min="1" max="60" step="1" required placeholder="Ex.: 5" value={duracao} onChange={(event) => { setDuracao(event.target.value); setMensagemProgramacao('') }} disabled={desabilitado} /></div>
          </div>
          <div className="control-schedule-preview">
            <h3>Horários previstos</h3>
            {horarios.length ? <ul>{horarios.map((horario) => <li key={horario}><Icon name="clock" />{horario}</li>)}</ul> : <p>Informe a frequência e o primeiro horário para visualizar.</p>}
            <small>Distribuídos ao longo de 24 horas · Horário de Brasília</small>
          </div>
          <button className="control-primary-button" type="submit" disabled={desabilitado}><Icon name="check" />{salvando ? 'Salvando...' : 'Salvar programação'}</button>
          {controle?.programacao && <button className="control-cancel-button" type="button" disabled={desabilitado} onClick={() => setConfirmacao({ tipo: 'cancelar', programacao: controle.programacao })}>{excluindo ? 'Cancelando...' : 'Cancelar programação'}</button>}
        </form>
        <p className="control-note">{alterada ? 'Alterações ainda não salvas.' : controle?.programacao ? 'Programação registrada.' : 'Nenhuma programação cadastrada.'} {!controle?.acionamento_disponivel && 'A execução depende da conexão dos sprinklers.'}</p>
        {mensagemProgramacao && <p className="control-feedback" role="status">{mensagemProgramacao}</p>}
      </section>
    </div>
    {confirmacao && <ConfirmacaoProgramacao operacao={confirmacao} confirmar={confirmarProgramacao} voltar={() => setConfirmacao(null)} />}
  </MonitoringLayout>
}
