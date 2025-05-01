import React from 'react'
import { BrowserRouter as Router , Routes, Route } from 'react-router-dom';
import Home from './auth/pages/Home';
import Form from './auth/pages/Form';
import Dashboard from './auth/pages/Dashboard';

function App() {

  return (
    <Router>
      <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/form' element={<Form/>}/>
          <Route path='/dashboard' element={<Dashboard/>}/>
      </Routes>
    </Router>
  )
}

export default App
