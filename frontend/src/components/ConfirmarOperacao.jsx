import { useEffect, useId, useRef } from 'react'
import Icon from './DashboardIcon'

export default function ConfirmarOperacao({ titulo, children, confirmar, cancelar, icone = 'clock', textoConfirmar = 'Confirmar', textoCancelar = 'Voltar' }) {
  const dialogo = useRef(null)
  const id = useId()
  useEffect(() => {
    const elemento = dialogo.current
    elemento.showModal()
    return () => elemento.close()
  }, [])

  return <dialog ref={dialogo} className="control-confirm-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={(event) => {
    event.preventDefault()
    cancelar()
  }}>
    <span className="dash-card-icon"><Icon name={icone} /></span>
    <h3 id={`${id}-title`}>{titulo}</h3>
    <div id={`${id}-description`}>{children}</div>
    <div className="control-confirm-actions">
      <button type="button" className="control-secondary-button" onClick={cancelar}>{textoCancelar}</button>
      <button type="button" className="control-primary-button" onClick={confirmar}>{textoConfirmar}</button>
    </div>
  </dialog>
}
