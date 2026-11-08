import Icon from './DashboardIcon'
import { escalaGrafico, formatarDataColeta, formatarValor } from './dashboard'

function RecordChart({ registros, medida, unit, variant, label, ideal }) {
  const valores = registros.map((registro) => registro[medida])
  const { min, max, step } = escalaGrafico(valores)
  const x = (index) => registros.length === 1 ? 240 : 78 + index * 332 / (registros.length - 1)
  const y = (value) => 180 - ((value - min) / (max - min)) * 145
  const points = valores.map((value, index) => `${x(index)},${y(value)}`).join(' ')
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, index) => min + index * step)

  return <svg className={`dash-chart dash-chart--${variant} dash-chart--${ideal ? 'ok' : 'alert'}`} viewBox="0 0 450 225" role="img"
    aria-label={`${label}: ${registros.map((registro) => `${formatarValor(registro[medida])}${unit} em ${formatarDataColeta(registro.recebido_em)}`).join(', ')}`}>
    <defs>
      <linearGradient id={`dash-area-${variant}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="currentColor" stopOpacity=".25" />
        <stop offset="100%" stopColor="currentColor" stopOpacity=".07" />
      </linearGradient>
    </defs>
    {ticks.map((tick, index) => <g key={index}>
      <line className="dash-gridline" x1="58" x2="430" y1={y(tick)} y2={y(tick)} />
      <text className="dash-axis-label" x="49" y={y(tick) + 5} textAnchor="end">{formatarValor(tick)}{unit}</text>
    </g>)}
    {registros.length > 1 && <path d={`M${x(0)},180 L${points.replaceAll(' ', ' L')} L${x(registros.length - 1)},180 Z`} fill={`url(#dash-area-${variant})`} />}
    <path className="dash-axis" d="M58 20V180H430" />
    {registros.length > 1 && <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />}
    {registros.map((registro, index) => <g key={registro.id}>
      <title>{`${formatarDataColeta(registro.recebido_em)}: ${formatarValor(registro[medida])}${unit}`}</title>
      <line className="dash-tick" x1={x(index)} x2={x(index)} y1="180" y2="186" />
      <circle cx={x(index)} cy={y(registro[medida])} r="4.4" fill="white" stroke="currentColor" strokeWidth="2.5" />
      <text className="dash-value-label" x={x(index)} y={y(registro[medida]) - 14} textAnchor="middle">{formatarValor(registro[medida])}{unit}</text>
      <text className="dash-date-label" x={x(index)} y="211" textAnchor="middle">{formatarDataColeta(registro.recebido_em)}</text>
    </g>)}
  </svg>
}

function ReadingCard({ registros, medida, titulo, icon, unit, variant, carregando }) {
  const ultima = registros.at(-1)
  const ideal = ultima?.[`status_${medida}`] === 'ideal'
  return <section className="dash-card" aria-labelledby={`dash-${variant}-title`}>
    <div className="dash-card-heading"><span className="dash-card-icon"><Icon name={icon} /></span><h2 id={`dash-${variant}-title`}>{titulo}</h2></div>
    <div className="dash-reading">
      <strong>{ultima ? `${formatarValor(ultima[medida])}${unit}` : '—'}</strong>
      {ultima && <span className={`dash-badge dash-badge--${ideal ? 'ok' : 'alert'}`}>
        {ideal ? <span className="dash-check"><Icon name="check" /></span> : <Icon name="warning" />}
        {ideal ? 'OK' : 'Irregular'}
      </span>}
    </div>
    <p className="dash-records-label">{registros.length ? `Últimos ${registros.length} ${registros.length === 1 ? 'registro' : 'registros'}` : carregando ? 'Carregando leituras...' : 'Nenhuma leitura disponível.'}</p>
    {ultima && <RecordChart registros={registros} medida={medida} unit={unit} variant={variant} label={`Registros de ${titulo.toLowerCase()}`} ideal={ideal} />}
  </section>
}

export default function DashboardCards({ registros, carregando = false }) {
  const ultima = registros.at(-1)
  const irregular = ultima && (ultima.status_temperatura !== 'ideal' || ultima.status_umidade !== 'ideal')
  const mensagens = []
  if (ultima && ultima.status_temperatura !== 'ideal') mensagens.push(`Temperatura ${ultima.status_temperatura === 'baixo' ? 'abaixo' : 'acima'} da faixa ideal.`)
  if (ultima && ultima.status_umidade !== 'ideal') mensagens.push(`Umidade do ar ${ultima.status_umidade === 'baixo' ? 'abaixo' : 'acima'} da faixa ideal.`)
  const estado = !ultima ? 'empty' : irregular ? 'alert' : 'ok'

  return <div className="dash-cards">
    <section className="dash-card dash-status" aria-labelledby="dash-status-title">
      <div className="dash-card-heading"><span className="dash-card-icon"><Icon name="layers" /></span><h2 id="dash-status-title">Status Geral</h2></div>
      <div className={`dash-status-panel dash-status-panel--${estado}`}>
        <span className="dash-status-icon"><Icon name={!ultima ? 'layers' : irregular ? 'warning' : 'check'} /></span>
        <strong>{!ultima ? 'Sem dados' : irregular ? 'Irregular' : 'Regular'}</strong>
        <p>{!ultima ? carregando ? 'Aguardando as leituras dos sensores.' : 'Nenhuma leitura disponível.' : irregular ? mensagens.join(' ') : 'Temperatura e umidade dentro da faixa ideal.'}</p>
      </div>
    </section>
    <ReadingCard registros={registros} medida="umidade" titulo="Umidade do ar" icon="drop" unit="%" variant="humidity" carregando={carregando} />
    <ReadingCard registros={registros} medida="temperatura" titulo="Temperatura" icon="temperature" unit="°C" variant="temperature" carregando={carregando} />
  </div>
}
