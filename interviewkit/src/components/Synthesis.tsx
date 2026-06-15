import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { KitRecord, Verdict } from '../types'
import { INTERVIEW_TYPE_LABELS, VERDICTS } from '../types'
import { computeScores, round1 } from '../scoring'
import { candidateName, formatDate } from '../storage'
import AutoTextarea from './AutoTextarea'

interface SynthesisProps {
  record: KitRecord
  onImpressionChange: (value: string) => void
  onVerdictChange: (verdict: Verdict | null) => void
}

export default function Synthesis({
  record,
  onImpressionChange,
  onVerdictChange,
}: SynthesisProps) {
  const { categories, global, answered, total } = computeScores(
    record.kit,
    record.scores,
  )

  const radarData = categories.map((c) => ({
    category: c.short,
    note: c.average ?? 0,
  }))

  return (
    <section className="print-section synthesis-section animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {/* Identité du candidat — utile pour l'export « synthèse seule ». */}
      <div className="mb-5 border-b border-slate-100 pb-4 dark:border-slate-700/60">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 dark:text-brand-400">
          Synthèse de l'entretien
        </p>
        <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {candidateName(record)}
        </h3>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {record.poste} · {INTERVIEW_TYPE_LABELS[record.typeEntretien]} ·{' '}
          {formatDate(record.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Graphique radar */}
        <div className="lg:col-span-3">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <PolarRadiusAxis
                  domain={[0, 5]}
                  tickCount={6}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Radar
                  name="Score moyen"
                  dataKey="note"
                  stroke="#4f46e5"
                  fill="#6366f1"
                  fillOpacity={0.4}
                />
                <Tooltip
                  formatter={(v) => [`${round1(Number(v))}/5`, 'Score moyen']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Moyennes chiffrées */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-brand-50 p-5 text-center dark:bg-brand-500/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
              Moyenne globale
            </p>
            <p className="mt-1 text-4xl font-extrabold text-brand-700 dark:text-brand-300">
              {global !== null ? round1(global) : '—'}
              <span className="text-xl font-bold text-brand-400"> / 5</span>
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {answered}/{total} questions notées
            </p>
          </div>
          <ul className="mt-4 space-y-2">
            {categories.map((c) => (
              <li
                key={c.key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-slate-600 dark:text-slate-300">
                  {c.label}
                </span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {c.average !== null ? `${round1(c.average)} / 5` : '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Impression générale */}
      <div className="mt-6 space-y-2">
        <label
          htmlFor="impression"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          Impression générale
        </label>
        <AutoTextarea
          id="impression"
          rows={3}
          value={record.generalImpression}
          onChange={(e) => onImpressionChange(e.target.value)}
          placeholder="Candidat intéressant, mais..."
          className="w-full resize-none overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Verdict (+ récapitulatif des scores visible uniquement à l'impression,
          pour que la page verdict du PDF ne soit pas presque vide). */}
      <div className="print-avoid mt-6 space-y-3">
        <div className="hidden rounded-xl border border-slate-200 p-3 print:block">
          <p className="text-sm font-semibold text-slate-700">
            Récapitulatif des scores
          </p>
          <ul className="mt-1 space-y-0.5">
            {categories.map((c) => (
              <li key={c.key} className="flex items-center justify-between">
                <span className="text-slate-600">{c.label}</span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {c.average !== null ? `${round1(c.average)} / 5` : '—'}
                </span>
              </li>
            ))}
            <li className="mt-0.5 flex items-center justify-between border-t border-slate-200 pt-0.5 font-semibold">
              <span className="text-slate-700">Moyenne globale</span>
              <span className="tabular-nums text-slate-900">
                {global !== null ? `${round1(global)} / 5` : '—'}
              </span>
            </li>
          </ul>
        </div>

        <p className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Verdict
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {VERDICTS.map((v) => {
            const active = record.verdict === v.key
            return (
              <button
                key={v.key}
                type="button"
                aria-pressed={active}
                onClick={() => onVerdictChange(active ? null : v.key)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                  active ? v.active : `bg-white dark:bg-slate-800 ${v.base}`
                }`}
              >
                <span aria-hidden>{v.emoji}</span>
                {v.label}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
