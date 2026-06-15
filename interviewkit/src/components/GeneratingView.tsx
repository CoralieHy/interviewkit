import DOMPurify from 'dompurify'
import type { InterviewKit } from '../types'
import { CATEGORIES } from '../types'

interface GeneratingViewProps {
  partial: Partial<InterviewKit> | null
}

function clean(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

/**
 * Écran de chargement : squelettes par catégorie qui se remplissent au fur et à
 * mesure que les questions arrivent en streaming (effet typing).
 */
export default function GeneratingView({ partial }: GeneratingViewProps) {
  // Dernière catégorie ayant reçu au moins une question (pour y placer le curseur).
  const lastFilledIndex = CATEGORIES.reduce(
    (acc, cat, i) => ((partial?.[cat.key]?.length ?? 0) > 0 ? i : acc),
    -1,
  )

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400"
        role="status"
        aria-live="polite"
      >
        <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-100 border-t-brand-500 dark:border-slate-700 dark:border-t-brand-400" />
        Génération en cours…
      </div>

      {CATEGORIES.map((cat, ci) => {
        const questions = partial?.[cat.key] ?? []
        const isCursorCat = ci === lastFilledIndex
        return (
          <section
            key={cat.key}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-700/60">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {cat.label}
              </h3>
            </div>
            <ol className="space-y-3">
              {Array.from({ length: cat.expectedCount }).map((_, i) => {
                const q = questions[i]
                const isLast = isCursorCat && i === questions.length - 1
                if (q !== undefined) {
                  return (
                    <li
                      key={i}
                      className="flex gap-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                    >
                      <span className="font-semibold text-brand-500 dark:text-brand-400">
                        {i + 1}.
                      </span>
                      <span>
                        {clean(q)}
                        {isLast && (
                          <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-brand-500 align-middle dark:bg-brand-400" />
                        )}
                      </span>
                    </li>
                  )
                }
                // Squelette pour les questions pas encore arrivées.
                return (
                  <li key={i} className="flex animate-pulse gap-2">
                    <span className="h-4 w-4 rounded bg-slate-100 dark:bg-slate-700" />
                    <span
                      className="h-4 rounded bg-slate-100 dark:bg-slate-700"
                      style={{ width: `${70 - i * 8}%` }}
                    />
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
