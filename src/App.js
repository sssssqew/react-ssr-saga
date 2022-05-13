import { Route } from 'react-router-dom'
import Menu from './components/Menu'
import loadable from '@loadable/component' 

// 코드 스플리팅 
const RedPage = loadable(() => import('./pages/RedPage'))
const BluePage = loadable(() => import('./pages/BluePage'))
const UsersPage = loadable(() => import('./pages/UsersPage'))

const App = () => {
  return (
    <div>
      <Menu/>
      <hr />
      <Route path='/red' component={RedPage}/>
      <Route path='/blue' component={BluePage}/>
      <Route path='/users' component={UsersPage}/>
    </div>
  )
}

export default App