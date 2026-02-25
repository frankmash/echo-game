import styles from './VotingPanel.module.css'

export default function VotingPanel({ room, playerName, onVote }) {
  const prevWord = room.chain.length > 0 ? room.chain[room.chain.length - 1].word : null
  const myVote = room.votes?.[playerName]
  const yes = Object.values(room.votes || {}).filter(v => v === 'yes').length
  const no = Object.values(room.votes || {}).filter(v => v === 'no').length
  const total = room.players.length

  return (
    <div className={styles.panel}>
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

      <div className={styles.buttons}>
        <button
          className={`${styles.voteBtn} ${styles.yes} ${myVote ? styles.voted : ''} ${myVote === 'yes' ? styles.active : ''}`}
          onClick={() => !myVote && onVote('yes')}
          disabled={!!myVote}
        >
          ✓ Connects
        </button>
        <button
          className={`${styles.voteBtn} ${styles.no} ${myVote ? styles.voted : ''} ${myVote === 'no' ? styles.active : ''}`}
          onClick={() => !myVote && onVote('no')}
          disabled={!!myVote}
        >
          ✗ Nope
        </button>
      </div>

      <div className={styles.tally}>
        <span className={styles.tallyYes}>{yes} yes</span>
        <span className={styles.tallyPending}>{total - yes - no} pending</span>
        <span className={styles.tallyNo}>{no} no</span>
      </div>
    </div>
  )
}
