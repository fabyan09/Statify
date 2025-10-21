# Page Discover - Documentation Technique

## Vue d'ensemble

La page **Discover** est un système de recommandation musicale personnalisé qui analyse les préférences de l'utilisateur (artistes favoris, albums likés, tracks sauvegardés, playlists) pour proposer du contenu musical pertinent et cohérent.

## Architecture

### Fichier principal
- **Chemin**: `web/app/discover/page.tsx`
- **Type**: Client Component (Next.js App Router)

### Dépendances clés

```typescript
import { useAuth } from "@/contexts/auth-context";
import {
  useArtists,
  useAlbums,
  useTracks,
  useUser,
  useAddToLibrary,
  useRemoveFromLibrary,
  useUserPlaylists
} from "@/lib/hooks";
```

## Algorithme de recommandation

### Principe général

L'algorithme génère **6 sections de recommandations** en analysant différentes dimensions des goûts musicaux :

1. Genres musicaux
2. Labels de disques
3. Périodes temporelles (années/décennies)
4. Artistes liés
5. Popularité globale
6. Nouveautés récentes

### Étapes de calcul

#### 1. Extraction des préférences utilisateur

```typescript
// Genres favoris (avec pondération par fréquence)
const favoriteGenres = new Map<string, number>();
user.favorite_artists.forEach(artistId => {
  const artist = artistMap.get(artistId);
  artist.genres.forEach(genre => {
    favoriteGenres.set(genre, (favoriteGenres.get(genre) || 0) + 1);
  });
});

// Labels favoris
const favoriteLabels = new Map<string, number>();
user.liked_albums.forEach(albumId => {
  const album = albumMap.get(albumId);
  favoriteLabels.set(album.label, (favoriteLabels.get(album.label) || 0) + 1);
});

// Artistes liés aux tracks likés
const likedTrackArtists = new Set<string>();
user.liked_tracks.forEach(trackId => {
  const track = allTracks.find(t => t._id === trackId);
  track.artist_ids.forEach(id => likedTrackArtists.add(id));
});
```

#### 2. Génération des sections

##### Section 1: Artistes recommandés (par genre)

**Critères**:
- Artistes non encore likés
- Partageant au moins un genre avec les favoris
- Score = Σ (fréquence_genre × popularité_artiste / 100)

**Tri**: Par score décroissant

**Limite**: 8 artistes

```typescript
const similarArtistsByGenre = allArtists
  .filter(artist =>
    !user.favorite_artists.includes(artist._id) &&
    artist.genres.some(genre => favoriteGenres.has(genre))
  )
  .map(artist => ({
    ...artist,
    score: artist.genres.reduce((sum, genre) =>
      sum + (favoriteGenres.get(genre) || 0) * artist.popularity / 100, 0
    )
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 8);
```

##### Section 2: Albums par label

**Critères**:
- Albums des 3 labels les plus fréquents dans la bibliothèque
- Albums non encore likés
- Tri par popularité

**Limite**: 8 albums

```typescript
const topLabels = Array.from(favoriteLabels.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)
  .map(([label]) => label);

const albumsFromFavoriteLabels = allAlbums
  .filter(album =>
    topLabels.includes(album.label) &&
    !user.liked_albums.includes(album._id)
  )
  .sort((a, b) => b.popularity - a.popularity)
  .slice(0, 8);
```

##### Section 3: Nouveautés (année en cours et N-1)

**Critères**:
- Albums sortis dans les 2 dernières années
- Dans les genres favoris
- Non likés

**Tri**: Par date de sortie (plus récent en premier)

**Limite**: 8 albums

```typescript
const currentYear = new Date().getFullYear();
const recentYears = [currentYear, currentYear - 1];

const recentAlbumsInFavoriteGenres = allAlbums
  .filter(album => {
    const releaseYear = new Date(album.release_date).getFullYear();
    return recentYears.includes(releaseYear) &&
      !user.liked_albums.includes(album._id) &&
      album.genres.some(genre => favoriteGenres.has(genre));
  })
  .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
  .slice(0, 8);
```

##### Section 4: Tracks recommandés (artistes similaires)

**Critères**:
- Tracks non likés
- Artistes ayant des genres en commun avec les favoris

**Tri**: Par popularité

**Limite**: 10 tracks

