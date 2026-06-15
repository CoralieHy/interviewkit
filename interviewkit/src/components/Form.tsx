import type { FormData, InterviewType } from '../types'
import { INTERVIEW_TYPE_LABELS } from '../types'
import { LIMITS } from '../api'

interface FormProps {
  form: FormData
  onChange: (form: FormData) => void
  onSubmit: () => void
  loading: boolean
  disabled: boolean
}

const TYPE_OPTIONS: InterviewType[] = ['premier', 'technique', 'culturel']

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max
  return (
    <span
      className={`text-xs tabular-nums ${
        over ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'
      }`}
    >
      {value.length}/{max}
    </span>
  )
}

const labelClass = 'block text-sm font-semibold text-slate-700 dark:text-slate-200'
const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800/50'

export default function Form({
  form,
  onChange,
  onSubmit,
  loading,
  disabled,
}: FormProps) {
  const update = (patch: Partial<FormData>) => onChange({ ...form, ...patch })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loading && !disabled) onSubmit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-800"
    >
      {/* Identité du candidat */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="prenom" className={labelClass}>
              Prénom <span className="text-brand-500">*</span>
            </label>
            <CharCount value={form.prenom} max={LIMITS.prenom} />
          </div>
          <input
            id="prenom"
            type="text"
            required
            maxLength={LIMITS.prenom + 10}
            value={form.prenom}
            onChange={(e) => update({ prenom: e.target.value })}
            placeholder="Ex. : Camille"
            className={fieldClass}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="nom" className={labelClass}>
              Nom <span className="text-brand-500">*</span>
            </label>
            <CharCount value={form.nom} max={LIMITS.nom} />
          </div>
          <input
            id="nom"
            type="text"
            required
            maxLength={LIMITS.nom + 10}
            value={form.nom}
            onChange={(e) => update({ nom: e.target.value })}
            placeholder="Ex. : Martin"
            className={fieldClass}
            disabled={loading}
          />
        </div>
      </div>

      {/* Poste */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="poste" className={labelClass}>
            Intitulé du poste <span className="text-brand-500">*</span>
          </label>
          <CharCount value={form.poste} max={LIMITS.poste} />
        </div>
        <input
          id="poste"
          type="text"
          required
          maxLength={LIMITS.poste + 20}
          value={form.poste}
          onChange={(e) => update({ poste: e.target.value })}
          placeholder="Ex. : Product Manager SaaS B2B"
          className={fieldClass}
          disabled={loading}
        />
      </div>

      {/* Compétences */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="competences" className={labelClass}>
            Compétences clés recherchées <span className="text-brand-500">*</span>
          </label>
          <CharCount value={form.competences} max={LIMITS.competences} />
        </div>
        <textarea
          id="competences"
          required
          rows={3}
          maxLength={LIMITS.competences + 50}
          value={form.competences}
          onChange={(e) => update({ competences: e.target.value })}
          placeholder="Ex. : Priorisation roadmap, collaboration cross-fonctionnelle, analytics…"
          className={`${fieldClass} resize-y`}
          disabled={loading}
        />
      </div>

      {/* Profil candidat */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="profil" className={labelClass}>
            Résumé du profil candidat{' '}
            <span className="font-normal text-slate-400 dark:text-slate-500">
              (optionnel)
            </span>
          </label>
          <CharCount value={form.profil} max={LIMITS.profil} />
        </div>
        <textarea
          id="profil"
          rows={3}
          maxLength={LIMITS.profil + 50}
          value={form.profil}
          onChange={(e) => update({ profil: e.target.value })}
          placeholder="Ex. : 5 ans d'expérience PM, ex-Aircall, a lancé 3 features majeures…"
          className={`${fieldClass} resize-y`}
          disabled={loading}
        />
      </div>

      {/* Type d'entretien */}
      <fieldset className="space-y-2" disabled={loading}>
        <legend className={labelClass}>Type d'entretien</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TYPE_OPTIONS.map((type) => {
            const active = form.typeEntretien === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => update({ typeEntretien: type })}
                aria-pressed={active}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                  active
                    ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-500/50 dark:hover:bg-slate-700'
                }`}
              >
                {INTERVIEW_TYPE_LABELS[type]}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Soumission */}
      <button
        type="submit"
        disabled={loading || disabled}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Génération en cours…' : 'Générer mon kit'}
      </button>

      {disabled && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          La génération est désactivée tant que la clé API n'est pas configurée.
        </p>
      )}
    </form>
  )
}
