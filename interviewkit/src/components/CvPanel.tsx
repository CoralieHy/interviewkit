import { useRef } from 'react'

interface CvPanelProps {
  cv: { url: string; name: string } | null
  onUpload: (file: File) => void
  onClose: () => void
}

/**
 * Panneau CV : split view (moitié droite) sur grand écran, plein écran avec
 * bouton retour sur mobile.
 */
export default function CvPanel({ cv, onUpload, onClose }: CvPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const pick = () => inputRef.current?.click()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') onUpload(file)
    else if (file) alert('Merci de sélectionner un fichier PDF.')
    e.target.value = ''
  }

  return (
    <aside
      className="no-print fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl lg:w-1/2 dark:border-slate-700 dark:bg-slate-800"
      role="dialog"
      aria-modal="true"
      aria-label="CV du candidat"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        <div className="flex items-center gap-2">
          {/* Bouton retour (surtout utile en plein écran mobile). */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Revenir au kit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 lg:hidden dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            ← Retour
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              CV du candidat
            </h2>
            {cv && (
              <p className="max-w-[16rem] truncate text-xs text-slate-500 dark:text-slate-400">
                {cv.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={pick}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {cv ? 'Remplacer' : 'Importer un PDF'}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le panneau CV"
            className="hidden rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 lg:inline-flex dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Fermer
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFile}
      />

      <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-900">
        {cv ? (
          <iframe
            title="CV du candidat"
            src={cv.url}
            className="h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={pick}
            className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-300">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 16V4m0 0L8 8m4-4 4 4" />
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Importer le CV (PDF)
            </span>
            <span className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
              Le fichier reste local à votre navigateur le temps de la session et
              n'est pas envoyé ni sauvegardé.
            </span>
          </button>
        )}
      </div>
    </aside>
  )
}