```typescript
const tracksFromSimilarArtists = allTracks
  .filter(track => {
    const trackArtistGenres = track.artist_ids
      .map(id => artistMap.get(id))
      .filter(Boolean)
      .flatMap(artist => artist.genres);

    return !user.liked_tracks.includes(track._id) &&
      trackArtistGenres.some(genre => favoriteGenres.has(genre));
  })
  .sort((a, b) => b.popularity - a.popularity)
  .slice(0, 10);
```

##### Section 5: Tendances (popularité globale)

**Critères**:
- Tracks non likés
- Popularité ≥ 70

**Tri**: Par popularité

**Limite**: 10 tracks

```typescript
const trendingTracks = allTracks
  .filter(track =>
    !user.liked_tracks.includes(track._id) &&
    track.popularity >= 70
  )
  .sort((a, b) => b.popularity - a.popularity)
  .slice(0, 10);
```

##### Section 6: Classiques par décennie

**Critères**:
- Calcul de l'année moyenne des albums likés
- Détermination de la décennie (arrondi à la dizaine inférieure)
- Albums de cette décennie non likés

**Tri**: Par popularité

**Limite**: 8 albums

```typescript
const likedAlbumYears = user.liked_albums
  .map(albumId => albumMap.get(albumId))
  .filter(Boolean)
  .map(album => new Date(album.release_date).getFullYear())
  .filter(year => !isNaN(year));

const avgYear = Math.floor(
  likedAlbumYears.reduce((sum, year) => sum + year, 0) / likedAlbumYears.length
);
const decade = Math.floor(avgYear / 10) * 10;

const albumsFromFavoriteDecade = allAlbums
  .filter(album => {
    const year = new Date(album.release_date).getFullYear();
    return year >= decade && year < decade + 10 &&
      !user.liked_albums.includes(album._id);
  })
  .sort((a, b) => b.popularity - a.popularity)
  .slice(0, 8);
```

## Structure de données

### Type RecommendationSection

```typescript
interface RecommendationSection {
  title: string;           // Titre de la section
  description: string;     // Description contextuelle
  icon: React.ElementType; // Icône Lucide React
  items: (Artist | Album | Track)[]; // Items recommandés
  type: 'artist' | 'album' | 'track'; // Type pour le rendu
}
```

### Modèles de données

```typescript
interface Artist {
  _id: string;
  name: string;
  popularity: number;      // 0-100
  followers: number;
  genres: string[];
  images: Image[];
  external_urls: { spotify: string };
}

interface Album {
  _id: string;
  name: string;
  album_type: string;      // "album" | "single" | "compilation"
  release_date: string;    // ISO date
  popularity: number;      // 0-100
  images: Image[];
  label: string;
  artist_ids: string[];
  genres: string[];
  external_urls: { spotify: string };
}

interface Track {
  _id: string;
  name: string;
  popularity: number;      // 0-100
  duration_ms: number;
  explicit: boolean;
  album_id: string;
  artist_ids: string[];
  external_urls: { spotify: string };
  preview_url: string;
}
```

## Interface utilisateur

### Layout par type de contenu

#### Artistes (Grid)
- **Grid responsive**: 2-4 colonnes selon la taille d'écran
- **Image**: Circulaire (aspect-square)
- **Infos affichées**:
  - Nom (cliquable vers `/artists/{id}`)
  - Genres (max 2)
  - Score de popularité
  - Boutons : Like + Spotify

#### Albums (Grid)
- **Grid responsive**: 2-4 colonnes
- **Image**: Carrée arrondie (aspect-square)
- **Infos affichées**:
  - Nom (cliquable vers `/albums/{id}`)
  - Artistes
  - Type d'album + Année
  - Score de popularité
  - Boutons : Like + Spotify

#### Tracks (Liste)
- **Layout**: Liste verticale
- **Image**: Mini pochette d'album (16x16)
- **Infos affichées**:
  - Nom du titre + Badge explicit
  - Artistes
  - Album
  - Durée formatée (mm:ss)
  - Score de popularité
  - Boutons : Like + Preview Spotify

### Interactions utilisateur

#### Like/Unlike

```typescript
const handleToggleLike = async (itemId: string, itemType: 'track' | 'album' | 'artist') => {
  if (!currentUser) return;

  const isLiked = /* check user library */;

  if (isLiked) {
    removeFromLibrary.mutate({
      userId: currentUser._id,
      data: { [`${itemType}_id`]: itemId }
    });
  } else {
    addToLibrary.mutate({
      userId: currentUser._id,
      data: { [`${itemType}_id`]: itemId }
    });
  }
};
```

#### État de like (visuel)

