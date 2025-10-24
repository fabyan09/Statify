# Page Discover - Documentation Technique

> **Note :** Cette documentation a été réalisée dans le cadre d'un projet académique de Base de Données.

---

## 📋 Vue d'ensemble

La page **Discover** est un **système de recommandation musicale personnalisé** qui analyse automatiquement les préférences de l'utilisateur pour proposer du contenu musical pertinent.

**Localisation :**
- **Frontend :** `/web/app/discover/page.tsx` (affichage)
- **Backend :** `/api/src/recommendations/recommendations.service.ts` (algorithme)

**Principe :** L'algorithme côté serveur analyse la bibliothèque de l'utilisateur (artistes favoris, albums likés, tracks sauvegardées) pour générer **6 sections de recommandations** personnalisées.

---

## 🧠 Algorithme de Recommandation

### Localisation
Le calcul des recommandations est effectué **côté backend** (NestJS) dans le service `RecommendationsService`.

### Étapes principales

#### 1. Analyse des préférences utilisateur

L'algorithme commence par extraire les goûts de l'utilisateur en analysant sa bibliothèque :

```typescript
// Analyse des genres favoris (avec compteur de fréquence)
const favoriteGenres = new Map<string, number>();

// Depuis les artistes favoris
favoriteArtistsData.forEach(artist => {
  artist.genres?.forEach(genre => {
    favoriteGenres.set(genre, (favoriteGenres.get(genre) || 0) + 1);
  });
});

// Analyse des labels favoris
const favoriteLabels = new Map<string, number>();
likedAlbumsData.forEach(album => {
  if (album.label) {
    favoriteLabels.set(album.label, (favoriteLabels.get(album.label) || 0) + 1);
  }
});
```

**Techniques utilisées :**
- `Map<string, number>` pour compter les occurrences de genres/labels
- Analyse croisée : artistes + albums + tracks pour avoir une vue complète

---

#### 2. Génération des 6 sections

##### Section 1 : Artistes recommandés (par genre)

**Requête MongoDB :**
```typescript
const similarArtists = await this.artistModel
  .find({
    _id: { $nin: user.favorite_artists },  // Exclure les artistes déjà likés
    genres: { $in: genresArray },          // Genres en commun
  })
  .sort({ popularity: -1 })                // Trier par popularité
  .limit(8)
  .exec();
```

**Concepts MongoDB :**
- `$nin` (Not In) : exclusion d'éléments
- `$in` : recherche dans un tableau
- `.sort()` et `.limit()` : pagination et tri

---

##### Section 2 : Albums de labels préférés

**Logique :**
1. Extraire les 3 labels les plus fréquents
2. Trouver des albums de ces labels non encore likés

**Requête MongoDB :**
```typescript
const topLabels = Array.from(favoriteLabels.entries())
  .sort((a, b) => b[1] - a[1])  // Tri par fréquence
  .slice(0, 3)
  .map(([label]) => label);

const albumsFromLabels = await this.albumModel
  .find({
    label: { $in: topLabels },
    _id: { $nin: user.liked_albums },
  })
  .sort({ popularity: -1 })
  .limit(8)
  .exec();
```

---

##### Section 3 : Nouveautés récentes

**Critères :**
- Albums sortis dans les **2 dernières années**
- Dans les genres favoris de l'utilisateur

**Requête MongoDB :**
```typescript
const twoYearsAgo = new Date();
twoYearsAgo.setFullYear(currentYear - 2);

const recentAlbums = await this.albumModel
  .find({
    _id: { $nin: user.liked_albums },
    genres: { $in: genresArray },
    release_date: { $gte: twoYearsAgo.toISOString() },  // Comparaison de dates
  })
  .sort({ release_date: -1 })  // Plus récents en premier
  .limit(8)
  .exec();
```

**Concepts MongoDB :**
- `$gte` (Greater Than or Equal) : comparaison de dates
- Tri par date décroissante

---

##### Section 4 : Tracks populaires (genres similaires)

**Logique en 2 étapes :**
1. Trouver les artistes dans les genres favoris
2. Récupérer les tracks populaires de ces artistes

**Requêtes MongoDB :**
```typescript
// Étape 1: Trouver les artistes
const artistsInGenres = await this.artistModel
  .find({ genres: { $in: genresArray } })
  .select('_id')  // Ne récupérer que les IDs (optimisation)
  .limit(100)
  .exec();

// Étape 2: Trouver les tracks
const popularTracks = await this.trackModel
  .find({
    _id: { $nin: user.liked_tracks },
    artist_ids: { $in: artistIds },
  })
  .populate('album_id')  // Jointure avec la collection albums
  .sort({ popularity: -1 })
  .limit(10)
  .exec();
```

