import { useState, useEffect, useRef } from 'react'
import socket from '../socket'
import WordChain from './WordChain'
import VotingPanel from './VotingPanel'
import TurnTimer from './TurnTimer'
import styles from './GameRoom.module.css'

export default function GameRoom({ navigate, playerName, room, setRoom }) {
  const [word, setWord] = useState('')
  const [explanation, setExplanation] = useState('')
  const [toast, setToast] = useState(null)
  const [timerKey, setTimerKey] = useState(0)
  const wordInputRef = useRef()

  const currentPlayer = room?.players[room?.currentTurnIndex]
  const isMyTurn = currentPlayer?.name === playerName && !room?.votingActive
  const me = room?.players.find(p => p.name === playerName)

  useEffect(() => {
    const handlers = {
      voting_started: (r) => { setRoom(r); setTimerKey(k => k + 1) },
      vote_updated: (r) => setRoom(r),
      vote_challenged: ({ playerName: challenger, room: r }) => {
        setRoom(r)
        showToast(`⚠️ ${challenger} challenged! Re-vote now.`, 'warning')
        setTimerKey(k => k + 1)
      },
      vote_resolved: ({ result, room: r }) => {
        setRoom(r)
        setTimerKey(k => k + 1)
        if (result.accepted) {
          let msg = `✓ "${result.entry.word}" accepted!`
          if (result.streakBonus) msg += ` 🔥 Streak bonus +${result.streakBonus}!`
          if (result.pointsEarned > 1) msg += ` ✦ Double points!`
          showToast(msg, 'success')
        } else {
          showToast(`✗ "${result.entry.word}" rejected unanimously`, 'error')
        }
      },
      player_skipped: ({ player, room: r }) => {
        setRoom(r)
        setTimerKey(k => k + 1)
        showToast(`⏭ ${player} took too long — skipped!`, 'warning')
      },
      powerup_used: ({ playerName: who, powerupId, room: r }) => {
        setRoom(r)
        const labels = { skip: 'Skip', double: '2x Points', challenge: 'Challenge' }
        showToast(`${who} used ${labels[powerupId] || powerupId}`, 'info')
      },
      game_over: (r) => { setRoom(r); navigate('results', { room: r }) },
    }
    Object.entries(handlers).forEach(([ev, fn]) => socket.on(ev, fn))
    return () => Object.keys(handlers).forEach(ev => socket.off(ev))
  }, [])

  useEffect(() => {
    if (isMyTurn) setTimeout(() => wordInputRef.current?.focus(), 150)
  }, [room?.currentTurnIndex, room?.votingActive])

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const submitWord = () => {
    if (!word.trim()) { showToast('Type a word first', 'error'); return }
    socket.emit('submit_word', { code: room.code, playerName, word: word.trim(), explanation: explanation.trim() || null }, (res) => {
      if (res.error) { showToast(res.error, 'error'); return }
      setWord('')
      setExplanation('')
    })
  }

  const castVote = (vote) => {
    socket.emit('cast_vote', { code: room.code, playerName, vote }, (res) => {
      if (res.error) showToast(res.error, 'error')
    })
  }

  const challenge = () => {
    socket.emit('use_powerup', { code: room.code, playerName, powerupId: 'challenge' }, (res) => {
      if (res.error) showToast(res.error, 'error')
    })
  }

  const usePowerup = (id) => {
    socket.emit('use_powerup', { code: room.code, playerName, powerupId: id }, (res) => {
      if (res.error) showToast(res.error, 'error')
    })
  }

  const endGame = () => {
    if (!confirm('End the game?')) return
    socket.emit('end_game', { code: room.code, playerName }, (res) => {
      if (res.error) showToast(res.error, 'error')
    })
  }

  if (!room) return null

  return (
    <div className={styles.game}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.roundBadge}>Round {room.round} / {room.maxRounds}</div>
        {room.currentTheme && (
          <div className={styles.theme}>
            {room.currentTheme.emoji} {room.currentTheme.name}
            <span className={styles.themeHint}> — {room.currentTheme.hint}</span>
          </div>
        )}
        <div className={styles.code}>{room.code}</div>
      </div>

      {/* Players */}
      <div className={styles.playersBar}>
        {room.players.map((p, i) => (
          <div key={p.name} className={`${styles.chip} ${i === room.currentTurnIndex && !room.votingActive ? styles.activeChip : ''}`}>
            {i === room.currentTurnIndex && !room.votingActive && '▶ '}
            {p.name}
            {p.doubleActive && <span className={styles.doubleTag}>✦</span>}
            {p.streak >= 2 && <span className={styles.streakTag}>🔥{p.streak}</span>}
            <span className={styles.chipScore}>{p.score}</span>
          </div>
        ))}
      </div>

      <WordChain chain={room.chain} pendingWord={room.votingActive ? room.pendingWord : null} />

      {room.votingActive && (
        <VotingPanel room={room} playerName={playerName} onVote={castVote} onChallenge={challenge} />
      )}

      {/* Turn panel */}
      <div className={styles.turnPanel}>
        <div className={styles.turnTop}>
          <div>
            <div className={styles.turnLabel}>Current Turn</div>
            <div className={styles.turnPlayer}>
              {room.votingActive
                ? `Voting on ${room.pendingPlayer}'s word...`
                : isMyTurn ? '🟡 Your Turn!' : `${currentPlayer?.name}'s turn`}
            </div>
          </div>
          {!room.votingActive && (
            <TurnTimer active={!room.votingActive} key={timerKey} resetKey={timerKey} />
          )}
        </div>

        {isMyTurn && (
          <div className={styles.inputArea}>
            <div className={styles.wordRow}>
              <input
                ref={wordInputRef}
                type="text"
                placeholder="type your word..."
                value={word}
                onChange={e => setWord(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitWord()}
                maxLength={30}
              />
              <button className={styles.submitBtn} onClick={submitWord}>Submit</button>
            </div>
            <input
              type="text"
              placeholder="explain your connection (optional)..."
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              maxLength={100}
              className={styles.explInput}
            />

            {/* Power-ups for current player */}
            <div className={styles.powerups}>
              {me?.powerups?.skip > 0 && (
                <button className={styles.puBtn} onClick={() => usePowerup('skip')} title="Skip your turn">
                  ⏭ Skip
                </button>
              )}
              {me?.powerups?.double > 0 && !me?.doubleActive && (
                <button className={styles.puBtn} onClick={() => usePowerup('double')} title="Double your next accepted word's points">
                  ✦ 2x Points
                </button>
              )}
              {me?.doubleActive && (
                <span className={styles.puActive}>✦ 2x ARMED</span>
              )}
            </div>
          </div>
        )}
      </div>

      {room.host === playerName && (
        <button className={styles.endBtn} onClick={endGame}>End Game</button>
      )}

      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>{toast.msg}</div>
      )}
    </div>
  )
}
