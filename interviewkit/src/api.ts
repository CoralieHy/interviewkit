import Anthropic from '@anthropic-ai/sdk'
import type { FormData, InterviewKit } from './types'
import { INTERVIEW_TYPE_LABELS } from './types'

// Limites de validation (sécurité : bornes strictes côté client).
export const LIMITS = {
  prenom: 40,
  nom: 40,
  poste: 120,
  competences: 800,
  profil: 1000,
} as const

const MODEL = 'claude-sonnet-4-6'

/** Erreur applicative avec message utilisateur compréhensible. */
export class KitError extends Error {}

/**
 * Récupère la clé API depuis la variable d'environnement Vite.
 * Renvoie une chaîne vide si absente.
 */
export function getApiKey(): string {
  return (import.meta.env.VITE_ANTHROPIC_API_KEY ?? '').trim()
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0
}

/** Validation stricte des champs du formulaire avant envoi. */
export function validateForm(form: FormData): string | null {
  const prenom = form.prenom.trim()
  const nom = form.nom.trim()
  const poste = form.poste.trim()
  const competences = form.competences.trim()
  const profil = form.profil.trim()

  if (!prenom) return 'Le prénom du candidat est obligatoire.'
  if (prenom.length > LIMITS.prenom)
    return `Le prénom ne doit pas dépasser ${LIMITS.prenom} caractères.`

  if (!nom) return 'Le nom du candidat est obligatoire.'
  if (nom.length > LIMITS.nom)
    return `Le nom ne doit pas dépasser ${LIMITS.nom} caractères.`

  if (!poste) return "L'intitulé du poste est obligatoire."
  if (poste.length > LIMITS.poste)
    return `L'intitulé du poste ne doit pas dépasser ${LIMITS.poste} caractères.`

  if (!competences) return 'Les compétences clés recherchées sont obligatoires.'
  if (competences.length > LIMITS.competences)
    return `Les compétences ne doivent pas dépasser ${LIMITS.competences} caractères.`

  if (profil.length > LIMITS.profil)
    return `Le résumé du profil ne doit pas dépasser ${LIMITS.profil} caractères.`

  return null
}

const SYSTEM_PROMPT = `Tu es un expert RH senior et coach en recrutement. Tu conçois des kits d'entretien structurés, percutants et directement exploitables par des recruteurs professionnels.

Règles de production :
- Écris exclusivement en français, dans un registre professionnel.
- Les questions doivent être ouvertes, précises et adaptées au poste, aux compétences et au profil fournis.
- Évite les questions génériques creuses : ancre-les dans le contexte transmis.
- Tu réponds UNIQUEMENT avec un objet JSON valide, sans texte d'introduction, sans commentaire, sans bloc de code Markdown.`

function buildUserPrompt(form: FormData): string {
  const profil = form.profil.trim() || 'Non communiqué'
  return `Génère un kit d'entretien pour le poste suivant.

Intitulé du poste : ${form.poste.trim()}
Compétences clés recherchées : ${form.competences.trim()}
Résumé du profil candidat : ${profil}
Type d'entretien : ${INTERVIEW_TYPE_LABELS[form.typeEntretien]}

Adapte le ton et la profondeur des questions au type d'entretien indiqué.

Réponds avec un objet JSON respectant EXACTEMENT cette structure (les nombres d'items sont impératifs) :
{
  "motivation": [4 questions sur la motivation et le parcours. La DERNIÈRE de ces 4 questions doit OBLIGATOIREMENT porter sur les prétentions salariales du candidat],
  "technical": [4 questions sur les compétences techniques],
  "behavioral": [4 questions comportementales],
  "cultureFit": [4 questions sur la culture fit et la projection],
  "redFlags": [4 à 5 points d'attention / signaux d'alerte spécifiques à ce profil et à ce poste],
  "candidateQuestions": [
    3 objets { "question": "...", "answer": "..." } représentant des questions que le candidat pourrait poser à l'intervieweur, avec une suggestion de réponse
  ]
}

Chaque élément des tableaux de questions est une chaîne de caractères. N'ajoute aucune clé supplémentaire.`
}