**Concepts MongoDB :**
- `.select()` : projection de champs (optimisation)
- `.populate()` : équivalent d'une jointure SQL
- Requêtes en cascade (résultat 1 → filtre 2)

---

##### Section 5 : Tendances actuelles

**Critère simple :**
- Tracks avec une **popularité ≥ 70**

**Requête MongoDB :**
```typescript
const trendingTracks = await this.trackModel
  .find({
    _id: { $nin: user.liked_tracks },
    popularity: { $gte: 70 },
  })
  .populate('album_id')
  .sort({ popularity: -1 })
  .limit(10)
  .exec();
```

---

##### Section 6 : Artistes populaires (Fallback)

**Condition :** Affichée uniquement si l'utilisateur n'a pas assez de préférences (< 3 sections générées)

**Requête MongoDB :**
```typescript
const popularArtists = await this.artistModel
  .find({ _id: { $nin: user.favorite_artists } })
  .sort({ popularity: -1 })
  .limit(8)
  .exec();
```

---

## 💾 Système de Cache

### Stratégie de cache
Les recommandations sont **stockées en base de données** (dans le document utilisateur) pour éviter de recalculer à chaque visite.

**Durée de validité :** 24 heures

```typescript
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 heures

// Vérification de la fraîcheur du cache
const isFresh = hasRecommendations &&
  (now.getTime() - new Date(user.recommendations.lastUpdated).getTime()) < CACHE_DURATION_MS;

if (isFresh) {
  // Retourner le cache
  return this.populateRecommendations(user.recommendations.sections);
}
```

**Stockage optimisé :**
- Seuls les **IDs** des items sont stockés dans le user document
- Les objets complets sont récupérés à la lecture via `.populate()`

```typescript
// Stockage (IDs seulement)
await this.userModel.findByIdAndUpdate(userId, {
  recommendations: {
    sections: sectionsWithIds,  // { itemIds: ["id1", "id2", ...] }
    lastUpdated: now,
  },
});

// Lecture (populate avec objets complets)
items = await this.artistModel.find({ _id: { $in: section.itemIds } }).exec();
```

---

## 🎨 Interface Utilisateur

### Layout par type de contenu

Le frontend affiche les recommandations différemment selon le type :

#### Artistes
- **Layout :** Grid responsive (2-4 colonnes)
- **Image :** Circulaire
- **Infos :** Nom, genres (max 2), popularité
- **Actions :** Like + Lien Spotify

#### Albums
- **Layout :** Grid responsive (2-4 colonnes)
- **Image :** Carrée arrondie
- **Infos :** Nom, type, année, popularité
- **Actions :** Like + Lien Spotify

#### Tracks
- **Layout :** Liste verticale (2 colonnes sur desktop)
- **Image :** Mini pochette d'album
- **Infos :** Nom, durée, popularité, badge explicit
- **Actions :** Like + Preview Spotify

### Navigation entre sections

**Menu flottant en bas de page** avec :
- Icônes pour chaque section
- Badge avec nombre d'items
- Auto-scroll au clic
- Mise en surbrillance de la section active

```typescript
// Détection de la section visible
const handleScroll = () => {
  sections.forEach((section, index) => {
    const rect = section.getBoundingClientRect();
    const visibleArea = /* calcul de surface visible */ ;
    if (visibleArea > maxVisibleArea) {
      setActiveSection(index);
    }
  });
};
```

---

## 🏗️ Architecture Technique

### Backend (NestJS)

```
┌────────────────────────────────────────┐
│  RecommendationsController             │
│  GET /recommendations/:userId          │
└─────────────┬──────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│  RecommendationsService                │
│  - getRecommendations()                │
│  - computeRecommendations()            │
│  - populateRecommendations()           │
└─────────────┬──────────────────────────┘
              │
              ▼
┌────────────────────────────────────────┐
│  MongoDB (Mongoose Models)             │
│  - User (avec cache recommendations)   │
│  - Artist, Album, Track                │
└────────────────────────────────────────┘
```

### Frontend (Next.js)

