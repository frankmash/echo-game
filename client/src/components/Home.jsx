import { useState } from 'react'
import socket from '../socket'
import s from './Home.module.css'

export default function Home({ navigate }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const create = () => {
    if (!name.trim()) { setError('Enter your name'); return }
    setLoading(true)
    socket.emit('create_room', { playerName: name.trim() }, (res) => {
      setLoading(false)
      if (res.error) { setError(res.error); return }
      navigate('lobby', { playerName: name.trim(), room: res.room })
    })
  }

  const join = () => {
    if (!name.trim()) { setError('Enter your name'); return }
    if (!code.trim()) { setError('Enter a room code'); return }
    setLoading(true)
    socket.emit('join_room', { playerName: name.trim(), code: code.trim().toUpperCase() }, (res) => {
      setLoading(false)
      if (res.error) { setError(res.error); return }
      navigate('lobby', { playerName: name.trim(), room: res.room })
    })
  }

  return (
    <div className={s.page}>
      <div className={s.grid} />
      <div className={s.content}>
        <div className={s.logo}>Echo</div>
        <div className={s.tagline}>The word chain game that starts arguments</div>

        <div className={s.card}>
          {error && <div className={s.error}>{error}</div>}
          <input
            type="text" placeholder="your name" value={name} maxLength={20} autoFocus
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && create()}
          />
          <button className="btn-primary" onClick={create} disabled={loading}>
            {loading ? 'Creating...' : 'Create Room'}
          </button>
          <div className={s.or}>— or join —</div>
          <input
            type="text" placeholder="room code" value={code} maxLength={6}
            style={{ textTransform: 'uppercase' }}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && join()}
          />
          <button className="btn-secondary" onClick={join} disabled={loading}>
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        <div className={s.features}>
          <div className={s.feature}><span>⚡</span> Power-ups</div>
          <div className={s.feature}><span>🔥</span> Streak bonuses</div>
          <div className={s.feature}><span>🎯</span> Round themes</div>
          <div className={s.feature}><span>⏱</span> 15s turns</div>
        </div>
      </div>
    </div>
  )
}
