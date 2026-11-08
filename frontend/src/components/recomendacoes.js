import { requisicaoAutenticada } from './Auth'

export async function gerarRecomendacoes(options = {}) {
  let response
  try {
    response = await requisicaoAutenticada('/api/recomendacoes', {
      ...options,
      method: 'POST',
    })
  } catch (erro) {
    if (erro instanceof TypeError) {
      throw new Error('Não foi possível conectar ao serviço de IA. Tente novamente.')
    }
    throw erro
  }

  const dados = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(typeof dados?.detail === 'string'
      ? dados.detail
      : 'Não foi possível gerar as sugestões. Tente novamente.')
  }
  if (typeof dados?.recomendacoes !== 'string' || !dados.recomendacoes.trim()) {
    throw new Error('A IA não retornou sugestões válidas. Tente novamente.')
  }
  return dados.recomendacoes.trim()
}
