import MonitoringLayout from '../components/MonitoringLayout'
import DashboardCards from '../components/DashboardCards'
import useMonitoramento from '../components/useMonitoramento'

export default function Dashboard() {
  const { nome, registros, carregando, erro } = useMonitoramento(5)
  return <MonitoringLayout activePage="dashboard" nome={nome} titulo="Dashboard de Monitoramento" subtitulo="Visão geral da operação agrícola em tempo real">
    {erro && <p className="dash-message" role="alert">{erro}{registros.length > 0 && ' Exibindo a última leitura recebida.'}</p>}
    <DashboardCards registros={registros} carregando={carregando} />
  </MonitoringLayout>
}
