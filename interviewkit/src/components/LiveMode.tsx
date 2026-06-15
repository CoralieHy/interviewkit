import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import type { KitRecord } from '../types'
import { CATEGORIES } from '../types'
import { questionId } from '../scoring'
import ScoreSelector from './ScoreSelector'
import AutoTextarea from './AutoTextarea'

interface LiveModeProps {
  record: KitRecord
  onUpdate: (patch: Partial<KitRecord>) => void
  onExit: () => void
}

function clean(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

interface FlatQuestion {
  id: string
  category: string
  text: string
}

const DURATIONS = [3, 5, 10] as const
const SWIPE_THRESHOLD = 50

function mmss(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function LiveMode({ record, onUpdate, onExit }: LiveModeProps) {
  const questions = useMemo<FlatQuestion[]>(() => {
    const list: FlatQuestion[] = []
    CATEGORIES.forEach((cat) => {
      record.kit[cat.key].forEach((q, i) => {
        list.push({ id: questionId(cat.key, i), category: cat.label, text: q })
      })
    })
    return list
  }, [record.kit])

  const [index, setIndex] = useState(0)
  const [minutes, setMinutes] = useState<number>(5)
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60)
  const [paused, setPaused] = useState(false)

  const goNext = useCallback(
    () => setIndex((i) => Math.min(questions.length - 1, i + 1)),
    [questions.length],
  )
  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  // Navigation clavier : flèches gauche/droite, Échap pour quitter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, onExit])

  // Réinitialise le minuteur à chaque changement de question ou de durée.
  useEffect(() => {
    setSecondsLeft(minutes * 60)
    setPaused(false)
  }, [index, minutes])

  // Décompte.
  useEffect(() => {
    if (paused || secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [paused, secondsLeft])

  // Swipe tactile (mobile).
  const touchX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.changedTouches[0]?.clientX ?? null
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) goNext()
      else goPrev()
    }
    touchX.current = null
  }

  const current = questions[index]
  const isFirst = index === 0
  const isLast = index === questions.length - 1
  const danger = secondsLeft <= 30

  const setScore = (v: number | undefined) => {
    const scores = { ...record.scores }
    if (v === undefined) delete scores[current.id]
    else scores[current.id] = v
    onUpdate({ scores })
  }

  const setNote = (v: string) =>
    onUpdate({ notes: { ...record.notes, [current.id]: v } })

  return (
    <div
      className="live-mode no-print fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-900"
      role="dialog"
      aria-modal="true"
      aria-label="Mode entretien live"
    >
      {/* Barre supérieure */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-700 dark:bg-slate-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 dark:text-brand-400">
            {clean(current.category)}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Question {index + 1} / {questions.length}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Sélecteur de durée */}
          <div
            className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-700"
            role="group"
            aria-label="Durée par question"
          >
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setMinutes(d)}
                aria-pressed={minutes === d}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  minutes === d
                    ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {d} min
              </button>
            ))}
          </div>

          {/* Minuteur */}
          <span
            aria-label={`Temps restant ${mmss(secondsLeft)}`}
            className={`min-w-[4rem] rounded-lg px-3 py-1.5 text-center text-lg font-bold tabular-nums ${
              danger
                ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300'
                : 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
            }`}
          >
            {mmss(secondsLeft)}
          </span>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {paused ? 'Reprendre' : 'Pause'}
          </button>

          <button
            type="button"
            onClick={onExit}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Quitter
          </button>
        </div>
      </div>

      {/* Question en grand */}
      <div
        className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-full max-w-3xl">
          <p
            className="text-center text-2xl font-semibold leading-relaxed text-slate-900 sm:text-3xl dark:text-slate-100"
            aria-live="polite"
          >
            {clean(current.text)}
          </p>

          <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-4">
            <ScoreSelector
              value={record.scores[current.id]}
              onChange={setScore}
              size="lg"
            />
            <AutoTextarea
              rows={3}
              value={record.notes[current.id] ?? ''}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Vos notes..."
              aria-label="Notes pour cette question"
              className="w-full resize-none overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Astuce : utilisez les flèches ← → du clavier ou balayez l'écran.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:px-6 dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={goPrev}
          disabled={isFirst}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          ← Précédent
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={onExit}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-600"
          >
            Terminer l'entretien
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-600"
          >
            Suivant →
          </button>
        )}
      </div>
    </div>
  )
}
