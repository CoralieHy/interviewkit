export default function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center animate-fade-in">
      <span
        className="h-12 w-12 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin"
        role="status"
        aria-label="Chargement"
      />
      {label && (
        <p className="text-sm font-medium text-slate-500">{label}</p>
      )}
    </div>
  )
}
