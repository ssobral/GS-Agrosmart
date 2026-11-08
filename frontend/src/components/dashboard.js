import { requisicaoAutenticada } from './Auth'

const formatoData = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })
const formatoNumero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const formatoDia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' })
const formatoHora = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

export function formatarDataColeta(data) {
  return formatoData.format(new Date(data))
}

export function formatarValor(valor) {
  return formatoNumero.format(valor)
}

export function formatarDataHoraColeta(data) {
  const instante = new Date(data)
  return { data: formatoDia.format(instante), hora: formatoHora.format(instante) }
}

export function escalaGrafico(valores) {
  const menor = Math.min(...valores)
  const maior = Math.max(...valores)
  const margem = Math.max((maior - menor) * 0.15, 1)
  const intervalo = (maior - menor + margem * 2) / 4
  const potencia = 10 ** Math.floor(Math.log10(intervalo))
  const passo = [1, 2, 5, 10].find((valor) => valor * potencia >= intervalo) * potencia
  return {
    min: Math.floor((menor - margem) / passo) * passo,
    max: Math.ceil((maior + margem) / passo) * passo,
    step: passo,
  }
}

export async function buscarRegistros(limite, options = {}) {
  const response = await requisicaoAutenticada(`/api/leituras/refined?limite=${limite}`, options)
  if (!response.ok) throw new Error('Não foi possível atualizar as leituras dos sensores.')
  const registros = await response.json()
  if (!Array.isArray(registros)) throw new Error('Não foi possível carregar as leituras dos sensores.')
  return registros.slice(-limite)
}

export function buscarRegistrosDashboard(options = {}) {
  return buscarRegistros(5, options)
}
