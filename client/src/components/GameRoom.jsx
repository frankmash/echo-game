import { useState, useEffect, useRef } from 'react'
import socket from '../socket'
import WordChain from './WordChain'
import VotingPanel from './VotingPanel'
import styles from './GameRoom.module.css'

export default function GameRoom({ navigate, playerName, room, setRoom }) {
  const [word, setWord] = useState('')
  const [explanation, setExplanation] = useState('')
  const [toast, setToast] = useState('')
  const wordInputRef = useRef()

  const currentPlayer = room?.players[room?.currentTurnIndex]
  const isMyTurn = currentPlayer?.name === playerName

  useEffect(() => {
    socket.on('voting_started', (updatedRoom) => setRoom(updatedRoom))
    socket.on('vote_updated', (updatedRoom) => setRoom(updatedRoom))
    socket.on('vote_resolved', ({ result, room: updatedRoom }) => {
      setRoom(updatedRoom)
      showToast(result.accepted ? `✓ "${result.entry.word}" accepted!` : `✗ "${result.entry.word}" rejected`)
    })
    socket.on('game_over', (updatedRoom) => {
      setRoom(updatedRoom)
      navigate('results', { room: updatedRoom })
    })

    return () => {
      socket.off('voting_started')
      socket.off('vote_updated')
      socket.off('vote_resolved')
      socket.off('game_over')
    }
  }, [])

  useEffect(() => {
    if (isMyTurn && !room?.votingActive) {
      setTimeout(() => wordInputRef.current?.focus(), 100)
    }
  }, [room?.currentTurnIndex, room?.votingActive])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const submitWord = () => {
    if (!word.trim()) { showToast('Type a word first'); return }
    socket.emit('submit_word', {
      code: room.code,
      playerName,
      word: word.trim(),
      explanation: explanation.trim() || null,
    }, (res) => {
      if (res.error) { showToast(res.error); return }
      setWord('')
      setExplanation('')
    })
  }

  const castVote = (vote) => {
    socket.emit('cast_vote', { code: room.code, playerName, vote }, (res) => {
      if (res.error) showToast(res.error)
    })
  }

  const endGame = () => {
    if (!confirm('End the game now?')) return
    socket.emit('end_game', { code: room.code, playerName }, (res) => {
      if (res.error) showToast(res.error)
    })
  }

  if (!room) return null

  return (
    <div className={styles.game}>
      <div className={styles.header}>
        <div className={styles.roundBadge}>Round {room.round} / {room.maxRounds}</div>
        <div className={styles.code}>{room.code}</div>
      </div>

      {/* Players bar */}
      <div className={styles.playersBar}>
        {room.players.map((p, i) => (
          <div key={p.name} className={`${styles.chip} ${i === room.currentTurnIndex && !room.votingActive ? styles.activeChip : ''}`}>
            {i === room.currentTurnIndex && !room.votingActive && '▶ '}
            {p.name}
            <span className={styles.chipScore}>{p.score}</span>
          </div>
        ))}
      </div>

      <WordChain chain={room.chain} pendingWord={room.votingActive ? room.pendingWord : null} />

      {room.votingActive && (
        <VotingPanel room={room} playerName={playerName} onVote={castVote} />
      )}

      {/* Turn panel */}
      <div className={styles.turnPanel}>
        <div className={styles.turnLabel}>Current Turn</div>
        {room.votingActive ? (
          <div className={styles.turnPlayer}>Voting on {room.pendingPlayer}'s word...</div>
        ) : (
          <>
            <div className={styles.turnPlayer}>
              {isMyTurn ? '🟡 Your Turn!' : `${currentPlayer?.name}'s turn`}
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
              </div>
            )}
          </>
        )}
      </div>

      {room.host === playerName && (
        <button className={styles.endBtn} onClick={endGame}>End Game</button>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
