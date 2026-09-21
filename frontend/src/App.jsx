import React from 'react'
import Calculator from './components/Calculator'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Calculator</h1>
        <p className="app-subtitle">Powered by React &amp; Go</p>
      </header>
      <main>
        <Calculator />
      </main>
    </div>
  )
}

export default App
