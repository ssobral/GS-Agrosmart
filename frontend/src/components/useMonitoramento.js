import { useEffect, useState } from 'react'
import { verificarSessao } from './Auth'
import { buscarRegistros } from './dashboard'

export default function useMonitoramento(limite) {
  const [nome, setNome] = useState('Usuário')
  const [registros, setRegistros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const controle = { timer: null }
    async function atualizar() {
      try {
        const [sessao, leituras] = await Promise.all([
          verificarSessao({ signal: controller.signal }),
          buscarRegistros(limite, { signal: controller.signal }),
        ])
        if (controller.signal.aborted) return
        setNome(sessao.user?.name?.trim() || 'Usuário')
        setRegistros(leituras)
        setErro('')
      } catch {
        if (!controller.signal.aborted) setErro('Não foi possível atualizar os dados. Tentaremos novamente em instantes.')
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false)
          controle.timer = setTimeout(atualizar, 10_000)
        }
      }
    }
    atualizar()
    return () => {
      controller.abort()
      clearTimeout(controle.timer)
    }
  }, [limite])

  return { nome, registros, carregando, erro }
}
