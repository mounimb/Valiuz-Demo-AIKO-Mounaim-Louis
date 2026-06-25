# Valiuz Connect — Studio de Mesure Multi-Levier

POC de **mesure multi-levier** des campagnes retail media (on-site · off-site / extension
d'audience · in-store / DOOH), inspiré de l'offre **Valiuz Connect**. Tout est calculé en
direct côté navigateur à partir d'un panel **simulé et seedé** (reproductible).

## Le récit en 3 actes

1. **Combien j'ai vendu** — attribution closed-loop déterministe (ticket ↔ fidélité), ROAS brut,
   reach dédupliqué, 8 indicateurs alignés CESP « eRetail Data Trust ».
2. **Combien EN PLUS grâce à la pub** — incrémentalité **exposés vs contrôle** (ghost ads),
   **iROAS** causal, double intervalle de confiance (bootstrap + z-test), uplift par segment.
   La vérité-terrain causale est injectée puis **ré-estimée à l'aveugle** pour valider la méthode.
3. **Où remettre mon prochain euro** — **MMM** (adstock + saturation), calibré sur l'incrémentalité
   mesurée (comme un MMM ancré sur des lift tests), puis **optimiseur de budget** (égalisation des
   ROAS marginaux).

Un **copilote IA** commente les résultats : il ne reçoit qu'un *snapshot d'agrégats* (jamais
d'individus — cohérent data clean room / RGPD), chaque chiffre cité est revérifié, et il bascule sur
un fallback déterministe si OpenAI est indisponible (la démo ne casse jamais).

4 scénarios : **Decathlon** (sport), **Auchan** (FMCG), **Boulanger** (électroménager),
**Leroy Merlin** (bricolage). Thème clair / sombre.

## Démarrer

```bash
npm install        # déjà fait
npm run dev        # http://localhost:3000
# ou : npm run build && npm start
```

### Activer le copilote OpenAI (optionnel)

```bash
cp .env.example .env.local
# puis renseignez OPENAI_API_KEY=sk-...
```

Sans clé, l'assistant fonctionne en mode local ancré (déterministe, offline).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Recharts 3 · OpenAI.
Moteur de simulation + mesure 100 % TypeScript (PRNG mulberry32, bootstrap, moindres carrés ridge,
coordinate descent) — aucune dépendance ML, aucun backend.
