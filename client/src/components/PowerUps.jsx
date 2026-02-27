import s from './PowerUps.module.css'

const POWERUPS = [
  { key: 'skip',      icon: '⏭',  label: 'Skip',      color: '--blue',   desc: 'Skip the current player\'s turn' },
  { key: 'double',    icon: '✕2',  label: 'Double',    color: '--orange', desc: 'Your next word scores 2x points' },
  { key: 'challenge', icon: '⚔',  label: 'Challenge', color: '--danger', desc: 'Force a re-vote on the last accepted word' },
]

export default function PowerUps({ myPlayer, isMyTurn, votingActive, onUse }) {
  if (!myPlayer) return null

  return (
    <div className={s.row}>
      {POWERUPS.map(p => {
        const count = myPlayer.powerups?.[p.key] ?? 0
        const disabled = count === 0
          || (p.key === 'skip' && (isMyTurn || votingActive))
          || (p.key === 'double' && (!isMyTurn || votingActive || myPlayer.doubleActive))
          || (p.key === 'challenge' && votingActive)

        return (
          <button
            key={p.key}
            className={`${s.btn} ${disabled ? s.disabled : ''} ${myPlayer.doubleActive && p.key === 'double' ? s.active : ''}`}
            style={{ '--color': `var(${p.color})` }}
            onClick={() => !disabled && onUse(p.key)}
            title={p.desc}
            disabled={disabled}
          >
            <span className={s.icon}>{p.icon}</span>
            <span className={s.label}>{p.label}</span>
            <span className={s.count}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}
