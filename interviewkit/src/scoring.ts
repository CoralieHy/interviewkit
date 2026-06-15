import { CATEGORIES } from './types'
import type { InterviewKit } from './types'

export interface CategoryScore {
  key: string
  label: string
  short: string
  average: number | null
  answered: number
  total: number
}

export interface KitScores {
  categories: CategoryScore[]
  /** Moyenne globale sur 5 (null si aucune question notée). */
  global: number | null
  answered: number
  total: number
}

/** Identifiant stable d'une question : `<categorie>-<index>`. */
export function questionId(key: string, index: number): string {
  return `${key}-${index}`
}

/** Calcule les moyennes par catégorie et la moyenne globale à partir des scores saisis. */
export function computeScores(
  kit: InterviewKit,
  scores: Record<string, number>,
): KitScores {
  const all: number[] = []
  let total = 0

  const categories: CategoryScore[] = CATEGORIES.map((cat) => {
    const questions = kit[cat.key]
    const vals: number[] = []
    questions.forEach((_, i) => {
      const v = scores[questionId(cat.key, i)]
      if (typeof v === 'number') {
        vals.push(v)
        all.push(v)
      }
    })
    total += questions.length
    const average = vals.length
      ? vals.reduce((a, b) => a + b, 0) / vals.length
      : null
    return {
      key: cat.key,
      label: cat.label,
      short: cat.short,
      average,
      answered: vals.length,
      total: questions.length,
    }
  })

  const global = all.length
    ? all.reduce((a, b) => a + b, 0) / all.length
    : null

  return { categories, global, answered: all.length, total }
}

/** Arrondi à une décimale pour l'affichage. */
export function round1(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1)
}
