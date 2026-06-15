import { useEffect, useMemo, useState, lazy, Suspense } from 'react'

const Form = lazy(() => import('./components/Form'))
const KitDisplay = lazy(() => import('./components/KitDisplay'))
const GeneratingView = lazy(() => import('./components/GeneratingView'))
const LiveMode = lazy(() => import('./components/LiveMode'))
const CvPanel = lazy(() => import('./components/CvPanel'))
const SavedKitsPanel = lazy(() => import('./components/SavedKitsPanel'))
import { generateKitStream, hasApiKey, KitError } from './api'
import { loadRecords, saveRecords, newId } from './storage'
import { checkRateLimit, recordGeneration } from './rateLimit'
import type { FormData, InterviewKit, KitRecord } from './types'

// Données de démo réalistes pré-remplies.
const DEMO_FORM: FormData = {
  prenom: 'Camille',
  nom: 'Martin',
  poste: 'Product Manager SaaS B2B',
  competences:
    'Priorisation roadmap, collaboration cross-fonctionnelle, analytics, expérience recrutement ou RH appréciée',
  profil:
    "5 ans d'expérience PM, ex-Aircall, a lancé 3 features majeures, formation école de commerce",
  typeEntretien: 'premier',
}

type View = 'form' | 'kit' | 'live'
type Panel = 'none' | 'cv' | 'saved'
type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('interviewkit.theme')
    if (saved === 'light' || saved === 'dark') return saved
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch {
    /* ignore */
  }
  return 'light'
}