```typescript
const isLiked = (itemId: string, itemType: 'track' | 'album' | 'artist') => {
  if (!user) return false;
  return itemType === 'track'
    ? user.liked_tracks?.includes(itemId)
    : itemType === 'album'
    ? user.liked_albums?.includes(itemId)
    : user.favorite_artists?.includes(itemId);
};
```

## États de chargement

### Étapes de chargement

1. **Auth check**: Vérification utilisateur connecté
2. **User data**: Chargement des données utilisateur
3. **Music data**: Chargement artistes/albums/tracks en parallèle
4. **Recommendations**: Calcul des recommandations

### Messages de chargement

```typescript
// Phase 1: Pas d'utilisateur
if (!currentUser || userLoading) {
  return <LoadingSpinner message="Chargement..." />;
}

// Phase 2: Chargement des données musicales
if (artistsLoading || albumsLoading || tracksLoading) {
  return <LoadingSpinner message="Analyse de vos goûts musicaux..." />;
}

// Phase 3: Pas de recommandations
if (recommendations.length === 0) {
  return <EmptyState />;
}
```

## Optimisations

### Maps pour accès O(1)

```typescript
const artistMap = new Map(artists.map(a => [a._id, a]));
const albumMap = new Map(albums.map(a => [a._id, a]));
```

### Calculs en une seule passe

Les genres et labels favoris sont calculés en une seule itération via `Map` avec compteurs.

### Memoization implicite

Les recommandations sont recalculées uniquement quand les dépendances changent (useEffect).

## Intégration dans l'application

### Route
- **Path**: `/discover`
- **Navigation**: Entre "Search" et "Collab Network"
- **Icône**: Sparkles (✨)

### Protection
- **Auth required**: Oui (redirection vers `/auth`)
- **Données requises**: Profil utilisateur avec likes

## Métriques et KPIs possibles

Pour analyser l'efficacité des recommandations (à implémenter) :

1. **Taux de like**: % de recommandations likées
2. **Taux de clic**: % de recommandations consultées
3. **Diversité**: Nombre de genres/labels/décennies représentés
4. **Freshness**: % de contenu récent vs ancien
5. **Découvrabilité**: % d'artistes/albums jamais consultés avant

## Évolutions possibles

### Court terme
- Ajout de filtres (genres, années, popularité)
- Pagination des sections
- Recherche dans les recommandations
- Partage de recommandations

### Moyen terme
- Machine learning pour scoring personnalisé
- Recommandations collaboratives (utilisateurs similaires)
- Historique des recommandations vues/likées
- Notifications pour nouvelles recommandations

### Long terme
- Intégration API Spotify Recommendations
- Analyse audio avancée (tempo, énergie, valence)
- Playlists générées automatiquement
- Export vers Spotify

## Troubleshooting

### Problème: Pas de recommandations affichées

**Causes possibles**:
1. Utilisateur n'a pas de likes dans sa bibliothèque
2. Pas assez de données pour générer des recommandations
3. Tous les items recommandables sont déjà likés

**Solution**: Afficher un état vide avec CTA vers `/library`

### Problème: Sections vides

**Cause**: Filtres trop stricts pour certains profils musicaux

**Solution**: Assouplir les critères (ex: accepter 1 genre en commun au lieu de plusieurs)

### Problème: Recommandations non pertinentes

**Cause**: Poids des critères inadaptés

**Solution**: Ajuster les scores et pondérations dans l'algorithme

## Performance

### Complexité algorithmique

- **Temps**: O(n) pour chaque section (où n = nombre d'items totaux)
- **Espace**: O(m) (où m = nombre de genres/labels uniques)

### Optimisations React

- Client component avec `"use client"`
- useEffect avec dépendances précises
- Mutations optimistes pour les likes (React Query)
- Images Next.js optimisées automatiquement

## Tests recommandés

### Tests unitaires
- [ ] Génération des favoris (genres, labels)
- [ ] Scoring des artistes similaires
- [ ] Filtrage des années
- [ ] Calcul de la décennie moyenne

### Tests d'intégration
- [ ] Chargement des données utilisateur
- [ ] Mutations like/unlike
- [ ] Navigation entre sections
- [ ] Liens Spotify

### Tests E2E
- [ ] Scénario utilisateur complet (login → discover → like)
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] États de chargement et erreurs

## Conclusion

La page Discover fournit un système de recommandation musical riche et personnalisé en analysant 6 dimensions différentes des goûts musicaux. L'algorithme est extensible et peut être amélioré progressivement avec des métriques d'engagement et du machine learning.
