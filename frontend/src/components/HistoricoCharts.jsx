import Icon from './DashboardIcon'
import { escalaGrafico, formatarDataColeta, formatarDataHoraColeta, formatarValor } from './dashboard'

function HistoryChart({ registros, medida, unidade, titulo }) {
  const { min, max, step } = escalaGrafico(registros.map((registro) => registro[medida]))
  const x = (index) => registros.length === 1 ? 404 : 74 + index * 658 / (registros.length - 1)
  const y = (valor) => 234 - (valor - min) / (max - min) * 204
  const pontos = registros.map((registro, index) => `${x(index)},${y(registro[medida])}`).join(' ')
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, index) => min + index * step)
  const totalLegendas = Math.min(registros.length, 10)
  const legendas = new Set(Array.from({ length: totalLegendas }, (_, index) => totalLegendas === 1 ? 0 : Math.round(index * (registros.length - 1) / (totalLegendas - 1))))

  return <div className="history-chart-scroll" role="region" aria-label={`Gráfico de ${titulo.toLowerCase()}`} tabIndex={0}>
    <svg className={`history-chart${registros.length > 10 ? ' history-chart--wide' : ''}`} viewBox="0 0 760 300" role="img"
      aria-label={`${titulo}: ${registros.map((registro) => `${formatarValor(registro[medida])}${unidade} em ${formatarDataColeta(registro.recebido_em)} às ${formatarDataHoraColeta(registro.recebido_em).hora}`).join(', ')}`}>
      <defs><linearGradient id={`history-area-${medida}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="currentColor" stopOpacity=".25" />
        <stop offset="100%" stopColor="currentColor" stopOpacity=".04" />
      </linearGradient></defs>
      {ticks.map((tick, index) => <g key={index}>
        <line className="dash-gridline" x1="58" x2="748" y1={y(tick)} y2={y(tick)} />
        <text className="history-axis-label" x="49" y={y(tick) + 5} textAnchor="end">{formatarValor(tick)}{unidade}</text>
      </g>)}
      {registros.length > 1 && <path d={`M${x(0)},234 L${pontos.replaceAll(' ', ' L')} L${x(registros.length - 1)},234 Z`} fill={`url(#history-area-${medida})`} />}
      <path className="dash-axis" d="M58 20V234H748" />
      {registros.length > 1 && <polyline points={pontos} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round" />}
      {registros.map((registro, index) => {
        const { data, hora } = formatarDataHoraColeta(registro.recebido_em)
        return <g key={registro.id}>
          <title>{`${formatarDataColeta(registro.recebido_em)} ${hora}: ${formatarValor(registro[medida])}${unidade}`}</title>
          <circle className="history-point" cx={x(index)} cy={y(registro[medida])} r="4" fill="white" stroke="currentColor" strokeWidth="2.4" />
          <text className="history-value-label" x={x(index)} y={Math.max(16, y(registro[medida]) - (index % 2 === 0 ? 12 : 30))} textAnchor="middle">{formatarValor(registro[medida])}{unidade}</text>
          {legendas.has(index) && <>
            <line className="dash-tick" x1={x(index)} x2={x(index)} y1="234" y2="240" />
            <text className="history-date-label" x={x(index)} y="262" textAnchor="middle"><tspan x={x(index)}>{data}</tspan><tspan x={x(index)} dy="19">{hora}</tspan></text>
          </>}
        </g>
      })}
    </svg>
  </div>
}

export default function HistoricoCharts({ registros, carregando = false }) {
  return <div className="history-charts">
    {[{ medida: 'umidade', titulo: 'Umidade do ar', icone: 'drop', unidade: '%' },
      { medida: 'temperatura', titulo: 'Temperatura', icone: 'temperature', unidade: '°C' }].map(({ medida, titulo, icone, unidade }) => <section className="dash-card history-card" key={medida} aria-labelledby={`history-${medida}-title`}>
      <div className="dash-card-heading"><span className="dash-card-icon"><Icon name={icone} /></span><h2 id={`history-${medida}-title`}>{titulo}</h2></div>
      <p className="history-records-label">{registros.length ? `Últimos ${registros.length} ${registros.length === 1 ? 'registro' : 'registros'}` : carregando ? 'Carregando leituras...' : 'Nenhuma leitura disponível.'}</p>
      {registros.length > 0 && <HistoryChart registros={registros} medida={medida} unidade={unidade} titulo={titulo} />}
    </section>)}
  </div>
}
