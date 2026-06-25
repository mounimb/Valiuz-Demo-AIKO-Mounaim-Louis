# Valiuz Connect — Studio de Mesure Multi-Levier
### Guide de la démo : qu'est-ce que ça fait, et pourquoi

---

## 1. En une phrase

C'est un **tableau de bord interactif** qui prend **une campagne publicitaire** diffusée sur **3 leviers** (le site e-commerce, le web extérieur, et les écrans en magasin) et répond à la seule question qui compte pour un annonceur :

> **« Cette pub m'a-t-elle vraiment fait vendre plus — et où dois-je remettre mon prochain euro ? »**

Tout est calculé **en direct**, dans le navigateur, à partir de **données simulées** (réalistes mais inventées, faute d'accès aux vraies données de Valiuz). On peut bouger n'importe quel curseur et tout se recalcule instantanément.

---

## 2. Le problème métier (le cœur du métier de Valiuz)

Valiuz est l'entité **data + régie publicitaire** du groupe Mulliez (Auchan, Decathlon, Leroy Merlin, Boulanger…). Son produit phare, **Valiuz Connect**, fait une chose précieuse : il **relie la pub vue par un client à ce qu'il achète réellement** (en ligne ET en magasin), grâce à la **carte de fidélité** et au **ticket de caisse**.

Une marque (par ex. un fabricant de café qui vend chez Auchan) veut savoir si ses 250 000 € de pub ont généré des ventes **en plus** — pas juste des ventes qui auraient eu lieu de toute façon. C'est exactement ce que cette démo mesure et raconte.

**Les 3 leviers d'une campagne :**

| Levier | Où | Exemple |
|---|---|---|
| **On-site** | Sur le site e-commerce de l'enseigne | Produit sponsorisé en haut des résultats sur decathlon.fr |
| **Off-site** (extension d'audience) | Sur le web ouvert / réseaux sociaux / TV connectée | Bannière ciblée sur un site d'actu, à partir des audiences Valiuz |
| **In-store / DOOH** | Écrans numériques en magasin | Pub sur les ~3 400 écrans Imediacenter dans les hypermarchés |

La force de Valiuz : **orchestrer et mesurer les trois ensemble**, sans double comptage.

---

## 3. Ce que montre la démo : un récit en 3 actes

La page se lit du haut vers le bas comme une histoire, qui suit la **maturité d'un annonceur** : on part du chiffre « brut » et naïf, on le corrige avec la science, puis on passe à l'action.

### 🎬 ACTE 1 — « Combien j'ai vendu ? » (le descriptif)

On affiche les chiffres classiques d'une campagne :
- **Dépense média**, **impressions**, **reach** (nb de personnes touchées), **ventes attribuées**, **nouveaux acheteurs**.
- Le **ROAS brut** (Return On Ad Spend) : ventes attribuées ÷ budget. Ex : **5,56×** = « pour 1 € dépensé, 5,56 € de ventes attribuées ».
- Les **8 indicateurs certifiés CESP** (le standard du marché : CPM, CPC, taux de clic, etc.).

**Le piège pédagogique :** un curseur permet de changer la **fenêtre d'attribution** (compter les ventes sur 7, 14 ou 30 jours après la pub). En l'élargissant, **le ROAS brut grimpe**… simplement parce qu'on capte davantage de ventes qui auraient eu lieu sans la pub. C'est le signal qu'un ROAS brut **n'est pas fiable** : il dépend d'une convention de calcul.

> 👉 Message : *« Ce chiffre est corrélationnel. Il mélange l'effet de la pub et les ventes naturelles. »*

### 🎬 ACTE 2 — « Combien EN PLUS grâce à la pub ? » (le causal — la pièce maîtresse)

C'est le cœur de la démo et du métier de Valiuz : la **mesure d'incrémentalité**.

**Le principe (une vraie expérience, comme en médecine) :** on prend l'audience cible et on la coupe en deux au hasard :
- un **groupe exposé** (il voit la pub),
- un **groupe contrôle / « holdout »** (il ne la voit pas — c'est le placebo).

Puis on compare le **taux d'achat** des deux groupes. La différence, c'est **l'effet réellement causé par la pub** — ce qu'on appelle le **lift** (l'incrément). Tout le reste (ce que les deux groupes achètent pareil) est **organique**, donc à ne pas créditer à la pub.

On en tire le KPI vedette :
- **iROAS** (ROAS **incrémental**) = ventes **réellement en plus** ÷ budget. Ex : **3,27×** au lieu de 5,56×.
- **L'écart 5,56× → 3,27× (≈ 41 %)** est surligné en orange : c'est la part de ventes que le ROAS brut **surévaluait**.

Ce que l'écran montre en plus :
- **Significativité statistique** (p-value, test z) : peut-on faire confiance au résultat, ou est-ce du hasard ?
- **Double intervalle de confiance** : une fourchette « iROAS entre 2,2× et 4,3× » calculée par **deux méthodes** (bootstrap + test analytique) qui se confirment — signe de rigueur.
- **Preuve de méthode (l'argument fort) :** comme les données sont simulées, on connaît la **« vraie » valeur** injectée. L'encart « estimé vs vérité-terrain » montre que **la mesure retombe sur la vraie valeur** → ce n'est pas un dashboard de chiffres décoratifs, c'est une **méthode validée**.
- **Uplift par segment** : tous les clients ne réagissent pas pareil. On distingue les **« persuadables »** (achètent grâce à la pub → à cibler) des **« sure-things »** (auraient acheté de toute façon → budget gaspillé).

> 👉 Message : *« Seule la donnée déterministe ticket ↔ fidélité de Valiuz permet de trancher : voici la vente que la pub a vraiment créée. »*

### 🎬 ACTE 3 — « Où remettre mon prochain euro ? » (le prescriptif)

Maintenant qu'on sait mesurer, on **optimise**.

- **Courbes de réponse (MMM — Marketing Mix Modeling) :** pour chaque levier, une courbe montre « combien de ventes en plus pour X € investis ». Ces courbes sont **concaves** (rendements décroissants : les premiers euros rapportent beaucoup, les derniers saturent). Deux notions sont modélisées :
  - **adstock** : la pub a un effet qui se prolonge quelques jours après diffusion (mémoire) ;
  - **saturation** : à force d'arroser la même audience, ça ne sert plus à rien.
- **Le modèle est réellement « entraîné »** sur la série de ventes, et **calibré sur l'incrémentalité de l'Acte 2** (exactement comme Meta et Google recommandent de caler un MMM sur des tests de lift). Un tableau montre que le modèle **retrouve les paramètres** qui ont servi à générer les données.
- **Optimiseur de budget :** un algorithme propose la **meilleure répartition** du budget entre les 3 leviers (en égalisant les « rendements marginaux »). Ex : « passe de 55/30/15 à 49/2/49 → **+13 % de ventes en plus, sans dépenser un euro de plus** ». Un bouton **« Appliquer la reco »** déplace réellement les curseurs.

> 👉 Message : *« La mesure ne sert à rien si elle ne change pas la décision. Voilà la recommandation, chiffrée. »*

---

## 4. Les éléments transverses

- **Détail multi-levier & déduplication :** chaque levier a son iROAS, son coût, sa contribution. Surtout, le **reach est dédupliqué** : une personne touchée par les 3 leviers est comptée **une seule fois** (sinon on gonfle artificiellement la couverture). On montre aussi que l'audience **off-site est plafonnée par le consentement RGPD** (opt-in) — un vrai sujet chez Valiuz.
- **Drive-to-store & ROPO :** mesure de l'effet d'une pub **digitale** sur un achat **en magasin physique** (« Research Online, Purchase Offline »), par **zone de chalandise** (l'effet décroît avec la distance au magasin).
- **🤖 Copilote IA :** un assistant qui **commente les résultats en langage clair** (« votre iROAS de 3,27× dépasse le seuil de rentabilité… »), répond aux questions et recommande une réallocation. Trois garde-fous importants :
  1. il **ne calcule jamais** — il commente seulement des **chiffres déjà calculés** (un « snapshot » d'agrégats, jamais de données individuelles → cohérent avec une *data clean room* / RGPD) ;
  2. chaque **chiffre qu'il cite est revérifié** contre le snapshot (anti-hallucination) ;
  3. s'il n'y a pas de connexion / clé OpenAI, il **bascule automatiquement** sur une version locale déterministe → **la démo ne casse jamais**.

---

## 5. Sous le capot (vulgarisé)

- **Données simulées et « seedées » :** on génère un **panel de ~25 000 clients fictifs** (segment, fidélité, zone géographique, exposition aux leviers, achats…). « Seedé » = reproductible : les mêmes réglages donnent **toujours** les mêmes chiffres (indispensable pour une démo sans surprise).
- **On injecte un effet causal « vrai »** dans la simulation, puis les outils de mesure le **ré-estiment à l'aveugle**. C'est ce qui permet de **prouver** que la méthode est correcte (l'estimé retombe sur le vrai).
- **Tout est en TypeScript, dans le navigateur** : pas de serveur, pas de base de données, pas de Python. Les méthodes statistiques (bootstrap, moindres carrés, descente de coordonnées pour le MMM) sont **recodées à la main**. Avantage : ça se déploie en un clic et **marche hors-ligne**.

---

## 6. Petit glossaire

| Terme | Définition simple |
|---|---|
| **ROAS** | Ventes attribuées ÷ budget pub. *Corrélationnel* (inclut l'organique). |
| **iROAS** | ROAS **incrémental** : ventes **vraiment en plus** ÷ budget. *Causal*. |
| **Incrémentalité** | Le surcroît de ventes causé par la pub, mesuré exposés vs contrôle. |
| **Lift / uplift** | La différence de taux d'achat entre exposés et contrôle. |
| **Groupe contrôle / holdout / ghost ads** | Audience volontairement non exposée, pour servir de point de comparaison. |
| **Closed-loop / attribution déterministe** | Relier la pub vue à l'achat réel du même individu (via carte de fidélité). |
| **Reach dédupliqué** | Nombre de personnes uniques touchées (comptées une fois, tous leviers confondus). |
| **New-to-brand** | Acheteurs nouveaux pour la marque (vs réachat). |
| **ROPO** | « Research Online, Purchase Offline » : vu en ligne, acheté en magasin. |
| **MMM (Marketing Mix Modeling)** | Modèle qui relie dépense → ventes, avec adstock et saturation. |
| **Adstock** | Effet rémanent de la pub sur quelques jours. |
| **Saturation** | Rendements décroissants : trop de pression pub ne rapporte plus. |
| **Bootstrap** | Méthode pour estimer une fourchette d'incertitude (intervalle de confiance). |
| **CESP / eRetail Data Trust** | Le tiers de confiance qui certifie les indicateurs retail media en France. |

---

## 7. Comment l'utiliser

1. **Choisir un scénario** en haut (Decathlon, Auchan, Boulanger, Leroy Merlin) — chacun raconte une histoire différente (ex : Boulanger = panier élevé, peu de volume → fourchettes larges ; Auchan = fort volume, in-store dominant).
2. **Bouger les curseurs** à gauche : budget, durée, taille du groupe contrôle, **fenêtre d'attribution**, répartition des leviers… tout se recalcule en direct.
3. **Suivre les 3 actes** de haut en bas.
4. **Poser une question** au copilote IA à droite (ou cliquer une suggestion).
5. **Basculer clair / sombre** et **« IA : local ancré »** (pour montrer que ça marche sans connexion).

---

## 8. Ce que la démo démontre (pour l'entretien)

- **Compréhension métier de Valiuz** : les 3 leviers, la mesure closed-loop déterministe, l'iROAS, le drive-to-store, la contrainte RGPD, la certification CESP — exactement le périmètre de *Valiuz Connect*.
- **Rigueur Data Science** : inférence causale (test/contrôle), intervalles de confiance, MMM réellement fitté et calibré sur les lift tests, optimisation sous contrainte — et l'**honnêteté méthodologique** (on assume la simulation, on montre l'écart estimé-vs-vrai).
- **Profil AI Engineer moderne** : une couche GenAI utile **mais maîtrisée** (groundée, vérifiée, avec fallback), pas un gadget.
- **Sens produit & exécution** : une vraie app qui tourne, déployable, lisible par un public mixte data + business, et qui ne casse pas le jour J.
