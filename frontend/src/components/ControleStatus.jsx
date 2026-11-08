import Icon from './DashboardIcon'
import { formatarDataColeta, formatarDataHoraColeta, formatarValor } from './dashboard'

export default function ControleStatus({ leitura, carregando = false }) {
  const medidas = [
    { campo: 'temperatura', titulo: 'Temperatura', unidade: '°C', icone: 'temperature', ideal: '20 a 30 °C', baixo: 'Baixa', alto: 'Alta' },
    { campo: 'umidade', titulo: 'Umidade do ar', unidade: '%', icone: 'drop', ideal: '50 a 80%', baixo: 'Baixa', alto: 'Alta' },
  ]
  const irregulares = leitura ? medidas.filter(({ campo }) => leitura[`status_${campo}`] !== 'ideal') : []
  const estado = !leitura ? 'empty' : irregulares.length ? 'alert' : 'ok'

  return <section className="control-conditions" aria-labelledby="control-conditions-title">
    <div className={`control-alert control-alert--${estado}`}>
      <span className="control-alert-icon"><Icon name={!leitura ? 'layers' : irregulares.length ? 'warning' : 'check'} /></span>
      <div>
        <h2 id="control-conditions-title">{!leitura ? 'Aguardando leitura dos sensores' : irregulares.length ? 'Irregularidades identificadas' : 'Condições dentro da faixa ideal'}</h2>
        <p>{!leitura ? carregando ? 'Carregando as condições da lavoura...' : 'Nenhuma leitura disponível para avaliar as condições.' : irregulares.length ? `${irregulares.length === 1 ? 'Uma medida está' : 'Duas medidas estão'} fora da faixa ideal. Confira os detalhes abaixo.` : 'Temperatura e umidade estão dentro das faixas ideais.'}</p>
      </div>
      {leitura && <span className="control-condition-badge">{irregulares.length ? 'Atenção' : 'Regular'}</span>}
    </div>
    <div className="control-sensors">
      {medidas.map(({ campo, titulo, unidade, icone, ideal, baixo, alto }) => {
        const status = leitura?.[`status_${campo}`]
        return <article key={campo} className={`dash-card control-sensor${leitura && status !== 'ideal' ? ' control-sensor--alert' : ''}`}>
          <span className="dash-card-icon"><Icon name={icone} /></span>
          <div className="control-sensor-content">
            <h3>{titulo}</h3>
            <div className="control-sensor-value"><strong>{leitura ? `${formatarValor(leitura[campo])}${unidade}` : '—'}</strong>
              {leitura && <span className={`dash-badge dash-badge--${status === 'ideal' ? 'ok' : 'alert'}`}>{status === 'ideal' ? 'Ideal' : status === 'baixo' ? baixo : alto}</span>}
            </div>
            <p>Faixa ideal: {ideal}</p>
          </div>
        </article>
      })}
    </div>
    {leitura && <p className="control-last-reading">Última leitura: <time dateTime={leitura.recebido_em}>{formatarDataColeta(leitura.recebido_em)} às {formatarDataHoraColeta(leitura.recebido_em).hora}</time></p>}
  </section>
}
