import type { CategoryKey } from '../types'

interface QuestionActionsProps {
  catKey: CategoryKey
  index: number
  onDelete: (catKey: CategoryKey, index: number) => void
  onRegenerate: (catKey: CategoryKey, index: number) => void
  regenerating: boolean
  size?: 'sm' | 'lg'
}

/** Boutons par question : régénérer (IA) et supprimer. Non imprimés. */
export default function QuestionActions({
  catKey,
  index,
  onDelete,
  onRegenerate,
  regenerating,
  size = 'sm',
}: QuestionActionsProps) {
  const btn = size === 'lg' ? 'h-10 w-10' : 'h-7 w-7'
  const icon = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  const base = `inline-flex ${btn} items-center justify-center rounded-md border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50`

  return (
    <div className="no-print flex items-center gap-1">
      <button
        type="button"
        onClick={() => onRegenerate(catKey, index)}
        disabled={regenerating}
        aria-label="Régénérer cette question via l'IA"
        title="Régénérer cette question"
        className={`${base} border-slate-200 text-slate-400 hover:border-brand-400 hover:text-brand-500 dark:border-slate-600 dark:text-slate-400 dark:hover:text-brand-300`}
      >
        {regenerating ? (
          <span
            className={`${icon} animate-spin rounded-full border-2 border-brand-200 border-t-brand-500`}
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            className={icon}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v5h-5" />
          </svg>
        )}
      </button>
      <button
        type="button"
        onClick={() => onDelete(catKey, index)}
        disabled={regenerating}
        aria-label="Supprimer cette question"
        title="Supprimer cette question"
        className={`${base} border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 dark:border-slate-600 dark:text-slate-400 dark:hover:text-red-400`}
      >
        <svg
          viewBox="0 0 24 24"
          className={icon}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
        </svg>
      </button>
    </div>
  )
}
