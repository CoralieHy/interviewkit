import { useState } from 'react'
import DOMPurify from 'dompurify'
import type { KitRecord, Verdict } from '../types'
import { CATEGORIES, INTERVIEW_TYPE_LABELS } from '../types'
import { questionId } from '../scoring'
import { candidateName } from '../storage'
import ScoreSelector from './ScoreSelector'
import AutoTextarea from './AutoTextarea'
import Synthesis from './Synthesis'

interface KitDisplayProps {
  record: KitRecord
  onUpdate: (patch: Partial<KitRecord>) => void
  onReset: () => void
  onOpenCv: () => void
  onStartLive: () => void
}

/** Nettoie le contenu généré avant affichage (sécurité : anti-injection HTML). */
function clean(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

/**
 * Lance l'impression. `title` devient le titre du document le temps de l'impression
 * (nom de fichier proposé par le navigateur), puis le titre d'origine est restauré.
 * `bodyClass` permet de restreindre l'impression à une section.
 */
function printWith(title: string, bodyClass?: string) {
  const originalTitle = document.title
  document.title = title
  if (bodyClass) document.body.classList.add(bodyClass)
  const cleanup = () => {
    document.title = originalTitle
    if (bodyClass) document.body.classList.remove(bodyClass)
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}

const secondaryBtn =
  'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'

export default function KitDisplay({
  record,
  onUpdate,
  onReset,
  onOpenCv,
  onStartLive,
}: KitDisplayProps) {
  const setScore = (id: string, v: number | undefined) => {
    const scores = { ...record.scores }
    if (v === undefined) delete scores[id]
    else scores[id] = v
    onUpdate({ scores })
  }

  const setNote = (id: string, v: string) =>
    onUpdate({ notes: { ...record.notes, [id]: v } })

  const pdfTitle = `InterviewKit — Kit d'entretien IA · ${candidateName(record)}`

  // Modale de pré-impression (rappel : décocher les en-têtes/pieds du navigateur).
  const [printTarget, setPrintTarget] = useState<null | 'full' | 'synthesis'>(null)
  const confirmPrint = () => {
    const target = printTarget
    setPrintTarget(null)
    printWith(pdfTitle, target === 'synthesis' ? 'print-synthesis' : undefined)
  }

  return (
    <div className="print-area space-y-6">
      {/* En-tête répété sur chaque page du PDF (caché à l'écran). */}
      <div className="print-running-header" aria-hidden="true">
        InterviewKit — Kit d'entretien IA · {clean(candidateName(record))}
      </div>

      {/* Barre d'actions (non imprimée) */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kit pour{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {clean(candidateName(record))}
          </span>{' '}
          · {INTERVIEW_TYPE_LABELS[record.typeEntretien]}
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <span aria-hidden>✓</span> Enregistrement automatique
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onStartLive}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            ▶ Démarrer l'entretien
          </button>
          <button
            type="button"
            onClick={() => setPrintTarget('full')}
            className={secondaryBtn}
          >
            Exporter en PDF
          </button>
          <button type="button" onClick={onReset} className={secondaryBtn}>
            Nouveau kit
          </button>
        </div>
      </div>

      {/* En-tête imprimable : identité du candidat */}
      <header className="kit-header rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 dark:text-brand-400">
              Kit d'entretien · {INTERVIEW_TYPE_LABELS[record.typeEntretien]}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {clean(candidateName(record))}
            </h2>
            <p className="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-400">
              {clean(record.poste)}
            </p>
          </div>
          <button type="button" onClick={onOpenCv} className={`no-print shrink-0 ${secondaryBtn}`}>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            Voir le CV
          </button>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700/60">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Compétences ciblées :
            </span>{' '}
            {clean(record.competences)}
          </p>
          {record.profil.trim() && (
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Profil :
              </span>{' '}
              {clean(record.profil)}
            </p>
          )}
        </div>
      </header>

      {/* Catégories de questions */}
      {CATEGORIES.map((cat, ci) => {
        const questions = record.kit[cat.key]
        return (
          <section
            key={cat.key}
            style={{ animationDelay: `${ci * 90}ms` }}
            className="print-section animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-700/60">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {cat.label}
              </h3>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {cat.description}
              </p>
            </div>
            <ol className="space-y-5">
              {questions.map((q, i) => {
                const id = questionId(cat.key, i)
                return (
                  <li key={id} className="print-avoid space-y-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <p className="flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                        <span className="mr-2 font-semibold text-brand-500 dark:text-brand-400">
                          {i + 1}.
                        </span>
                        {clean(q)}
                      </p>
                      <ScoreSelector
                        value={record.scores[id]}
                        onChange={(v) => setScore(id, v)}
                      />
                    </div>
                    <AutoTextarea
                      rows={2}
                      value={record.notes[id] ?? ''}
                      onChange={(e) => setNote(id, e.target.value)}
                      placeholder="Vos notes..."
                      aria-label={`Notes pour la question ${i + 1} — ${cat.label}`}
                      className="w-full resize-none overflow-hidden rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                    />
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}

      {/* Questions de l'intervieweur à anticiper */}
      <section
        style={{ animationDelay: `${CATEGORIES.length * 90}ms` }}
        className="print-section animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-700/60">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Questions du candidat à anticiper
          </h3>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Ce que le candidat pourrait vous demander — et une piste de réponse.
          </p>
        </div>
        <div className="space-y-4">
          {record.kit.candidateQuestions.map((cq, i) => (
            <div
              key={i}
              className="print-avoid rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/40"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                « {clean(cq.question)} »
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-brand-500 dark:text-brand-400">
                  Suggestion de réponse —{' '}
                </span>
                {clean(cq.answer)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bouton export synthèse seule */}
      <div className="no-print flex justify-end">
        <button
          type="button"
          onClick={() => setPrintTarget('synthesis')}
          className={secondaryBtn}
        >
          Exporter la synthèse en PDF
        </button>
      </div>

      {/* Synthèse de l'entretien (graphiques + verdict) */}
      <Synthesis
        record={record}
        onImpressionChange={(v) => onUpdate({ generalImpression: v })}
        onVerdictChange={(v: Verdict | null) => onUpdate({ verdict: v })}
      />

      <p className="no-print pt-2 text-center text-xs text-slate-400 dark:text-slate-500">
        Généré avec InterviewKit · Relisez et adaptez chaque question avant
        l'entretien.
      </p>

      {/* Modale rappel : décocher les en-têtes/pieds de page du navigateur. */}
      {printTarget && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-modal-title"
          onClick={() => setPrintTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="print-modal-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              Avant d'imprimer
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Pour un PDF propre, dans la boîte de dialogue d'impression, décochez
              « En-têtes et pieds de page ».
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintTarget(null)}
                className={secondaryBtn}
              >
                Annuler
              </button>
              <button
                type="button"
                autoFocus
                onClick={confirmPrint}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
              >
                J'ai compris, imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
