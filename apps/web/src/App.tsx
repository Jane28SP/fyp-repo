import { useState } from 'react'
import './App.css'
import { EventsList } from './components/EventsList'

function App() {
  const [showEvents, setShowEvents] = useState(true)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7fafc' }}>
      <header style={{ 
        backgroundColor: '#4a5568', 
        color: 'white', 
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0 }}>FYP Event Manager</h1>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>Web + Mobile Demo</p>
      </header>
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => setShowEvents(!showEvents)}
            style={{
              padding: '10px 20px',
              backgroundColor: showEvents ? '#48bb78' : '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {showEvents ? '✓ Events View' : 'Show Events'}
          </button>
        </div>

        {showEvents ? (
          <EventsList />
        ) : (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2>Welcome to FYP Demo</h2>
            <p>Click "Show Events" to see the events list from Supabase</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