```typescript
// Hook React Query
const { data: recommendationsData } = useRecommendations(userId);

// Structure des données
interface RecommendationSection {
  title: string;
  description: string;
  icon: string;  // 'sparkles', 'tag', 'clock', etc.
  type: 'artist' | 'album' | 'track';
  items: (Artist | Album | Track)[];
}
```

---

## 📊 Requêtes MongoDB Utilisées

| Opérateur | Utilisation | Section |
|-----------|-------------|---------|
| `$in` | Filtrer par tableau de valeurs | Toutes |
| `$nin` | Exclure des valeurs (items déjà likés) | Toutes |
| `$gte` | Comparaison de dates et popularité | Nouveautés, Tendances |
| `.sort()` | Tri par popularité/date | Toutes |
| `.limit()` | Limiter le nombre de résultats | Toutes |
| `.select()` | Projection (optimisation) | Section 4 |
| `.populate()` | Jointure (tracks → albums) | Sections 4 et 5 |
| `.exec()` | Exécution de la requête | Toutes |

---

## 🎯 Défis Techniques Rencontrés

### 1. Performance des requêtes

**Problème :** Calculer 6 sections = 6+ requêtes MongoDB par utilisateur

**Solution :**
- Cache de 24h en base de données
- Stockage des IDs uniquement (pas d'objets complets)
- Utilisation de `.select()` pour limiter les champs récupérés

### 2. Gestion des utilisateurs sans préférences

**Problème :** Que recommander à un nouvel utilisateur ?

**Solution :**
- Fallback vers des recommandations génériques (popularité globale)
- Section "Artistes populaires" si moins de 3 sections générées

### 3. Éviter de recommander du contenu déjà liké

**Problème :** Ne pas proposer ce que l'utilisateur a déjà

**Solution :**
- Utilisation systématique de `$nin` (Not In) pour filtrer
- Vérification côté frontend pour afficher l'état du like

---

## 🔄 Flux de Données Complet

```
1. User clique sur "Discover"
   │
   ▼
2. Frontend appelle GET /recommendations/:userId
   │
   ▼
3. Backend vérifie le cache (24h)
   │
   ├─ Si frais → Retourne cache + populate
   │
   └─ Si expiré → Calcule nouvelles recommandations
      │
      ├─ Analyse genres/labels favoris (Maps)
      │
      ├─ Exécute 6 requêtes MongoDB en séquence
      │
      ├─ Sauvegarde en cache (IDs seulement)
      │
      └─ Retourne sections avec objets complets
   │
   ▼
4. Frontend reçoit les sections
   │
   ▼
5. Affichage par type (artists/albums/tracks)
   │
   ▼
6. User peut like/unlike → Mutation React Query
```

---

## 🚀 Points Forts Techniques

### Côté Base de Données
- ✅ Utilisation de **Maps** pour comptage O(1)
- ✅ Requêtes MongoDB optimisées avec `.select()` et `.limit()`
- ✅ **Jointures** via `.populate()` (tracks ↔ albums)
- ✅ Cache intelligent avec TTL (Time To Live)
- ✅ Opérateurs avancés : `$in`, `$nin`, `$gte`

### Côté Architecture
- ✅ Séparation frontend/backend (API REST)
- ✅ Service dédié avec logger (NestJS)
- ✅ React Query pour le cache côté client
- ✅ UI responsive avec layouts adaptés par type

---

## 📝 Concepts de BDD Illustrés

| Concept | Implémentation |
|---------|----------------|
| **Cache** | Stockage des recommandations avec TTL 24h |
| **Projection** | `.select('_id')` pour ne récupérer que les IDs |
| **Jointures** | `.populate('album_id')` équivalent LEFT JOIN |
| **Index** | Tri rapide par `popularity` (index implicite) |
| **Opérateurs de tableau** | `$in`, `$nin` pour filtrer les arrays |
| **Comparaison** | `$gte` pour dates et popularité |
| **Agrégation (logique)** | Comptage de genres/labels avec Maps |
| **Normalisation** | Relations Artist ↔ Album ↔ Track |

---

## 🎓 Conclusion

La page **Discover** démontre :
- Une **architecture full-stack** complète (Frontend React + Backend NestJS + MongoDB)
- L'utilisation de **requêtes MongoDB avancées** (filtrage, tri, jointures)
- Un **système de cache intelligent** pour optimiser les performances
- Une **UI adaptative** selon le type de contenu

Le moteur de recommandations combine analyse de préférences et requêtes optimisées pour offrir une expérience personnalisée tout en restant performant.

---

*Projet réalisé dans le cadre du cours de Base de Données*
