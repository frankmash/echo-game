import { useEffect } from 'react'
import socket from '../socket'
import s from './Lobby.module.css'

export default function Lobby({ navigate, playerName, room, setRoom }) {
  const isHost = room?.host === playerName

  useEffect(() => {
    socket.on('room_updated', setRoom)
    socket.on('game_started', (r) => { setRoom(r); navigate('game', { room: r }) })
    return () => { socket.off('room_updated'); socket.off('game_started') }
  }, [])

  const start = () => {
    socket.emit('start_game', { code: room.code, playerName }, (res) => {
      if (res.error) alert(res.error)
    })
  }

  if (!room) return null

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <div className={s.codeLabel}>Room Code</div>
          <div className={s.code}>{room.code}</div>
        </div>
        <button className={s.copyBtn} onClick={() => navigator.clipboard.writeText(room.code)}>
          Copy
        </button>
      </div>

      <div className={s.label}>Players ({room.players.length})</div>
      <div className={s.list}>
        {room.players.map(p => (
          <div key={p.name} className={s.player}>
            <div className={s.dot} />
            <span>{p.name}</span>
            {p.name === room.host && <span className={s.host}>HOST</span>}
            {p.name === playerName && p.name !== room.host && <span className={s.you}>YOU</span>}
          </div>
        ))}
      </div>

      <div className={s.rules}>
        <div className={s.rulesTitle}>Rules</div>
        <div className={s.rulesList}>
          <div className={s.rule}><span className={s.ruleNum}>01</span> Each round has a theme — try to stay connected</div>
          <div className={s.rule}><span className={s.ruleNum}>02</span> Submit a word that links to the previous one</div>
          <div className={s.rule}><span className={s.ruleNum}>03</span> Everyone votes — rejected only if ALL vote no</div>
          <div className={s.rule}><span className={s.ruleNum}>04</span> 3 accepts in a row = streak bonus (+2 pts)</div>
          <div className={s.rule}><span className={s.ruleNum}>05</span> Each player has: Skip · Double · Challenge</div>
          <div className={s.rule}><span className={s.ruleNum}>06</span> You have 15s per turn or it auto-skips</div>
        </div>
      </div>

      {isHost
        ? <button className="btn-primary" onClick={start} disabled={room.players.length < 2}>
            {room.players.length < 2 ? 'Need 2+ players to start' : 'Start Game →'}
          </button>
        : <div className={s.waiting}>Waiting for <strong>{room.host}</strong> to start...</div>
      }
    </div>
  )
}
