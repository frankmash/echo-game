import { useEffect, useState } from 'react'
import styles from './TurnTimer.module.css'
import { playTick, playTimerExpire } from '../sounds'

const TOTAL = 15

export default function TurnTimer({ active, onExpire, key: resetKey }) {
  const [remaining, setRemaining] = useState(TOTAL)

  useEffect(() => {
    setRemaining(TOTAL)
    if (!active) return
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          playTimerExpire()
          onExpire?.()
          return 0
        }
        playTick(prev <= 6 ? 1 : 0)
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [active, resetKey])

  const pct = (remaining / TOTAL) * 100
  const urgent = remaining <= 5
  const color = urgent ? 'var(--danger)' : remaining <= 9 ? 'var(--accent2)' : 'var(--accent)'

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div
          className={`${styles.fill} ${urgent ? styles.urgent : ''}`}
          style={{ width: `${pct}%`, background: color, transition: 'width 1s linear, background 0.3s' }}
        />
      </div>
      <span className={styles.num} style={{ color }}>{remaining}s</span>
    </div>
  )
}