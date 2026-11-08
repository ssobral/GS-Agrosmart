import ConfirmarOperacao from './ConfirmarOperacao'

export default function ConfirmacaoProgramacao({ operacao, confirmar, voltar }) {
  const excluindo = operacao.tipo === 'cancelar'
  const { frequencia_diaria, primeiro_horario, duracao_minutos } = operacao.programacao
  return <ConfirmarOperacao
    titulo={excluindo ? 'Cancelar programação diária?' : 'Confirmar programação diária?'}
    textoConfirmar={excluindo ? 'Cancelar programação' : 'Confirmar'}
    cancelar={voltar} confirmar={confirmar}>
    <p>{excluindo ? 'Deseja remover a programação cadastrada?' : 'Deseja salvar esta programação?'}</p>
    <dl className="control-confirm-summary">
      <div><dt>Frequência</dt><dd>{frequencia_diaria} {frequencia_diaria === 1 ? 'ativação por dia' : 'ativações por dia'}</dd></div>
      <div><dt>Primeiro horário</dt><dd>{primeiro_horario}</dd></div>
      <div><dt>Duração</dt><dd>{duracao_minutos} {duracao_minutos === 1 ? 'minuto' : 'minutos'} por ativação</dd></div>
    </dl>
    <p className="control-confirm-note">{excluindo ? 'Você poderá cadastrar uma nova frequência depois.' : 'A programação ficará salva para os próximos acessos.'}</p>
  </ConfirmarOperacao>
}
