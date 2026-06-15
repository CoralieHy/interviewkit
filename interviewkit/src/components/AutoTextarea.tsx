import { useLayoutEffect, useRef } from 'react'

interface AutoTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
}

/**
 * Zone de texte qui s'agrandit automatiquement selon le contenu (overflow caché,
 * hauteur recalculée à la frappe). À l'impression, le contenu est rendu via un
 * bloc en flux normal (hauteur complète, rien n'est coupé dans le PDF).
 */
export default function AutoTextarea({
  value,
  onChange,
  className = '',
  ...rest
}: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const resize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  // Recalcule à chaque changement de valeur (frappe, réouverture d'un kit).
  useLayoutEffect(() => {
    resize()
  }, [value])

  // Recalcule si la largeur change (ouverture du panneau CV, etc.).
  useLayoutEffect(() => {
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange?.(e)
          resize()
        }}
        className={`${className} print:hidden`}
        {...rest}
      />
      {/* Rendu pour l'impression : tout le texte saisi, hauteur auto, pas de coupe. */}
      <div
        aria-hidden="true"
        className={`hidden whitespace-pre-wrap break-words print:block ${className}`}
      >
        {value ? value : ' '}
      </div>
    </>
  )
}
