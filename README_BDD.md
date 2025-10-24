# 🎵 Statify - Aspect Base de Données

> Documentation technique sur l'utilisation de MongoDB dans le projet Statify

## 📚 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Architecture des données](#-architecture-des-données)
- [Requêtes MongoDB implémentées](#-requêtes-mongodb-implémentées)
  - [1. CRUD de base](#1-crud-de-base)
  - [2. Recherches avancées](#2-recherches-avancées)
  - [3. Aggregation Pipelines](#3-aggregation-pipelines-)
  - [4. Jointures et Relations](#4-jointures-et-relations)
  - [5. Optimisations](#5-optimisations)
- [Concepts MongoDB démontrés](#-concepts-mongodb-démontrés)
- [Exemples détaillés](#-exemples-détaillés)

---

## 🎯 Vue d'ensemble

Statify est une application de gestion musicale qui utilise **MongoDB** comme base de données NoSQL. Le projet met en œuvre une variété de techniques avancées de requêtage pour démontrer la puissance et la flexibilité de MongoDB.

**Technologies utilisées :**
- MongoDB (via Mongoose ODM)
- NestJS (framework Node.js)
- TypeScript

---

## 📦 Architecture des données

### Collections principales

```
┌─────────────┐
│   Artists   │──┐
└─────────────┘  │
                 │  Relations
┌─────────────┐  │  (références)
│   Albums    │◄─┤
└─────────────┘  │
       │         │
       ▼         │
┌─────────────┐  │
│   Tracks    │◄─┘
└─────────────┘

┌─────────────┐     ┌─────────────┐
│   Users     │────▶│  Playlists  │
└─────────────┘     └─────────────┘
```

### Schémas de données

#### 🎤 **Artist**
```typescript
{
  _id: string,              // ID Spotify
  name: string,
  popularity: number,       // 0-100
  followers: number,
  genres: string[],         // Tableau de genres
  images: object[],
  album_ids: string[]
}
```

#### 💿 **Album**
```typescript
{
  _id: string,
  name: string,
  album_type: 'album' | 'single' | 'compilation',
  release_date: string,     // Format: YYYY-MM-DD
  popularity: number,
  label: string,
  artist_ids: string[],     // Références aux artistes
  track_ids: string[],      // Références aux tracks
  genres: string[],
  images: object[]
}
```

#### 🎵 **Track**
```typescript
{
  _id: string,
  name: string,
  album_id: string,         // Référence à l'album
  artist_ids: string[],     // Références aux artistes
  duration_ms: number,
  popularity: number,
  explicit: boolean,
  track_number: number,
  disc_number: number
}
```

### Index définis

```typescript
// Index textuels pour la recherche
@Schema({ indexes: [{ name: 'text' }] })

// Index composés implicites via populate
artist_ids, album_id
```

---

## 🔍 Requêtes MongoDB implémentées

### 1. CRUD de base

#### Création
```typescript
// albums.service.ts:22
const createdAlbum = new this.albumModel(createAlbumDto);
await createdAlbum.save();
```

#### Lecture
```typescript
// albums.service.ts:37
await this.albumModel.find().exec();

// albums.service.ts:44
await this.albumModel.findById(id).exec();
```

#### Mise à jour
```typescript
// albums.service.ts:61-63
await this.albumModel
  .findByIdAndUpdate(id, updateAlbumDto, { new: true })
  .exec();
```

#### Suppression
```typescript
// albums.service.ts:70
await this.albumModel.findByIdAndDelete(id).exec();
```

#### Upsert (Insert or Update)
```typescript
// albums.service.ts:77-79
await this.albumModel
  .findByIdAndUpdate(id, albumData, { upsert: true, new: true })
  .exec();
```

---

### 2. Recherches avancées

#### a) Recherche avec opérateur `$in`
**Fichier :** `albums.service.ts:50`
```typescript
// Trouver plusieurs albums par leurs IDs
return this.albumModel.find({ _id: { $in: ids } }).exec();
```

**Cas d'usage :** Récupérer tous les albums likés par un utilisateur.

---

#### b) Recherche case-insensitive avec Regex
**Fichier :** `search.service.ts:84`
```typescript
// Recherche textuelle flexible
const filter = {
  name: { $regex: query, $options: 'i' }  // 'i' = case-insensitive
};
await this.trackModel.find(filter).exec();
```

**Exemple :** Rechercher "NINHO" trouvera aussi "Ninho", "ninho", etc.

---

#### c) Filtres de comparaison
**Fichier :** `search.service.ts:88-95`
```typescript
// Filtrer par plage de popularité
if (filters?.minPopularity !== undefined || filters?.maxPopularity !== undefined) {
  filter.popularity = {};
  if (filters.minPopularity !== undefined) {
    filter.popularity.$gte = filters.minPopularity;  // Greater Than or Equal
  }
  if (filters.maxPopularity !== undefined) {
    filter.popularity.$lte = filters.maxPopularity;  // Less Than or Equal
  }
}
```

**Exemple :** Trouver les tracks avec une popularité entre 70 et 100.

---

#### d) Expressions complexes avec `$expr`
**Fichier :** `stats.service.ts:51-53`
```typescript
// Trouver les tracks collaboratives (plusieurs artistes)
const collaborativeTracksCount = await this.trackModel.countDocuments({
  $expr: { $gt: [{ $size: '$artist_ids' }, 1] }
});
```

**Explication :**
- `$size: '$artist_ids'` → compte le nombre d'artistes
- `$gt: [size, 1]` → vérifie si > 1
- `$expr` → permet d'utiliser des opérateurs d'agrégation dans les requêtes

---

#### e) Extraction et comparaison de dates
**Fichier :** `search.service.ts:189-205`
```typescript
// Filtrer les albums par plage d'années
if (filters?.fromYear || filters?.toYear) {
  filter.$expr = { $and: [] };

  if (filters?.fromYear) {
    filter.$expr.$and.push({
      $gte: [
        { $toInt: { $substr: ['$release_date', 0, 4] } },  // Extraire l'année
        filters.fromYear
      ]
    });
  }

  if (filters?.toYear) {
    filter.$expr.$and.push({
      $lte: [
        { $toInt: { $substr: ['$release_date', 0, 4] } },
        filters.toYear
      ]
    });
  }
}
```

**Opérateurs utilisés :**
- `$substr` → extraire une sous-chaîne (les 4 premiers caractères)
- `$toInt` → convertir en entier
- `$gte` / `$lte` → comparaisons
- `$and` → combinaison de conditions

---

### 3. Aggregation Pipelines ⭐

Les aggregation pipelines sont le **cœur** des fonctionnalités analytiques du projet.

#### a) Statistiques par année de sortie

**Fichier :** `albums.service.ts:114-155`

```typescript
const yearlyData = await this.albumModel.aggregate([
  // Étape 1: Extraire l'année de la date de sortie
  {
    $addFields: {
      year: { $substr: ['$release_date', 0, 4] }
    }
  },

  // Étape 2: Filtrer les années invalides
  {
    $match: {
      year: { $gte: '1900' }
    }
  },

  // Étape 3: Grouper par année et calculer les statistiques
  {
    $group: {
      _id: '$year',
      releases: { $sum: 1 },                    // Compter les sorties
      totalPopularity: { $sum: '$popularity' },  // Somme des popularités

      // Compter conditionnellement par type
      singles: {
        $sum: { $cond: [{ $eq: ['$album_type', 'single'] }, 1, 0] }
      },
      albums: {
        $sum: { $cond: [{ $eq: ['$album_type', 'album'] }, 1, 0] }
      },
      compilations: {
        $sum: { $cond: [{ $eq: ['$album_type', 'compilation'] }, 1, 0] }
      }
    }
  },

  // Étape 4: Projeter et calculer la moyenne
  {
    $project: {
      _id: 0,
      period: '$_id',
      releases: 1,
      avgPopularity: {
        $round: [{ $divide: ['$totalPopularity', '$releases'] }, 0]
      },
      singles: 1,
      albums: 1,
      compilations: 1
    }
  },

  // Étape 5: Trier par période
  {
    $sort: { period: 1 }
  }
]).exec();
```

**Résultat exemple :**
```json
[
  {
    "period": "2020",
    "releases": 145,
    "avgPopularity": 68,
    "singles": 89,
    "albums": 45,
    "compilations": 11
  },
  {
    "period": "2021",
    "releases": 167,
    "avgPopularity": 72,
    "singles": 102,
    "albums": 53,
    "compilations": 12
  }
]
```

**Concepts démontrés :**
- `$addFields` → ajout de champs calculés
- `$match` → filtrage
- `$group` → agrégation avec accumulateurs (`$sum`)
- `$cond` → conditions (équivalent de IF/ELSE)
- `$project` → sélection et transformation de champs
- `$divide`, `$round` → opérations mathématiques
- `$sort` → tri

---

#### b) Statistiques par label

**Fichier :** `albums.service.ts:234-267`

```typescript
const labelStats = await this.albumModel.aggregate([
  // Étape 1: Grouper par label
  {
    $group: {
      _id: '$label',
      albumCount: { $sum: 1 },
      trackCount: { $sum: { $size: '$track_ids' } },  // Compter les éléments du tableau
      totalPopularity: { $sum: '$popularity' },

      singles: {
        $sum: { $cond: [{ $eq: ['$album_type', 'single'] }, 1, 0] }
      },
      albums: {
        $sum: { $cond: [{ $eq: ['$album_type', 'album'] }, 1, 0] }
      },
      compilations: {
        $sum: { $cond: [{ $eq: ['$album_type', 'compilation'] }, 1, 0] }
      }
    }
  },

  // Étape 2: Projeter et calculer la moyenne
  {
    $project: {
      _id: 0,
      label: '$_id',
      albumCount: 1,
      trackCount: 1,
      avgPopularity: {
        $round: [{ $divide: ['$totalPopularity', '$albumCount'] }, 0]
      },
      singles: 1,
      albums: 1,
      compilations: 1
    }
  },

  // Étape 3: Trier par popularité moyenne
  {
    $sort: { avgPopularity: -1 }
  }
]).exec();
```

**Résultat exemple :**
```json
[
  {
    "label": "Universal Music",
    "albumCount": 234,
    "trackCount": 3456,
    "avgPopularity": 75,
    "singles": 145,
    "albums": 78,
    "compilations": 11
  },
  {
    "label": "Sony Music",
    "albumCount": 189,
    "trackCount": 2789,
    "avgPopularity": 71,
    "singles": 112,
    "albums": 65,
    "compilations": 12
  }
]
```

**Nouveaux concepts :**
- `$size` → compter les éléments d'un tableau
- Agrégation multi-niveaux

---

#### c) Moyenne de popularité globale

**Fichier :** `stats.service.ts:32-39`

```typescript
const avgPopularityResult = await this.artistModel.aggregate([
  {
    $group: {
      _id: null,                              // null = grouper TOUS les documents
      avgPopularity: { $avg: '$popularity' }  // Calculer la moyenne
    }
  }
]);

const avgPopularity = avgPopularityResult.length > 0
  ? Math.round(avgPopularityResult[0].avgPopularity)
  : 0;
```

**Concept :** `$avg` → accumulateur pour calculer une moyenne.

---

#### d) Distribution par type d'album

**Fichier :** `stats.service.ts:73-80`

```typescript
const albumTypesResult = await this.albumModel.aggregate([
  {
    $group: {
      _id: '$album_type',
      count: { $count: {} }    // Équivalent de $sum: 1
    }
  }
]);
```

**Résultat exemple :**
```json
[
  { "_id": "album", "count": 456 },
  { "_id": "single", "count": 789 },
  { "_id": "compilation", "count": 34 }
]
```

---

### 4. Jointures et Relations

#### a) `populate()` - Jointure simple

**Fichier :** `search.service.ts:105-106`

```typescript
const tracks = await this.trackModel
  .find(filter)
  .populate('album_id', 'name images release_date')  // Jointure avec Album
  .populate('artist_ids', 'name')                    // Jointure avec Artists
  .exec();
```

**Équivalent SQL :**
```sql
SELECT t.*, a.name, a.images, ar.name
FROM tracks t
LEFT JOIN albums a ON t.album_id = a._id
LEFT JOIN artists ar ON t.artist_ids CONTAINS ar._id
```

**Résultat :**
```json
{
  "_id": "track123",
  "name": "Booska",
  "album_id": {
    "name": "Destin",
    "images": [...]
  },
  "artist_ids": [
    { "name": "Ninho" }
  ]
}
```

---

#### b) Requêtes avec multiples références

**Fichier :** `collaborations.service.ts:56-63`

```typescript
// Récupérer les tracks collaboratives pour des artistes spécifiques
const collaborativeTracks = await this.trackModel
  .find({
    $expr: { $gt: [{ $size: '$artist_ids' }, 1] },  // Plusieurs artistes
    artist_ids: { $in: frenchRapArtistIds }         // Dans la liste
  })
  .select('artist_ids')   // Sélectionner uniquement ce champ
  .lean()                 // Optimisation: objets JS simples
  .exec();
```

---

### 5. Optimisations

#### a) Sélection de champs avec `.select()`

**Fichier :** `stats.service.ts:56-59`

```typescript
// Ne récupérer que les champs nécessaires (économise la bande passante)
const albumsOnly = await this.albumModel
  .find({ album_type: 'album' })
  .select('track_ids')  // Seulement le champ track_ids
  .exec();
```

---

#### b) `.lean()` pour meilleures performances

**Fichier :** `collaborations.service.ts:50`

```typescript
const frenchRapArtists = await this.artistModel
  .find({ genres: { $in: ['french rap'] } })
  .lean()  // Retourne des objets JS simples au lieu de documents Mongoose
  .exec();
```

**Avantage :** Plus rapide (pas d'hydratation Mongoose), moins de mémoire.

---

#### c) `distinct()` pour valeurs uniques

**Fichier :** `stats.service.ts:47`

```typescript
// Récupérer tous les labels uniques
const uniqueLabelsResult = await this.albumModel.distinct('label').exec();
```

**Équivalent SQL :**
```sql
SELECT DISTINCT label FROM albums;
```

---

#### d) Pagination

**Fichier :** `search.service.ts:100-104`

```typescript
const tracks = await this.trackModel
  .find(filter)
  .sort({ popularity: -1 })
  .skip((page - 1) * limit)  // Sauter les N premiers résultats
  .limit(limit)              // Limiter à N résultats
  .exec();
```

---

#### e) Comptage optimisé

**Fichier :** `stats.service.ts:25-29`

```typescript
// Compter sans récupérer les documents (plus rapide)
const [totalArtists, totalAlbums, totalTracks] = await Promise.all([
  this.artistModel.countDocuments().exec(),
  this.albumModel.countDocuments().exec(),
  this.trackModel.countDocuments().exec(),
]);
```

---

## 📊 Concepts MongoDB démontrés

### Tableau récapitulatif

| Concept | Implémenté | Fichier principal | Difficulté |
|---------|------------|-------------------|------------|
| **CRUD de base** | ✅ | Tous les services | 🟢 Facile |
| **Opérateur `$in`** | ✅ | albums, collaborations | 🟢 Facile |
| **Opérateur `$regex`** | ✅ | search | 🟢 Facile |
| **Opérateurs de comparaison** (`$gte`, `$lte`) | ✅ | search | 🟢 Facile |
| **`$expr` avec `$size`** | ✅ | stats, collaborations | 🟡 Moyen |
| **`$substr`, `$toInt`** | ✅ | search, albums | 🟡 Moyen |
| **Aggregation `$group`** | ✅ | albums, stats | 🟡 Moyen |
| **Aggregation `$project`** | ✅ | albums | 🟡 Moyen |
| **Aggregation `$addFields`** | ✅ | albums | 🟡 Moyen |
| **Opérateur `$cond`** | ✅ | albums | 🟡 Moyen |
| **Accumulateurs** (`$sum`, `$avg`) | ✅ | albums, stats | 🟡 Moyen |
| **Opérations mathématiques** (`$divide`, `$round`) | ✅ | albums | 🟡 Moyen |
| **`populate()` (jointures)** | ✅ | search, tracks | 🟡 Moyen |
| **Pipeline complexe multi-étapes** | ✅ | albums | 🔴 Avancé |
| **`distinct()`** | ✅ | stats | 🟢 Facile |
| **`upsert`** | ✅ | albums, tracks | 🟢 Facile |
| **Pagination** | ✅ | search, users | 🟢 Facile |
| **`.lean()` (optimisation)** | ✅ | collaborations | 🟡 Moyen |
| **Index textuels** | ✅ | Schemas | 🟡 Moyen |

---

## 🎓 Exemples détaillés

### Exemple 1 : Analyse des collaborations

**Problème :** Trouver quels artistes du rap français collaborent le plus ensemble.

**Solution :** `collaborations.service.ts:39-132`

```typescript
async getCollaborations(minCollabCount: number = 1) {
  // 1. Récupérer les top 300 artistes de rap français
  const frenchRapArtists = await this.artistModel
    .find({
      genres: { $in: ['french rap', 'french hip hop', 'rap francais'] }
    })
    .sort({ popularity: -1 })
    .limit(300)
    .select('_id')
    .lean()
    .exec();

  const frenchRapArtistIds = frenchRapArtists.map(a => a._id.toString());

  // 2. Trouver les tracks collaboratives impliquant ces artistes
  const collaborativeTracks = await this.trackModel
    .find({
      $expr: { $gt: [{ $size: '$artist_ids' }, 1] },  // Plus d'un artiste
      artist_ids: { $in: frenchRapArtistIds }          // Au moins un artiste français
    })
    .select('artist_ids')
    .lean()
    .exec();

  // 3. Compter les collaborations (traitement en mémoire)
  const collabMap = new Map();
  const frenchRapArtistSet = new Set(frenchRapArtistIds);

  collaborativeTracks.forEach((track) => {
    // Filtrer pour ne garder que les artistes français
    const frenchArtistsInTrack = track.artist_ids.filter(id =>
      frenchRapArtistSet.has(id)
    );

    if (frenchArtistsInTrack.length > 1) {
      // Compter toutes les paires
      for (let i = 0; i < frenchArtistsInTrack.length; i++) {
        for (let j = i + 1; j < frenchArtistsInTrack.length; j++) {
          const key = [frenchArtistsInTrack[i], frenchArtistsInTrack[j]]
            .sort()
            .join('-');
          collabMap.set(key, (collabMap.get(key) || 0) + 1);
        }
      }
    }
  });

  // 4. Filtrer et formater les résultats
  const collaborations = Array.from(collabMap.entries())
    .map(([key, count]) => {
      const [artist1, artist2] = key.split('-');
      return { artist1, artist2, count };
    })
    .filter(collab => collab.count >= minCollabCount);

  return collaborations;
}
```

**Résultat exemple :**
```json
[
  { "artist1": "ninho_id", "artist2": "soolking_id", "count": 12 },
  { "artist1": "jul_id", "artist2": "soso_id", "count": 8 }
]
```

**Techniques utilisées :**
- `$in` pour filtrer par genre
- `$expr` + `$size` pour détecter les collaborations
- `.lean()` pour optimiser
- Traitement hybride (MongoDB + JavaScript)

---

### Exemple 2 : Recherche multi-critères

**Problème :** Rechercher des albums avec plusieurs filtres (nom, popularité, genre, année).

**Solution :** `search.service.ts:150-249`

```typescript
async searchAlbums(query: string, filters?: {...}) {
  // Construction dynamique du filtre
  const filter: any = {
    name: { $regex: query, $options: 'i' }
  };

  // Filtre de popularité
  if (filters?.minPopularity !== undefined || filters?.maxPopularity !== undefined) {
    filter.popularity = {};
    if (filters.minPopularity !== undefined) {
      filter.popularity.$gte = filters.minPopularity;
    }
    if (filters.maxPopularity !== undefined) {
      filter.popularity.$lte = filters.maxPopularity;
    }
  }

  // Filtre de genre
  if (filters?.genre) {
    filter.genres = { $regex: filters.genre, $options: 'i' };
  }

  // Filtre d'année
  if (filters?.year) {
    filter.release_date = { $regex: `^${filters.year}` };
  } else if (filters?.fromYear || filters?.toYear) {
    filter.$expr = { $and: [] };
    if (filters?.fromYear) {
      filter.$expr.$and.push({
        $gte: [
          { $toInt: { $substr: ['$release_date', 0, 4] } },
          filters.fromYear
        ]
      });
    }
    if (filters?.toYear) {
      filter.$expr.$and.push({
        $lte: [
          { $toInt: { $substr: ['$release_date', 0, 4] } },
          filters.toYear
        ]
      });
    }
  }

  // Exécution avec pagination
  const [albums, total] = await Promise.all([
    this.albumModel
      .find(filter)
      .sort({ popularity: -1 })
      .skip(skip)
      .limit(limit)
      .populate('artist_ids', 'name')
      .exec(),
    this.albumModel.countDocuments(filter).exec()
  ]);

  return { albums, total };
}
```

**Exemple d'appel :**
```typescript
searchAlbums('Destin', {
  minPopularity: 70,
  maxPopularity: 100,
  genre: 'rap',
  fromYear: 2020,
  toYear: 2024
});
```

**Techniques utilisées :**
- Construction dynamique de filtres
- Combinaison de `$regex`, `$gte`, `$lte`
- `$expr` pour comparaisons complexes
- `Promise.all()` pour exécuter requête + comptage en parallèle
- `populate()` pour enrichir les résultats

---

## 🚀 Points forts du projet

1. **Diversité des requêtes** : Du CRUD simple aux aggregations complexes
2. **Optimisations** : `.lean()`, `.select()`, caching, pagination
3. **Aggregation pipelines** : Plusieurs étapes avec transformations complexes
4. **Recherche flexible** : Regex, filtres multiples, expressions
5. **Relations** : Gestion des références via `populate()`
6. **Opérateurs avancés** : `$expr`, `$size`, `$substr`, `$toInt`, `$cond`
7. **Calculs** : Moyennes, sommes, comptages conditionnels

---

## 📁 Fichiers clés à examiner

### Pour les aggregations complexes
- `api/src/albums/albums.service.ts` (lignes 114-293)
- `api/src/stats/stats.service.ts` (lignes 19-257)

### Pour les recherches avancées
- `api/src/search/search.service.ts` (lignes 22-381)

### Pour les requêtes avec `$expr`
- `api/src/collaborations/collaborations.service.ts` (lignes 39-132)
- `api/src/stats/stats.service.ts` (lignes 51-53)

### Pour les relations et jointures
- `api/src/search/search.service.ts` (populate)
- `api/src/albums/albums.service.ts` (lignes 92-110)

---

## 💡 Pour aller plus loin

Si vous voulez améliorer encore le projet, voici quelques pistes :

### 1. Index composés
```typescript
@Schema({
  indexes: [
    { artist_ids: 1, popularity: -1 },
    { release_date: 1, album_type: 1 }
  ]
})
```

### 2. `$lookup` pour jointures manuelles
```typescript
aggregate([
  {
    $lookup: {
      from: 'artists',
      localField: 'artist_ids',
      foreignField: '_id',
      as: 'artists'
    }
  }
])
```

### 3. `$unwind` pour déplier des tableaux
```typescript
aggregate([
  { $unwind: '$genres' },
  { $group: { _id: '$genres', count: { $sum: 1 } } }
])
```

### 4. `$facet` pour plusieurs aggregations en parallèle
```typescript
aggregate([
  {
    $facet: {
      byYear: [
        { $group: { _id: '$year', count: { $sum: 1 } } }
      ],
      byLabel: [
        { $group: { _id: '$label', count: { $sum: 1 } } }
      ]
    }
  }
])
```

---

## 📝 Conclusion

Ce projet démontre une **maîtrise solide** de MongoDB avec :

- ✅ 15+ types de requêtes différentes
- ✅ Aggregation pipelines multi-étapes
- ✅ Opérateurs avancés (`$expr`, `$cond`, `$substr`, etc.)
- ✅ Optimisations de performance
- ✅ Gestion des relations entre collections

Les fichiers les plus pertinents pour une évaluation BDD sont :
1. **albums.service.ts** (aggregations complexes)
2. **stats.service.ts** (statistiques et calculs)
3. **search.service.ts** (recherche multi-critères)
4. **collaborations.service.ts** (requêtes avancées)

---

*Projet réalisé dans le cadre du cours de Base de Données*
