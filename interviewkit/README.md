# InterviewKit

Générateur de **kit d'entretien IA** pour recruteurs professionnels.
React + TypeScript + Vite + Tailwind CSS + API Anthropic (`claude-sonnet-4-6`).

Le recruteur saisit le candidat (prénom/nom), le poste et le profil ; l'IA
génère 16 questions réparties en 4 catégories (avec scoring 1–5 et zone de
notes par question, dont une question dédiée aux prétentions salariales), et les
**questions du candidat à anticiper** avec suggestions de réponse.

Fonctionnalités complémentaires :

- **Visualiseur de CV** — panneau latéral pour importer/afficher un PDF (split view).
- **Synthèse** — graphique radar des moyennes par catégorie, moyenne globale,
  impression générale et **verdict** (À retenir / À revoir / Refus).
- **Mode entretien live** — une question à la fois en grand, minuteur
  paramétrable (3/5/10 min), navigation précédent/suivant.
- **Mes kits** — sauvegarde automatique en `localStorage`, réouverture,
  suppression, badge de verdict et **comparaison** de 2–3 candidats d'un même
  poste (graphique en barres).
- **Export PDF** du kit complet ou de la synthèse seule (via `window.print()`),
  avec en-tête répété sur chaque page, une section par page et aucun bloc coupé.
- **Génération en streaming** — les questions s'affichent au fur et à mesure
  (effet typing) avec écrans skeleton, et les annotations sont enregistrées
  automatiquement (localStorage) sans bouton « sauvegarder ».
- **Mode sombre / clair**, navigation clavier (flèches en mode live) + ARIA,
  swipe entre questions sur mobile.
- **Rate limiting** côté client : 5 générations par heure maximum.

---

## 1. Lancer l'application en local

Prérequis : **Node.js 18+** et **npm**.

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer la clé API
#    Windows (PowerShell) :
copy .env.example .env
#    macOS / Linux :
#    cp .env.example .env

# 3. Éditer .env et renseigner votre clé Anthropic :
#    VITE_ANTHROPIC_API_KEY=sk-ant-...

# 4. Démarrer le serveur de développement
npm run dev
```

L'application est servie sur **http://localhost:5173**.

> Le formulaire est pré-rempli avec un exemple réaliste : il suffit de cliquer
> sur **« Générer mon kit »**.

Autres commandes :

```bash
npm run build     # build de production dans dist/
npm run preview   # prévisualiser le build de production
```

### ⚠️ À propos de la clé API

L'appel à l'API Anthropic est effectué **directement depuis le navigateur**
(`dangerouslyAllowBrowser: true`). C'est acceptable pour une **démo**, mais la
clé `VITE_ANTHROPIC_API_KEY` est alors **incluse dans le bundle** et visible par
quiconque inspecte le code côté client. Pour un usage en production, placez un
**backend / proxy** qui détient la clé et relaie les requêtes.

---

## 2. Déployer sur Vercel

### Option A — via le tableau de bord (recommandé)

1. Poussez le projet sur un dépôt GitHub / GitLab / Bitbucket.
2. Sur [vercel.com](https://vercel.com) → **Add New… → Project**, importez le dépôt.
3. Vercel détecte automatiquement Vite. Vérifiez la configuration :
   - **Framework Preset** : `Vite`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
4. Avant de déployer, ouvrez **Settings → Environment Variables** et ajoutez :

   | Name                      | Value         | Environments                     |
   | ------------------------- | ------------- | -------------------------------- |
   | `VITE_ANTHROPIC_API_KEY`  | `sk-ant-...`  | Production, Preview, Development  |

   > La variable **doit** commencer par `VITE_` pour être exposée au front par
   > Vite. Comme expliqué ci-dessus, elle sera embarquée dans le bundle public.

5. Cliquez sur **Deploy**.

> Si vous modifiez la variable d'environnement après un premier déploiement,
> relancez un déploiement (**Deployments → … → Redeploy**) pour qu'elle soit
> prise en compte (les variables sont injectées au moment du build).

### Option B — via la CLI Vercel

```bash
npm i -g vercel
vercel                 # premier déploiement (questions de configuration)

# Ajouter la variable d'environnement pour chaque environnement
vercel env add VITE_ANTHROPIC_API_KEY production
vercel env add VITE_ANTHROPIC_API_KEY preview
vercel env add VITE_ANTHROPIC_API_KEY development

vercel --prod          # déploiement en production
```

---

## Stack & sécurité

- **React 18 + TypeScript + Vite** — SPA légère.
- **Tailwind CSS** — design SaaS RH épuré, accent indigo (`#6366f1`), responsive.
- **@anthropic-ai/sdk** — appel `messages` au modèle `claude-sonnet-4-6`.
- **recharts** — graphiques radar (synthèse) et barres (comparaison).
- **DOMPurify** — sanitisation du contenu généré avant affichage.
- **localStorage** — sauvegarde des kits (aucune donnée envoyée à un serveur tiers ;
  le CV importé reste en mémoire le temps de la session et n'est pas persisté).
- Validation stricte des champs (champs requis, longueurs max) avant tout appel.
- Gestion des erreurs API avec messages utilisateur explicites (auth, quota,
  réseau…).
- Aucune donnée sensible stockée.
