# <img src="https://media.naiart.fr/logo-statify.png" alt="Statify" width="30" style="vertical-align: middle;"/>&nbsp;&nbsp;Statify

> Plateforme complète d'analytics musicales et de recommandations personnalisées, intégrant l'API Spotify et MongoDB pour une expérience musicale enrichie.

[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.5-000000?logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.19.1-47A248?logo=mongodb)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)](https://react.dev/)

---

## 📋 Table des Matières

- [À propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [API Endpoints](#-api-endpoints)
- [Base de Données](#-base-de-données)
- [Captures d'écran](#-captures-décran)
- [Documentation](#-documentation)
- [Contributeurs](#-contributeurs)

---

## 🎯 À propos

**Statify** est une application full-stack moderne de gestion et d'analyse musicale. Elle combine une interface web réactive avec une API REST puissante et une base de données MongoDB pour offrir :

- 🎧 Gestion complète de bibliothèque musicale (artistes, albums, tracks, playlists)
- 🤖 Moteur de recommandations personnalisées basé sur les préférences utilisateur
- 📊 Tableaux de bord analytiques avec visualisations interactives
- 🌐 Réseau de collaborations entre artistes (focus rap français)
- 🔍 Recherche full-text avancée avec filtres multiples
- 🎤 Intégration complète avec l'API Spotify

Le projet met particulièrement l'accent sur les **requêtes MongoDB avancées** (aggregation pipelines, expressions complexes) et démontre une maîtrise approfondie des concepts de base de données NoSQL.

---

## ✨ Fonctionnalités

### 🎵 Gestion Musicale

- **Bibliothèque Utilisateur**
  - Sauvegarder tracks, albums, et artistes favoris
  - Synchronisation avec Spotify
  - Gestion de playlists publiques/privées
  - Playlists collaboratives

- **Recherche Avancée**
  - Recherche full-text case-insensitive
  - Filtres multi-critères (genre, année, popularité)
  - Recherche across 5 types de contenu (tracks, albums, artists, playlists, users)
  - Pagination et tri par pertinence

### 🤖 Recommandations Intelligentes

Moteur de recommandations avec **6 sections personnalisées** :

1. **Artistes Similaires** - Basé sur l'affinité de genres
2. **Albums de Labels Favoris** - Découverte par label
3. **Sorties Récentes** - Nouveautés de l'année en cours
4. **Tracks d'Artistes Similaires** - Exploration approfondie
5. **Tracks Tendance** - Popularité >= 70
6. **Albums Classiques** - Par décennie préférée

**Algorithme :**
- Analyse multi-dimensionnelle (genre, label, période, popularité)
- Scoring personnalisé basé sur la bibliothèque utilisateur
- Cache serveur avec TTL (1 heure)

### 📊 Analytics & Visualisations

#### 1. Dashboard Principal
- KPIs en temps réel (total artists, albums, tracks)
- Top 10 artistes par popularité
- Statistiques de bibliothèque utilisateur

#### 2. Release Cohorts
- Timeline des sorties par année/mois
- Distribution par type (album, single, compilation)
- Évolution de la popularité moyenne

#### 3. Label Lens
- Statistiques par maison de disques
- Nombre d'albums, tracks, popularité moyenne
- Classement des labels les plus actifs

#### 4. Collaboration Network
- Graphe interactif force-directed
- Visualisation des collaborations (focus rap français)
- Top collaborations et statistiques détaillées
- Paramètres ajustables (charge, distance, nombre de nœuds)

### 🔐 Authentification & Utilisateurs

- Système de comptes utilisateurs
- Hashage de mots de passe (bcrypt)
- Gestion de sessions via Context API
- Routes protégées

---

## 🛠 Tech Stack

### Frontend (Web)

| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| **Next.js** | 15.5.5 | Framework React avec App Router & Turbopack |
| **React** | 19.1.0 | Bibliothèque UI |
| **TypeScript** | 5.x | Typage statique |
| **TanStack Query** | 5.90.3 | Gestion d'état serveur & cache |
| **Tailwind CSS** | 4.x | Framework CSS utilitaire |
| **Radix UI** | Latest | Composants accessibles |
| **Recharts** | 3.2.1 | Graphiques & visualisations |
| **react-force-graph-2d** | 1.29.0 | Graphe de réseau interactif |
| **Lucide React** | 0.545.0 | Icônes |
| **Motion** | 12.23.24 | Animations |

### Backend (API)

| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| **NestJS** | 11.0.1 | Framework Node.js structuré |
| **TypeScript** | 5.7.3 | Langage principal |
| **MongoDB** | 8.19.1 | Base de données NoSQL |
| **Mongoose** | 11.0.3 | ODM pour MongoDB |
| **Cache Manager** | 7.2.4 | Système de cache en mémoire |
| **bcrypt** | 6.0.0 | Hashage de mots de passe |
| **Spotify SDK** | 1.2.0 | Intégration API Spotify |
| **Jest** | 29.7.0 | Tests unitaires & e2e |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│                         Port 3001                            │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Dashboard│  │  Search  │  │ Discover │  │  Network │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          React Query (Cache & State)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        │ HTTP Requests
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                      Backend (NestJS)                        │
│                         Port 3000                            │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Albums  │  │ Artists │  │  Tracks  │  │   Search    │  │
│  │ Module  │  │ Module  │  │  Module  │  │   Module    │  │
│  └─────────┘  └─────────┘  └──────────┘  └─────────────┘  │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────┐  │
│  │  Users  │  │Playlists│  │  Stats   │  │Recommenda-  │  │
│  │ Module  │  │ Module  │  │  Module  │  │tions Module │  │
│  └─────────┘  └─────────┘  └──────────┘  └─────────────┘  │
│                                                              │
│  ┌──────────────────────┐   ┌──────────────────────────┐   │
│  │   Cache Manager      │   │   Spotify Service        │   │
│  │   (In-Memory TTL)    │   │   (External API)         │   │
│  └──────────────────────┘   └──────────────────────────┘   │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        │ Mongoose ODM
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                       MongoDB Database                       │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Artists │  │ Albums  │  │  Tracks  │  │    Users    │  │
│  └─────────┘  └─────────┘  └──────────┘  └─────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               Playlists                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Indexes: Text indexes, References, Unique fields    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Flux de Données

1. **User Interaction** → Frontend (Next.js)
2. **API Call** → React Query (cache check)
3. **HTTP Request** → Backend API (NestJS)
4. **Cache Check** → Cache Manager (si applicable)
5. **Database Query** → MongoDB via Mongoose
6. **Aggregation/Processing** → NestJS Services
7. **Response** → Frontend → UI Update

---

## 🚀 Installation

### Prérequis

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** >= 6.x (local ou Atlas)
- **Compte Spotify Developer** (pour les credentials API)

### 1. Cloner le repository

```bash
git clone https://github.com/fabyan09/Statify.git
cd Statify
```

### 2. Configuration Backend

```bash
cd api
npm install
```

Créer un fichier `.env` à la racine de `api/` :

```env
# MongoDB
MONGO_URL=mongodb://localhost:27017/statify

# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# CORS
CORS_ORIGINS=http://localhost:3001,http://localhost:3000

# Port
PORT=3000
```

**Obtenir les credentials Spotify :**
1. Aller sur [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Créer une nouvelle application
3. Copier Client ID et Client Secret

### 3. Configuration Frontend

```bash
cd ../web
npm install
```

Créer un fichier `.env.local` à la racine de `web/` :

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 4. Données initiales (optionnel)

Si vous avez des fichiers JSON dans `/data`, vous pouvez les importer :

```bash
# Exemple avec MongoDB Compass ou mongoimport
mongoimport --db statify --collection artists --file data/artists.json --jsonArray
mongoimport --db statify --collection albums --file data/albums.json --jsonArray
mongoimport --db statify --collection tracks --file data/tracks.json --jsonArray
```

---

## 💻 Utilisation

### Développement

#### Démarrer le Backend (port 3000)

```bash
cd api
npm run start:dev
```

Le serveur API démarre sur `http://localhost:3000`

#### Démarrer le Frontend (port 3001)

```bash
cd web
npm run dev
```

L'application web démarre sur `http://localhost:3001`

### Production

#### Build Backend

```bash
cd api
npm run build
npm run start:prod
```

#### Build Frontend

```bash
cd web
npm run build
npm run start
```

### Tests

```bash
# Backend - Tests unitaires
cd api
npm run test

# Backend - Couverture de tests
npm run test:cov

# Backend - Tests e2e
npm run test:e2e
```

---

## 📡 API Endpoints

### Users

```
POST   /users                          Créer un compte
POST   /users/login                    Connexion
GET    /users/:id                      Profil utilisateur
GET    /users/:id/library              Bibliothèque complète
PUT    /users/:id/library/add          Ajouter à la bibliothèque
PUT    /users/:id/library/remove       Retirer de la bibliothèque
PATCH  /users/:id                      Mettre à jour le profil
DELETE /users/:id                      Supprimer le compte
```

### Artists

```
GET    /artists                        Liste des artistes
GET    /artists/:id                    Détails d'un artiste
GET    /artists/:id/albums             Albums de l'artiste
GET    /artists/:id/tracks             Tracks de l'artiste
GET    /artists/search-spotify         Rechercher sur Spotify
POST   /artists/add-from-spotify       Importer depuis Spotify
POST   /artists/:id/sync-albums        Synchroniser les albums
POST   /artists                        Créer un artiste
PATCH  /artists/:id                    Mettre à jour
DELETE /artists/:id                    Supprimer
```

### Albums

```
GET    /albums                         Liste des albums
GET    /albums/:id                     Détails d'un album
GET    /albums/:id/tracks              Tracks de l'album
GET    /albums/analytics/cohorts       Statistiques par période
GET    /albums/analytics/labels        Statistiques par label
POST   /albums/:id/sync-tracks         Synchroniser les tracks Spotify
POST   /albums                         Créer un album
PATCH  /albums/:id                     Mettre à jour
DELETE /albums/:id                     Supprimer
```

### Tracks

```
GET    /tracks                         Liste des tracks (paginée)
GET    /tracks/:id                     Détails d'une track
POST   /tracks/by-ids                  Récupérer plusieurs tracks
POST   /tracks                         Créer une track
PATCH  /tracks/:id                     Mettre à jour
DELETE /tracks/:id                     Supprimer
```

### Search

```
GET    /search?q=query&type=TYPE&page=1&limit=20
       Types: tracks, albums, artists, playlists, users
       Filtres: minPopularity, maxPopularity, genre, year, fromYear, toYear
```

### Playlists

```
GET    /playlists                      Liste des playlists
GET    /playlists/public               Playlists publiques
GET    /playlists/user/:userId         Playlists d'un utilisateur
GET    /playlists/:id                  Détails d'une playlist
GET    /playlists/:id/tracks           Tracks de la playlist
POST   /playlists                      Créer une playlist
PUT    /playlists/:id/tracks/add       Ajouter des tracks
PUT    /playlists/:id/tracks/remove    Retirer des tracks
PUT    /playlists/:id/tracks/reorder   Réordonner les tracks
PATCH  /playlists/:id                  Mettre à jour
DELETE /playlists/:id                  Supprimer
```

### Recommendations

```
GET    /recommendations/:userId        Recommandations personnalisées
```

### Collaborations

```
GET    /collaborations?minCount=N      Réseau de collaborations
```

### Statistics

```
GET    /stats/dashboard                Stats du dashboard
GET    /stats/artists/top?limit=10     Top artistes
GET    /stats/release-cohorts          Données de timeline
GET    /stats/labels                   Stats par label
GET    /stats/collaborations           Stats de collaborations
```

**Documentation complète :** Voir la collection Postman ou utiliser l'endpoint `/api` (si Swagger activé)

---

## 🗄 Base de Données

### Schéma MongoDB

Le projet utilise **5 collections principales** :

#### 1. Artists
```javascript
{
  _id: "spotify_id",              // String (Spotify ID)
  name: "Ninho",
  popularity: 85,                 // 0-100
  followers: 5234567,
  genres: ["french rap", "rap"],
  images: [{ url, height, width }],
  album_ids: ["album1", "album2"],
  spotify_synced: true
}
```

#### 2. Albums
```javascript
{
  _id: "spotify_id",
  name: "Destin",
  album_type: "album",            // album | single | compilation
  release_date: "2023-03-10",
  popularity: 78,
  label: "Rec. 118",
  artist_ids: ["artist1"],
  track_ids: ["track1", "track2"],
  genres: ["french rap"],
  spotify_synced: true
}
```

#### 3. Tracks
```javascript
{
  _id: "spotify_id",
  name: "VVS",
  album_id: "album_id",
  artist_ids: ["artist1", "artist2"],  // Collaborations
  duration_ms: 234567,
  popularity: 82,
  explicit: true,
  track_number: 5,
  disc_number: 1
}
```

#### 4. Users
```javascript
{
  _id: ObjectId,
  username: "user123",
  password: "$2b$10$...",          // Bcrypt hash
  liked_tracks: ["track1", "track2"],
  liked_albums: ["album1"],
  favorite_artists: ["artist1"],
  recommendations: {
    sections: [...],
    lastUpdated: Date
  }
}
```

#### 5. Playlists
```javascript
{
  _id: ObjectId,
  name: "Mes favoris",
  description: "Ma playlist préférée",
  owner_id: ObjectId,
  collaborators: [ObjectId],
  track_ids: ["track1", "track2"],
  isPublic: true,
  createdAt: Date,
  updatedAt: Date
}
```

### Index Définis

- **Artists:** Index textuel sur `name` + `genres`
- **Albums:** Index textuel sur `name`
- **Tracks:** Index textuel sur `name`
- **Users:** Index textuel sur `username` (unique)
- **Playlists:** Index textuel sur `name` + `description`

### Requêtes Avancées

Le projet implémente **15+ types de requêtes MongoDB** incluant :

- ✅ CRUD de base
- ✅ Recherche avec `$regex` case-insensitive
- ✅ Opérateurs de comparaison (`$gte`, `$lte`, `$in`)
- ✅ Expressions avec `$expr`, `$size`, `$substr`, `$toInt`
- ✅ **Aggregation pipelines complexes** (`$group`, `$project`, `$addFields`)
- ✅ Accumulateurs (`$sum`, `$avg`, `$cond`)
- ✅ Opérations mathématiques (`$divide`, `$round`)
- ✅ Jointures avec `.populate()`
- ✅ Optimisations (`.lean()`, `.select()`, `distinct()`)

**Documentation détaillée :** Voir [`api/README_BDD.md`](api/README_BDD.md)

---

## 📸 Captures d'écran

### Dashboard Principal
```
┌─────────────────────────────────────────────────────┐
│  Statify                                     [User]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📊 Dashboard                                        │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 1,234    │  │ 5,678    │  │ 23,456   │          │
│  │ Artists  │  │ Albums   │  │ Tracks   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                      │
│  🎤 Top Artists                                      │
│  ┌─────────────────────────────────────────┐        │
│  │ 1. Ninho          [85] ▰▰▰▰▰▰▰▰▰░       │        │
│  │ 2. Soolking       [82] ▰▰▰▰▰▰▰▰░░       │        │
│  │ 3. Jul            [79] ▰▰▰▰▰▰▰░░░       │        │
│  └─────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘
```

### Réseau de Collaborations
```
┌─────────────────────────────────────────────────────┐
│  🌐 Collaboration Network                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │         ●─────●                             │    │
│  │        /│\    │\                            │    │
│  │       ● ● ●   ● ●                           │    │
│  │      /│\│/│\ /│\│\                          │    │
│  │     ● ● ● ● ● ● ● ●                         │    │
│  │      Force-directed Graph                   │    │
│  │      French Rap Collaborations              │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Top Collaborations:                                │
│  1. Ninho ↔ Soolking (12 tracks)                   │
│  2. Jul ↔ Soso Maness (8 tracks)                   │
└─────────────────────────────────────────────────────┘
```

### Discover - Recommandations
```
┌─────────────────────────────────────────────────────┐
│  🤖 Discover                                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Recommendations personnalisées pour vous           │
│                                                      │
│  🎸 Artistes Similaires                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │Img  │ │ Img  │ │ Img  │ │ Img  │              │
│  │Artiste│ │Artiste│ │Artiste│ │Artiste│              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                      │
│  💿 Albums de Labels Favoris                        │
│  ┌──────┐ ┌──────┐ ┌──────┐                        │
│  │ Img  │ │ Img  │ │ Img  │                        │
│  │Album │ │Album │ │Album │                        │
│  └──────┘ └──────┘ └──────┘                        │
│                                                      │
│  🔥 Tracks Tendance                                 │
│  ...                                                 │
└─────────────────────────────────────────────────────┘
```

### Release Cohorts Analytics
```
┌─────────────────────────────────────────────────────┐
│  📈 Release Cohorts                                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Releases par Année                                  │
│  ┌────────────────────────────────────────────┐    │
│  │ 200│                           ▄▄           │    │
│  │ 150│                     ▄▄▄  ██           │    │
│  │ 100│              ▄▄▄   ███  ███           │    │
│  │  50│         ▄▄▄ ███   ████ ████          │    │
│  │   0└────────┴───┴───┴─────┴─────────      │    │
│  │    2018 2019 2020 2021 2022 2023 2024     │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Popularité Moyenne par Année                        │
│  ┌────────────────────────────────────────────┐    │
│  │  85│                           ●            │    │
│  │  80│                      ●─●               │    │
│  │  75│                 ●─●                    │    │
│  │  70│            ●─●                         │    │
│  │  65└────────────────────────────────────    │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## 📚 Documentation

- **[README_BDD.md](api/README_BDD.md)** - Documentation complète sur l'aspect base de données MongoDB
  - Requêtes avancées expliquées
  - Aggregation pipelines détaillées
  - Exemples de code annotés
  - Concepts MongoDB démontrés

- **[Discover README](web/app/discover/README.md)** - Documentation technique du moteur de recommandations

- **API Reference** - Voir section [API Endpoints](#-api-endpoints)

---

## 🎓 Contexte Académique

Ce projet a été réalisé dans le cadre d'un cours de **Base de Données** pour démontrer :

- ✅ Maîtrise de MongoDB (NoSQL)
- ✅ Requêtes complexes et optimisées
- ✅ Aggregation pipelines multi-étapes
- ✅ Modélisation de données pour une application réelle
- ✅ Architecture full-stack moderne
- ✅ Intégration d'APIs externes (Spotify)

**Points forts techniques :**
- 15+ types de requêtes MongoDB différentes
- 5 collections avec relations
- Indexes textuels pour la recherche
- Cache en mémoire avec TTL
- Recommandations personnalisées
- Visualisations interactives

---

## 👥 Contributeurs

- [Fabyan](https://github.com/fabyan09)

---

## 📄 Licence

Ce projet est à usage académique uniquement.

---

## 🙏 Remerciements

- **Spotify** pour l'API et les données musicales
- **NestJS** pour le framework backend robuste
- **Next.js** pour le framework React performant
- **MongoDB** pour la base de données flexible

---

<div align="center">

**Fait avec ❤️ pour le cours de BDD**

</div>
