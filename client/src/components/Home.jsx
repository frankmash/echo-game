import { useState } from 'react'
import socket from '../socket'
import styles from './Home.module.css'

export default function Home({ navigate }) {
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const createRoom = () => {
    if (!name.trim()) { setError('Enter your name first'); return }
    setLoading(true)
    socket.emit('create_room', { playerName: name.trim() }, (res) => {
      setLoading(false)
      if (res.error) { setError(res.error); return }
      navigate('lobby', { playerName: name.trim(), room: res.room })
    })
  }

  const joinRoom = () => {
    if (!name.trim()) { setError('Enter your name first'); return }
    if (!joinCode.trim()) { setError('Enter a room code'); return }
    setLoading(true)
    socket.emit('join_room', { playerName: name.trim(), code: joinCode.trim().toUpperCase() }, (res) => {
      setLoading(false)
      if (res.error) { setError(res.error); return }
      navigate('lobby', { playerName: name.trim(), room: res.room })
    })
  }

  return (
    <div className={styles.home}>
      <div className={styles.bgGrid} />
      <div className={styles.hero}>
        <div className={styles.logo}>Echo</div>
        <div className={styles.tagline}>The word chain game that starts debates</div>

        <div className={styles.card}>
          {error && <div className={styles.error}>{error}</div>}
          <input
            type="text"
            placeholder="your name"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && createRoom()}
            maxLength={20}
            autoFocus
          />
          <button className={styles.btn} onClick={createRoom} disabled={loading}>
            {loading ? 'Creating...' : 'Create Room'}
          </button>

          <div className={styles.divider}>or join existing</div>

          <input
            type="text"
            placeholder="room code"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
            maxLength={6}
          />
          <button className={`${styles.btn} ${styles.secondary}`} onClick={joinRoom} disabled={loading}>
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        <p className={styles.subtext}>
          One word leads to another. But does it <em>really?</em><br />
          Vote with your friends. Argue. Be wrong together.
        </p>
      </div>
    </div>
  )
}
