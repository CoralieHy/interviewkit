import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { KitRecord } from '../types'
import { CATEGORIES, INTERVIEW_TYPE_LABELS, VERDICTS } from '../types'
import { computeScores, round1 } from '../scoring'
import { candidateName, formatDate } from '../storage'

interface SavedKitsPanelProps {
  records: KitRecord[]
  currentId: string | null
  onReopen: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

const PALETTE = ['#6366f1', '#10b981', '#f59e0b']

function VerdictBadge({ verdict }: { verdict: KitRecord['verdict'] }) {
  if (!verdict) return null
  const meta = VERDICTS.find((v) => v.key === verdict)
  if (!meta) return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badge}`}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  )
}

export default function SavedKitsPanel({
  records,
  currentId,
  onReopen,
  onDelete,
  onClose,
}: SavedKitsPanelProps) {
  const [mode, setMode] = useState<'list' | 'compare'>('list')
  const [selected, setSelected] = useState<string[]>([])

  // Poste de référence : seuls les kits du même poste sont sélectionnables ensemble.
  const refPoste = selected.length
    ? records.find((r) => r.id === selected[0])?.poste ?? null
    : null

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev,
    )
  }

  const selectedRecords = useMemo(
    () =>
      selected
        .map((id) => records.find((r) => r.id === id))
        .filter((r): r is KitRecord => Boolean(r)),
    [selected, records],
  )

  const compareData = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const row: Record<string, string | number> = { category: cat.short }
      selectedRecords.forEach((r, i) => {
        const cat2 = computeScores(r.kit, r.scores).categories.find(
          (c) => c.key === cat.key,
        )
        row[`c${i}`] = cat2?.average ?? 0
      })
      return row
    })
  }, [selectedRecords])

  return (
    <aside
      className="no-print fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:w-[360px] lg:w-[34%] xl:w-[30%] dark:border-slate-700 dark:bg-slate-800"
      role="dialog"
      aria-modal="true"
      aria-label="Mes kits sauvegardés"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {mode === 'list' ? `Mes kits (${records.length})` : 'Comparaison'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le panneau"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Fermer
        </button>
      </div>

      {mode === 'list' ? (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            {records.length === 0 ? (
              <p className="mt-10 text-center text-sm text-slate-400 dark:text-slate-500">
                Aucun kit sauvegardé pour l'instant.
              </p>
            ) : (
              <ul className="space-y-3">
                {records.map((r) => {
                  const isSelected = selected.includes(r.id)
                  const differentPoste =
                    refPoste !== null && r.poste !== refPoste
                  const disableCheck =
                    !isSelected && (differentPoste || selected.length >= 3)
                  return (
                    <li
                      key={r.id}
                      className={`rounded-2xl border p-4 shadow-sm transition ${
                        r.id === currentId
                          ? 'border-brand-300 bg-brand-50/40 dark:border-brand-500/50 dark:bg-brand-500/10'
                          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                            {candidateName(r)}
                          </p>
                          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                            {r.poste} ·{' '}
                            {INTERVIEW_TYPE_LABELS[r.typeEntretien]}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                            {formatDate(r.createdAt)}
                          </p>
                          <div className="mt-2">
                            <VerdictBadge verdict={r.verdict} />
                          </div>
                        </div>
                        <label
                          className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                            disableCheck
                              ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                              : 'cursor-pointer text-slate-500 dark:text-slate-400'
                          }`}
                          title={
                            differentPoste
                              ? 'Comparaison limitée aux kits du même poste'
                              : 'Sélectionner pour comparer'
                          }
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500/40 dark:border-slate-600 dark:bg-slate-700"
                            checked={isSelected}
                            disabled={disableCheck}
                            onChange={() => toggle(r.id)}
                          />
                          Comparer
                        </label>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => onReopen(r.id)}
                          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600"
                        >
                          Rouvrir
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Supprimer le kit de ${candidateName(r)} ?`,
                              )
                            ) {
                              setSelected((s) => s.filter((x) => x !== r.id))
                              onDelete(r.id)
                            }
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-slate-600 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          Supprimer
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Barre de comparaison */}
          <div className="border-t border-slate-200 p-4 dark:border-slate-700">
            <button
              type="button"
              disabled={selected.length < 2}
              onClick={() => setMode('compare')}
              className="w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Comparer {selected.length >= 1 ? `(${selected.length})` : ''}
            </button>
            <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
              Sélectionnez 2 ou 3 kits d'un même poste.
            </p>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-5">
          <button
            type="button"
            onClick={() => setMode('list')}
            className="mb-4 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            ← Retour à la liste
          </button>

          <p className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {selectedRecords[0]?.poste}
          </p>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            Scores moyens par catégorie (sur 5)
          </p>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={compareData}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  domain={[0, 5]}
                  tickCount={6}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {selectedRecords.map((r, i) => (
                  <Bar
                    key={r.id}
                    dataKey={`c${i}`}
                    name={candidateName(r)}
                    fill={PALETTE[i % PALETTE.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-6 space-y-2">
            {selectedRecords.map((r, i) => {
              const { global } = computeScores(r.kit, r.scores)
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900/40"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {candidateName(r)}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {global !== null ? `${round1(global)} / 5` : '—'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </aside>
  )
}
