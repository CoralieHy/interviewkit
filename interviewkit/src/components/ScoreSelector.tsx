interface ScoreSelectorProps {
  value: number | undefined
  onChange: (v: number | undefined) => void
  /** Taille des cases. */
  size?: 'sm' | 'lg'
}

/** Sélecteur de note 1 à 5 — cases cliquables, vides par défaut. */
export default function ScoreSelector({
  value,
  onChange,
  size = 'sm',
}: ScoreSelectorProps) {
  const box =
    size === 'lg' ? 'h-11 w-11 text-base' : 'h-7 w-7 text-xs'
  return (
    <div className="flex shrink-0 gap-1.5" role="group" aria-label="Note de 1 à 5">
      {[1, 2, 3, 4, 5].map((n) => {
        const selected = value === n
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(selected ? undefined : n)}
            aria-pressed={selected}
            title={`Noter ${n}/5`}
            className={`score-box flex items-center justify-center rounded-md border font-semibold transition ${box} ${
              selected
                ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                : 'border-slate-300 bg-white text-slate-400 hover:border-brand-400 hover:text-brand-500'
            }`}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
