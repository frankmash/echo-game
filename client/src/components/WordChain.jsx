import styles from './WordChain.module.css'

export default function WordChain({ chain, pendingWord }) {
  return (
    <div className={styles.container}>
      <div className={styles.label}>Word Chain</div>
      <div className={styles.words}>
        {chain.length === 0 && !pendingWord && (
          <span className={styles.empty}>Waiting for first word...</span>
        )}
        {chain.map((entry, i) => (
          <span key={i} className={styles.wordGroup}>
            {i > 0 && <span className={styles.arrow}>→</span>}
            <span className={`${styles.word} ${styles[entry.status]}`}>
              {entry.word}
            </span>
          </span>
        ))}
        {pendingWord && (
          <span className={styles.wordGroup}>
            {chain.length > 0 && <span className={styles.arrow}>→</span>}
            <span className={`${styles.word} ${styles.pending}`}>{pendingWord}</span>
          </span>
        )}
      </div>
    </div>
  )
}
