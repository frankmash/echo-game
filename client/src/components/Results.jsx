import socket from '../socket'
import styles from './Results.module.css'

export default function Results({ navigate, playerName, room }) {
  if (!room) return null

  const sorted = [...room.players].sort((a, b) => b.score - a.score)
  const isHost = room.host === playerName
  const winner = sorted[0]
  const iWon = winner?.name === playerName

  const playAgain = () => {
    socket.emit('play_again', { code: room.code, playerName }, (res) => {
      if (res.error) { alert(res.error); return }
    })
    socket.once('game_started', (updatedRoom) => navigate('game', { room: updatedRoom }))
  }

  return (
    <div className={styles.results}>
      <div className={styles.inner}>
        <div className={styles.title}>{iWon ? '🏆 You Win!' : 'Game Over'}</div>
        <div className={styles.winnerLine}>
          {winner?.name === playerName ? 'Nicely played.' : `${winner?.name} takes the win with ${winner?.score} pts`}
        </div>

        <div className={styles.chainSection}>
          <div className={styles.sectionLabel}>The Full Chain</div>
          <div className={styles.chain}>
            {room.chain.length === 0
              ? <span className={styles.empty}>No words were played</span>
              : room.chain.map((entry, i) => (
                <span key={i} className={styles.group}>
                  {i > 0 && <span className={styles.arrow}>→</span>}
                  <span
                    className={`${styles.word} ${entry.status === 'accepted' ? styles.accepted : styles.rejected}`}
                    title={entry.explanation || ''}
                  >
                    {entry.word}
                    {entry.streakBonus > 0 && <sup>🔥</sup>}
                  </span>
                </span>
              ))}
          </div>
        </div>

        <div className={styles.sectionLabel}>Scores</div>
        <div className={styles.leaderboard}>
          {sorted.map((p, i) => (
            <div key={p.name} className={styles.row} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={`${styles.rank} ${i === 0 ? styles.first : ''}`}>#{i + 1}</div>
              <div className={styles.pname}>
                {p.name}
                {p.name === playerName && <span className={styles.you}> (you)</span>}
              </div>
              <div className={styles.score}>{p.score} pts</div>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          {isHost
            ? <button className={styles.btnPrimary} onClick={playAgain}>Play Again</button>
            : <div className={styles.waiting}>Waiting for host to restart...</div>}
          <button className={styles.btnSecondary} onClick={() => navigate('home')}>Home</button>
        </div>
      </div>
    </div>
  )
}
