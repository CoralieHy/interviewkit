// Types partagés de l'application InterviewKit.

export type InterviewType = 'premier' | 'technique' | 'culturel'

export type Verdict = 'retenir' | 'revoir' | 'refus'

export interface FormData {
  prenom: string
  nom: string
  poste: string
  competences: string
  profil: string
  /** '' = aucun type sélectionné (formulaire vierge). */
  typeEntretien: InterviewType | ''
}

/** Une question posée par le candidat + une suggestion de réponse pour l'intervieweur. */
export interface CandidateQuestion {
  question: string
  answer: string
}

/** Structure renvoyée par l'IA. (redFlags est encore généré mais n'est plus affiché.) */
export interface InterviewKit {
  motivation: string[]
  technical: string[]
  behavioral: string[]
  cultureFit: string[]
  redFlags: string[]
  candidateQuestions: CandidateQuestion[]
}

/**
 * Un kit sauvegardé : kit généré + saisies de l'intervieweur (notes, scores,
 * impression, verdict). Persisté en localStorage.
 */
export interface KitRecord {
  id: string
  createdAt: number
  prenom: string
  nom: string
  poste: string
  competences: string
  profil: string
  typeEntretien: InterviewType
  kit: InterviewKit
  /** Notes 1–5 par question, indexées par identifiant (`<categorie>-<index>`). */
  scores: Record<string, number>
  /** Observations libres par question, mêmes identifiants. */
  notes: Record<string, string>
  generalImpression: string
  verdict: Verdict | null
}

/** Clés des catégories de questions affichées. */
export type CategoryKey = 'motivation' | 'technical' | 'behavioral' | 'cultureFit'

/** Métadonnées d'affichage d'une catégorie de questions. */
export interface CategoryMeta {
  key: CategoryKey
  label: string
  /** Libellé court pour les graphiques / le mode live. */
  short: string
  description: string
  expectedCount: number
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: 'motivation',
    label: 'Motivation et parcours',
    short: 'Motivation',
    description:
      'Comprendre le « pourquoi » du candidat, la cohérence de son parcours et ses prétentions.',
    expectedCount: 4,
  },
  {
    key: 'technical',
    label: 'Compétences techniques',
    short: 'Technique',
    description: 'Évaluer la maîtrise concrète des compétences clés du poste.',
    expectedCount: 4,
  },
  {
    key: 'behavioral',
    label: 'Comportemental',
    short: 'Comportement',
    description: 'Sonder la posture, la collaboration et la gestion des situations.',
    expectedCount: 4,
  },
  {
    key: 'cultureFit',
    label: 'Culture fit et projection',
    short: 'Culture fit',
    description: "Mesurer l'alignement avec l'équipe et la projection dans le rôle.",
    expectedCount: 4,
  },
]

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  premier: 'Premier entretien',
  technique: 'Entretien technique',
  culturel: 'Fit culturel',
}

export interface VerdictMeta {
  key: Verdict
  label: string
  emoji: string
  /** Classes pour le badge (panneau « Mes kits »). */
  badge: string
  /** Classes du bouton non sélectionné. */
  base: string
  /** Classes du bouton sélectionné. */
  active: string
}

export const VERDICTS: VerdictMeta[] = [
  {
    key: 'retenir',
    label: 'À retenir',
    emoji: '✅',
    badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    base: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
    active: 'border-emerald-500 bg-emerald-500 text-white shadow-sm',
  },
  {
    key: 'revoir',
    label: 'À revoir',
    emoji: '🟡',
    badge: 'bg-amber-100 text-amber-800 border border-amber-200',
    base: 'border-amber-300 text-amber-700 hover:bg-amber-50',
    active: 'border-amber-500 bg-amber-500 text-white shadow-sm',
  },
  {
    key: 'refus',
    label: 'Refus',
    emoji: '❌',
    badge: 'bg-red-100 text-red-700 border border-red-200',
    base: 'border-red-300 text-red-700 hover:bg-red-50',
    active: 'border-red-500 bg-red-500 text-white shadow-sm',
  },
]
