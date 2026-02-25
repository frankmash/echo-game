import { useState } from 'react'
import Home from './components/Home'
import Lobby from './components/Lobby'
import GameRoom from './components/GameRoom'
import Results from './components/Results'

export default function App() {
  const [screen, setScreen] = useState('home') // home | lobby | game | results
  const [playerName, setPlayerName] = useState('')
  const [roomData, setRoomData] = useState(null)

  const navigate = (to, data = {}) => {
    if (data.room) setRoomData(data.room)
    if (data.playerName) setPlayerName(data.playerName)
    setScreen(to)
  }

  return (
    <>
      {screen === 'home' && <Home navigate={navigate} />}
      {screen === 'lobby' && <Lobby navigate={navigate} playerName={playerName} room={roomData} setRoom={setRoomData} />}
      {screen === 'game' && <GameRoom navigate={navigate} playerName={playerName} room={roomData} setRoom={setRoomData} />}
      {screen === 'results' && <Results navigate={navigate} playerName={playerName} room={roomData} />}
    </>
  )
}
