import { useEffect } from 'react'
import socket from '../socket'
import styles from './Lobby.module.css'

export default function Lobby({ navigate, playerName, room, setRoom }) {
  const isHost = room?.host === playerName

  useEffect(() => {
    socket.on('room_updated', (updatedRoom) => {
      setRoom(updatedRoom)
    })
    socket.on('game_started', (updatedRoom) => {
      setRoom(updatedRoom)
      navigate('game', { room: updatedRoom })
    })
    return () => {
      socket.off('room_updated')
      socket.off('game_started')
    }
  }, [])

  const copyCode = () => {
    navigator.clipboard.writeText(room.code)
  }

  const startGame = () => {
    socket.emit('start_game', { code: room.code, playerName }, (res) => {
      if (res.error) alert(res.error)
    })
  }

  if (!room) return null

  return (
    <div className={styles.lobby}>
      <div className={styles.header}>
        <div>
          <div className={styles.codeLabel}>Room Code</div>
          <div className={styles.roomCode}>{room.code}</div>
        </div>
        <button className={styles.copyBtn} onClick={copyCode}>Copy Code</button>
      </div>

      <div className={styles.sectionLabel}>
        Players ({room.players.length})
      </div>

      <div className={styles.playerList}>
        {room.players.map(p => (
          <div key={p.name} className={styles.playerItem}>
            <div className={styles.dot} />
            <span>{p.name}</span>
            {p.name === room.host && <span className={styles.hostBadge}>HOST</span>}
            {p.name === playerName && <span className={styles.youBadge}>YOU</span>}
          </div>
        ))}
      </div>

      <div className={styles.howTo}>
        <strong>How to Play</strong>
        <ol>
          <li>One player submits a word</li>
          <li>Next player submits a connected word</li>
          <li>Everyone votes: does it connect?</li>
          <li>Defend your logic. Sway the group.</li>
          <li>Win points for accepted connections</li>
        </ol>
      </div>

      {isHost ? (
        <button className={styles.startBtn} onClick={startGame} disabled={room.players.length < 2}>
          {room.players.length < 2 ? 'Need 2+ players' : 'Start Game →'}
        </button>
      ) : (
        <div className={styles.waiting}>Waiting for host to start the game...</div>
      )}
    </div>
  )
}
