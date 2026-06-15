import type { KitRecord } from './types'

const STORAGE_KEY = 'interviewkit.records.v1'

/** Charge les kits sauvegardés depuis localStorage (tolérant aux erreurs). */
export function loadRecords(): KitRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data as KitRecord[]
  } catch {
    return []
  }
}

/** Persiste les kits en localStorage (ignore silencieusement un éventuel quota dépassé). */
export function saveRecords(records: KitRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    /* quota dépassé ou stockage indisponible : on ignore. */
  }
}

/** Génère un identifiant unique pour un kit. */
export function newId(): string {
  return `kit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Nom complet affichable d'un candidat. */
export function candidateName(r: { prenom: string; nom: string }): string {
  return `${r.prenom} ${r.nom}`.trim() || 'Candidat sans nom'
}

/** Date formatée en français. */
export function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