/** Extrait et parse le JSON, en retirant un éventuel bloc de code Markdown. */
function parseKit(raw: string): InterviewKit {
  let text = raw.trim()

  // Retire un éventuel fence ```json ... ```
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fence) text = fence[1].trim()

  // À défaut, isole le premier objet JSON présent.
  if (!text.startsWith('{')) {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end !== -1) text = text.slice(start, end + 1)
  }

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new KitError(
      "La réponse de l'IA n'a pas pu être interprétée. Merci de réessayer.",
    )
  }

  const k = data as Partial<InterviewKit>
  const isStringArray = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every((x) => typeof x === 'string')

  if (
    !isStringArray(k.motivation) ||
    !isStringArray(k.technical) ||
    !isStringArray(k.behavioral) ||
    !isStringArray(k.cultureFit) ||
    !isStringArray(k.redFlags) ||
    !Array.isArray(k.candidateQuestions) ||
    !k.candidateQuestions.every(
      (q) =>
        q && typeof q.question === 'string' && typeof q.answer === 'string',
    )
  ) {
    throw new KitError(
      "Le kit généré est incomplet ou mal formé. Merci de réessayer.",
    )
  }

  return {
    motivation: k.motivation,
    technical: k.technical,
    behavioral: k.behavioral,
    cultureFit: k.cultureFit,
    redFlags: k.redFlags,
    candidateQuestions: k.candidateQuestions,
  }
}

/** Extrait le message d'erreur réel renvoyé par l'API (corps JSON). */
function extractApiDetail(err: InstanceType<typeof Anthropic.APIError>): string | undefined {
  const anyErr = err as { error?: unknown; message?: unknown }
  const body = anyErr.error as
    | { error?: { message?: unknown }; message?: unknown }
    | undefined
  const nested = body?.error?.message
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  const top = body?.message
  if (typeof top === 'string' && top.trim()) return top.trim()
  if (typeof err.message === 'string' && err.message.trim())
    return err.message.trim()
  return undefined
}

/** Traduit une erreur SDK en message utilisateur clair. */
function friendlyError(err: unknown): KitError {
  if (err instanceof KitError) return err

  // Trace complète en console pour le diagnostic développeur.
  console.error('[InterviewKit] Erreur API Anthropic :', err)

  if (err instanceof Anthropic.AuthenticationError) {
    return new KitError(
      "Clé API invalide ou refusée. Vérifiez la variable VITE_ANTHROPIC_API_KEY.",
    )
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return new KitError(
      "Votre clé API n'a pas les permissions nécessaires pour ce modèle.",
    )
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new KitError(
      'Trop de requêtes en peu de temps. Patientez quelques instants puis réessayez.',
    )
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new KitError(
      'Connexion impossible à l\'API. Vérifiez votre connexion internet puis réessayez.',
    )
  }
  if (err instanceof Anthropic.APIError) {
    const detail = extractApiDetail(err)
    const status = err.status ?? 'inconnue'
    // Cas fréquent : clé valide mais compte sans crédit → 400 invalid_request_error.
    if (detail && /credit balance|crédit/i.test(detail)) {
      return new KitError(
        `Crédit Anthropic insuffisant pour ce compte. Ajoutez du crédit dans la console Anthropic (Plans & Billing), puis réessayez. (Détail API : ${detail})`,
      )
    }
    if (detail) {
      return new KitError(`Erreur de l'API (${status}) : ${detail}`)
    }
    return new KitError(
      `Erreur de l'API (${status}). Merci de réessayer.`,
    )
  }
  return new KitError('Une erreur inattendue est survenue. Merci de réessayer.')
}

