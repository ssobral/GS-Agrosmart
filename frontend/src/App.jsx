import Login from './pages/Login'
import Inicial from './pages/Inicial'
import Sobre from './pages/Sobre'
import NovosClientes from './pages/NovosClientes'
import Dashboard from './pages/Dashboard'
import Historico from './pages/Historico'
import Controle from './pages/Controle'
import ContateNos from './pages/ContateNos'
import RequireAuth from './components/RequireAuth'
import { paginaPublica } from './components/Auth'

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/login') {
    return <Login />
  }

  if (path === '/sobre') {
    return <Sobre />
  }

  if (path === '/novos-clientes') {
    return <NovosClientes />
  }

  if (paginaPublica(path)) {
    return <Inicial />
  }

  return <RequireAuth>
    {path === '/dashboard' ? <Dashboard /> : path === '/historico' ? <Historico /> : path === '/controle' ? <Controle /> : path === '/contato' ? <ContateNos /> : <p>Página não encontrada.</p>}
  </RequireAuth>
}