export default function App() {
  const [form, setForm] = useState<FormData>(DEMO_FORM)
  const [records, setRecords] = useState<KitRecord[]>(() => loadRecords())
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [view, setView] = useState<View>('form')
  const [panel, setPanel] = useState<Panel>('none')
  const [cv, setCv] = useState<{ url: string; name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [streamPartial, setStreamPartial] = useState<Partial<InterviewKit> | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>(() => initialTheme())

  const apiKeyMissing = !hasApiKey()
  const cvOpen = panel === 'cv'
  const current = useMemo(
    () => records.find((r) => r.id === currentId) ?? null,
    [records, currentId],
  )

  // Persistance automatique des kits en localStorage (sauvegarde temps réel).
  useEffect(() => {
    saveRecords(records)
  }, [records])

  // Application du thème.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('interviewkit.theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const clearCv = () =>
    setCv((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })

  const handleCvUpload = (file: File) =>
    setCv((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return { url: URL.createObjectURL(file), name: file.name }
    })

  const updateCurrent = (patch: Partial<KitRecord>) =>
    setRecords((rs) =>
      rs.map((r) => (r.id === currentId ? { ...r, ...patch } : r)),
    )

  const handleGenerate = async () => {
    setError(null)

    const rl = checkRateLimit()
    if (!rl.ok) {
      setError(
        `Vous avez atteint la limite de 5 générations par heure. Réessayez dans ${rl.retryAfterMin} minute${rl.retryAfterMin > 1 ? 's' : ''}.`,
      )
      return
    }

    setLoading(true)
    setStreamPartial(null)
    try {
      const kit = await generateKitStream(form, (partial) =>
        setStreamPartial(partial),
      )
      recordGeneration()
      const record: KitRecord = {
        id: newId(),
        createdAt: Date.now(),
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        poste: form.poste.trim(),
        competences: form.competences.trim(),
        profil: form.profil.trim(),
        typeEntretien: form.typeEntretien,
        kit,
        scores: {},
        notes: {},
        generalImpression: '',
        verdict: null,
      }
      setRecords((rs) => [record, ...rs])
      setCurrentId(record.id)
      setView('kit')
      clearCv()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(
        err instanceof KitError
          ? err.message
          : 'Une erreur inattendue est survenue. Merci de réessayer.',
      )
    } finally {
      setLoading(false)
      setStreamPartial(null)
    }
  }

  const handleNewKit = () => {
    setView('form')
    setError(null)
    setPanel('none')
    clearCv()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReopen = (id: string) => {
    setCurrentId(id)
    setView('kit')
    setPanel('none')
    clearCv()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id: string) => {
    setRecords((rs) => rs.filter((r) => r.id !== id))
    if (id === currentId) {
      setCurrentId(null)
      setView('form')
      clearCv()
    }
  }

  const showKit = view === 'kit' && current

  return (
  <Suspense fallback={<div className="min-h-screen" />}>
    <div className="min-h-full">
      {/* En-tête */}
      <header
        className={`no-print sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur transition-[margin] dark:border-slate-700 dark:bg-slate-900/80 ${
          cvOpen ? 'lg:mr-[50vw]' : ''
        }`}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={handleNewKit}
            aria-label="Accueil — nouveau kit"
            className="flex items-center gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M5 7h14M5 12h14M5 17h9" />
              </svg>
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                InterviewKit
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Générateur de kit d'entretien IA pour recruteurs
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label={
                theme === 'dark'
                  ? 'Activer le mode clair'
                  : 'Activer le mode sombre'
              }
              aria-pressed={theme === 'dark'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {theme === 'dark' ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => setPanel((p) => (p === 'saved' ? 'none' : 'saved'))}
              aria-haspopup="dialog"
              aria-expanded={panel === 'saved'}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Mes kits
              {records.length > 0 && (
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
                  {records.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main
        className={`px-4 py-8 sm:px-6 sm:py-12 ${
          cvOpen ? 'lg:mr-[50vw] lg:max-w-none' : 'mx-auto max-w-3xl'
        }`}
      >
        {/* Bandeau clé API manquante */}
        {apiKeyMissing && (
          <div className="no-print mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            <p className="font-semibold">Clé API non configurée</p>
            <p className="mt-1 leading-relaxed">
              Créez un fichier{' '}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-500/20">
                .env
              </code>{' '}
              à la racine du projet à partir de{' '}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-500/20">
                .env.example
              </code>
              , puis renseignez votre clé&nbsp;:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-amber-100/70 p-3 text-xs dark:bg-amber-500/15">
              VITE_ANTHROPIC_API_KEY=sk-ant-...
            </pre>
            <p className="mt-2">Redémarrez ensuite le serveur de développement.</p>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div
            role="alert"
            className="no-print mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm animate-fade-in dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
          >
            <span aria-hidden className="mt-0.5">
              ⛔
            </span>
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Corps : formulaire → streaming → résultat */}
        {loading ? (
          <GeneratingView partial={streamPartial} />
        ) : showKit ? (
          <KitDisplay
            key={current.id}
            record={current}
            onUpdate={updateCurrent}
            onReset={handleNewKit}
            onOpenCv={() => setPanel('cv')}
            onStartLive={() => setView('live')}
          />
        ) : (
          <>
            <div className="no-print mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
                Préparez un entretien structuré en quelques secondes
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Décrivez le candidat, le poste et le profil : l'IA génère 16
                questions réparties en 4 catégories et les questions du candidat
                à anticiper.
              </p>
            </div>
            <Form
              form={form}
              onChange={setForm}
              onSubmit={handleGenerate}
              loading={loading}
              disabled={apiKeyMissing}
            />
          </>
        )}

        {/* Mention confidentialité */}
        <footer className="no-print mt-10 text-center text-xs text-slate-400 dark:text-slate-500">
          Vos données ne sont jamais transmises à des tiers.
        </footer>
      </main>

      {/* Mode entretien live (plein écran) */}
      {view === 'live' && current && (
        <LiveMode
          record={current}
          onUpdate={updateCurrent}
          onExit={() => setView('kit')}
        />
      )}

      {/* Fond cliquable pour fermer les panneaux (petits écrans seulement) */}
      {panel !== 'none' && (
        <div
          className="no-print fixed inset-0 z-30 bg-slate-900/20 lg:hidden"
          onClick={() => setPanel('none')}
          aria-hidden="true"
        />
      )}

      {/* Panneaux latéraux */}
      {panel === 'cv' && (
        <CvPanel
          cv={cv}
          onUpload={handleCvUpload}
          onClose={() => setPanel('none')}
        />
      )}
      {panel === 'saved' && (
        <SavedKitsPanel
          records={records}
          currentId={currentId}
          onReopen={handleReopen}
          onDelete={handleDelete}
          onClose={() => setPanel('none')}
        />
      )}
    </div>
    </Suspense>
  )
}