/** Génère le kit d'entretien via l'API Anthropic (appel direct depuis le frontend). */
export async function generateKit(form: FormData): Promise<InterviewKit> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new KitError(
      'Clé API absente. Configurez la variable VITE_ANTHROPIC_API_KEY.',
    )
  }

  const validationError = validateForm(form)
  if (validationError) throw new KitError(validationError)

  const client = new Anthropic({
    apiKey,
    // Autorise explicitement l'appel direct depuis le navigateur (contexte démo).
    dangerouslyAllowBrowser: true,
  })

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(form) }],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new KitError("Réponse vide de l'IA. Merci de réessayer.")
    }

    return parseKit(textBlock.text)
  } catch (err) {
    throw friendlyError(err)
  }
}

/**
 * Répare un JSON partiel (en cours de streaming) pour le rendre interprétable :
 * ferme les chaînes et structures ouvertes, retire un éventuel token incomplet.
 */
function repairPartialJson(input: string): string | null {
  let t = input.trim()
  // Retire un éventuel fence Markdown d'ouverture.
  const fence = t.indexOf('```')
  if (fence !== -1) {
    t = t.replace(/```(?:json)?/i, '')
    const close = t.indexOf('```')
    if (close !== -1) t = t.slice(0, close)
  }
  const brace = t.indexOf('{')
  if (brace === -1) return null
  t = t.slice(brace)

  const stack: string[] = []
  let inStr = false
  let esc = false
  let out = ''
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    out += c
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
    } else if (c === '"') {
      inStr = true
    } else if (c === '{') {
      stack.push('}')
    } else if (c === '[') {
      stack.push(']')
    } else if (c === '}' || c === ']') {
      stack.pop()
    }
  }

  if (inStr) out += '"'
  // Retire un séparateur ou espace final.
  out = out.replace(/[,\s]+$/, '')
  // Retire une clé en cours sans valeur : ... ,"technical":
  out = out.replace(/,?\s*"[^"]*"\s*:\s*$/, '')
  out = out.replace(/[,\s]+$/, '')
  // Referme les structures encore ouvertes.
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i]
  return out
}

const stringArray = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined

/** Extrait ce qui est interprétable d'une réponse en cours de streaming. */
export function parsePartialKit(text: string): Partial<InterviewKit> | null {
  const repaired = repairPartialJson(text)
  if (!repaired) return null
  let data: Record<string, unknown>
  try {
    const parsed = JSON.parse(repaired)
    if (!parsed || typeof parsed !== 'object') return null
    data = parsed as Record<string, unknown>
  } catch {
    return null
  }

  const result: Partial<InterviewKit> = {}
  const m = stringArray(data.motivation)
  if (m) result.motivation = m
  const tech = stringArray(data.technical)
  if (tech) result.technical = tech
  const beh = stringArray(data.behavioral)
  if (beh) result.behavioral = beh
  const cf = stringArray(data.cultureFit)
  if (cf) result.cultureFit = cf

  if (Array.isArray(data.candidateQuestions)) {
    result.candidateQuestions = (data.candidateQuestions as unknown[])
      .filter(
        (q): q is { question: string; answer?: unknown } =>
          !!q && typeof (q as { question?: unknown }).question === 'string',
      )
      .map((q) => ({
        question: q.question,
        answer: typeof q.answer === 'string' ? q.answer : '',
      }))
  }
  return result
}

/**
 * Génère le kit en streaming : `onPartial` est appelé au fil de l'eau avec ce
 * qui a déjà pu être interprété, puis le kit final validé est renvoyé.
 */
export async function generateKitStream(
  form: FormData,
  onPartial: (partial: Partial<InterviewKit>) => void,
): Promise<InterviewKit> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new KitError(
      'Clé API absente. Configurez la variable VITE_ANTHROPIC_API_KEY.',
    )
  }

  const validationError = validateForm(form)
  if (validationError) throw new KitError(validationError)

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(form) }],
    })

    stream.on('text', (_delta: string, snapshot: string) => {
      const partial = parsePartialKit(snapshot)
      if (partial) onPartial(partial)
    })

    const final = await stream.finalMessage()
    const textBlock = final.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new KitError("Réponse vide de l'IA. Merci de réessayer.")
    }
    return parseKit(textBlock.text)
  } catch (err) {
    throw friendlyError(err)
  }
}
