import { useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'; // Add this import
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import "./index.css"
import MultiStepForm from './components/MultiStepForm/MultiStepForm'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router> {/* Wrap your app with Router */}
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <MultiStepForm />
      </div>
    </Router>
  )
}

export default App