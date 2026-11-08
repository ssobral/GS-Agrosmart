import { requisicaoAutenticada } from './Auth'

async function respostaControle(response) {
  if (!response.ok) {
    const erro = await response.json().catch(() => ({}))
    throw new Error(typeof erro.detail === 'string' ? erro.detail : 'Não foi possível concluir a operação. Tente novamente.')
  }
  return response.json()
}

export async function buscarControle(options = {}) {
  return respostaControle(await requisicaoAutenticada('/api/controle', options))
}

export async function salvarProgramacao(programacao) {
  return respostaControle(await requisicaoAutenticada('/api/controle/programacao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(programacao),
  }))
}

export async function cancelarProgramacao() {
  return respostaControle(await requisicaoAutenticada('/api/controle/programacao/cancelar', {
    method: 'POST',
  }))
}

export function preverHorarios(frequencia, primeiroHorario) {
  if (!Number.isInteger(frequencia) || frequencia < 1 || frequencia > 24
    || !/^([01]\d|2[0-3]):[0-5]\d$/.test(primeiroHorario)) return []
  const [hora, minuto] = primeiroHorario.split(':').map(Number)
  return Array.from({ length: frequencia }, (_, indice) => {
    const total = (hora * 60 + minuto + Math.floor(indice * 1440 / frequencia)) % 1440
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
  })
}

export const estadoInicialAcionamento = { status: 'ocioso', minutos: null, fim: null, restante: 0 }

export function reduzirAcionamento(estado, evento) {
  if (evento.tipo === 'pedir_confirmacao') {
    if (estado.status === 'contando' || estado.status === 'confirmando'
      || !Number.isInteger(evento.minutos) || evento.minutos < 1 || evento.minutos > 60) return estado
    return { ...estadoInicialAcionamento, status: 'confirmando', minutos: evento.minutos }
  }
  if (evento.tipo === 'cancelar' && estado.status === 'confirmando') return estadoInicialAcionamento
  if (evento.tipo === 'confirmar' && estado.status === 'confirmando' && Number.isFinite(evento.agora)) {
    return { ...estado, status: 'contando', fim: evento.agora + estado.minutos * 60_000, restante: estado.minutos * 60 }
  }
  if (evento.tipo === 'atualizar' && estado.status === 'contando' && Number.isFinite(evento.agora)) {
    const restante = Math.min(estado.minutos * 60, Math.max(0, Math.ceil((estado.fim - evento.agora) / 1000)))
    if (restante === 0) return { ...estado, status: 'concluido', restante: 0 }
    return restante === estado.restante ? estado : { ...estado, restante }
  }
  return estado
}

export function formatarContagem(segundos) {
  return `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`
}
