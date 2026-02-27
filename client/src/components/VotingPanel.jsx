import styles from './VotingPanel.module.css'

export default function VotingPanel({ room, playerName, onVote, onChallenge }) {
  const prevWord = room.chain.length > 0 ? room.chain[room.chain.length - 1].word : null
  const myVote = room.votes?.[playerName]
  const yes = Object.values(room.votes || {}).filter(v => v === 'yes').length
  const no = Object.values(room.votes || {}).filter(v => v === 'no').length
  const total = room.players.length
  const myPowerups = room.players.find(p => p.name === playerName)?.powerups || {}
  const canChallenge = myPowerups.challenge > 0 && !room.challenged && room.pendingPlayer !== playerName

  return (
    <div className={styles.panel}>
      {room.challenged && <div className={styles.challengeBanner}>⚠️ CHALLENGED — votes reset, re-vote now</div>}
      <div className={styles.question}>Does this connection make sense?</div>
      <div className={styles.words}>
        <span className={styles.wordA}>{prevWord || '(start)'}</span>
        <span className={styles.sep}>→</span>
        <span className={styles.wordB}>{room.pendingWord}</span>
      </div>

      {room.pendingExplanation && (
        <div className={styles.explanation}>
          <span className={styles.explLabel}>Explanation: </span>
          {room.pendingExplanation}
        </div>
      )}

      <div className={styles.hint}>Rejected only if <strong>everyone</strong> votes No</div>

      <div className={styles.buttons}>
        <button
          className={`${styles.voteBtn} ${styles.yes} ${myVote === 'yes' ? styles.activeYes : ''}`}
          onClick={() => !myVote && onVote('yes')}
          disabled={!!myVote}
        >✓ Connects</button>
        <button
          className={`${styles.voteBtn} ${styles.no} ${myVote === 'no' ? styles.activeNo : ''}`}
          onClick={() => !myVote && onVote('no')}
          disabled={!!myVote}
        >✗ Nope</button>
      </div>

      <div className={styles.tally}>
        <span className={styles.tallyYes}>{yes} yes</span>
        <span className={styles.tallyPending}>{total - yes - no} pending</span>
        <span className={styles.tallyNo}>{no} no</span>
      </div>

      {canChallenge && (
        <button className={styles.challengeBtn} onClick={onChallenge}>
          ⚠️ Challenge — force re-vote (uses your Challenge power-up)
        </button>
      )}
    </div>
  )
}
