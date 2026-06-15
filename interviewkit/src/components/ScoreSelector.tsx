import { useRef, useState } from 'react'

interface ScoreSelectorProps {
  value: number | undefined
  onChange: (v: number | undefined) => void
  /** Taille des cases. */
  size?: 'sm' | 'lg'
}

const NOTES = [1, 2, 3, 4, 5]

/**
 * Sélecteur de note 1 à 5 — cases cliquables, vides par défaut.
 * Navigation clavier : flèches gauche/droite (et haut/bas) pour se déplacer entre
 * les notes, Entrée ou Espace pour valider la note sélectionnée (activation native
 * du bouton focalisé). Pattern « roving tabindex » pour l'accessibilité.
 */
export default function ScoreSelector({
  value,
  onChange,
  size = 'sm',
}: ScoreSelectorProps) {
  const box = size === 'lg' ? 'h-11 w-11 text-base' : 'h-7 w-7 text-xs'

  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
  // Index du bouton actuellement focalisable (0 à 4).
  const [focusIndex, setFocusIndex] = useState<number>(
    value ? value - 1 : 0,
  )

  const moveFocus = (next: number) => {
    const i = Math.max(0, Math.min(NOTES.length - 1, next))
    setFocusIndex(i)
    btnRefs.current[i]?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        moveFocus(focusIndex + 1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        moveFocus(focusIndex - 1)
        break
      case 'Home':
        e.preventDefault()
        moveFocus(0)
        break
      case 'End':
        e.preventDefault()
        moveFocus(NOTES.length - 1)
        break
      // Entrée / Espace : géré nativement par le <button> focalisé → onClick.
    }
  }

  return (
    <div
      className="flex shrink-0 gap-1.5"
      role="group"
      aria-label="Note de 1 à 5"
      onKeyDown={handleKeyDown}
    >
      {NOTES.map((n, i) => {
        const selected = value === n
        return (
          <button
            key={n}
            ref={(el) => {
              btnRefs.current[i] = el
            }}
            type="button"
            tabIndex={focusIndex === i ? 0 : -1}
            onFocus={() => setFocusIndex(i)}
            onClick={() => onChange(selected ? undefined : n)}
            aria-pressed={selected}
            aria-label={`Noter ${n} sur 5`}
            title={`Noter ${n}/5`}
            className={`score-box flex items-center justify-center rounded-md border font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${box} ${
              selected
                ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                : 'border-slate-300 bg-white text-slate-400 hover:border-brand-400 hover:text-brand-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
