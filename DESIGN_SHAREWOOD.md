# Refonte visuelle de ShareWood — instructions pour Claude Code

Applique ce design à toute l'appli (Next.js, dossier courant). **Ne change ni la logique, ni les données, ni Supabase, ni les routes** : uniquement l'apparence. Si le projet utilise Tailwind, mets les couleurs et les polices dans le thème Tailwind ; sinon, en variables CSS dans `src/app/globals.css`. À la fin, liste les fichiers créés et modifiés.

## 1. Style général
Éditorial, élégant, calme et chaleureux, qui convient à tout le monde (étudiants comme commerçants, jeunes comme plus âgés). Beaucoup d'espace blanc, coins très arrondis, pas d'ombres lourdes, pas de dégradés, pas d'emojis.

## 2. Polices (fichiers auto-hébergés dans `public/fonts/`, déclarés dans `src/app/globals.css`)
- **Titres (h1, h2, h3, nom de l'appli)** : `Newsreader`, graisse 400–500, letter-spacing -0.01em à -0.02em, interligne ~1.15.
- **Slogan et citations** : `Newsreader` en italique, couleur gris texte.
- **Tout le reste (texte, boutons, formulaires, étiquettes)** : `Inter`, graisse 400 (500 pour les boutons et les libellés).
- Petits intitulés de section : Inter 13px, graisse 500, MAJUSCULES, letter-spacing 0.14em, gris texte.

## 3. Couleurs
| Rôle | Couleur |
|---|---|
| Fond de page | `#F1EFE9` |
| Fond des cartes / surfaces | `#FAF9F5` |
| Bordure discrète | `#DDD9CF` |
| Encre (titres, texte principal) | `#1A1A18` |
| Gris (texte secondaire, dates, descriptions) | `#6B6A65` |
| Vert forêt (couleur principale : boutons, liens, header) | `#1E3A2F` |
| Aubergine (accent : badges, état actif, survol) | `#4B2A63` |
| Aubergine foncé (fonds sombres) | `#2A1B3D` |
| Sauge (touches claires) | `#CFE3CA` |
| Lilas (touches claires) | `#E6DFF0` |

Le vert est la couleur dominante ; le violet reste un accent. Garder des contrastes lisibles (texte gris uniquement sur fond clair).

## 4. Composants
- **Cartes** : fond `#FAF9F5`, `border-radius: 24px`, padding généreux (24–32px), pas d'ombre (ou 1px de bordure `#DDD9CF`).
- **Boutons principaux** : fond vert forêt, texte `#FAF9F5`, Inter 500, `border-radius: 999px` (pilule), hauteur ≥ 44px. Survol : aubergine.
- **Boutons secondaires** : fond transparent, bordure 1.5px vert forêt, texte vert forêt, pilule.
- **Champs de formulaire** : fond `#FAF9F5`, bordure `#DDD9CF`, `border-radius: 14px`, focus : bordure vert forêt + anneau sauge.
- **Badges / filtres de catégorie** : pilule, fond lilas ou sauge, texte aubergine ou vert ; état sélectionné : fond vert forêt, texte crème.
- **Header** : logo rond + « ShareWood » en Newsreader 500, fond `#FAF9F5`, fine bordure basse `#DDD9CF`.

## 5. Logo
Crée `public/logo.svg` avec exactement ce code (une étiquette de prix crème avec une toque d'étudiant aubergine, dans un rond vert) :

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="ShareWood">
  <circle cx="60" cy="60" r="60" fill="#1E3A2F"/>
  <svg x="14" y="14" width="92" height="92" viewBox="12 21 92 92">
    <g transform="rotate(-30 58 68)">
      <path d="M34 48 H70 L90 68 L70 88 H34 A7 7 0 0 1 27 81 V55 A7 7 0 0 1 34 48 Z" fill="#FAF9F5"/>
      <circle cx="75" cy="68" r="4.5" fill="#1E3A2F"/>
      <polygon points="48,56 64,62.5 48,69 32,62.5" fill="#4B2A63"/>
      <path d="M39 65.5 V72 C39 77.5 57 77.5 57 72 V65.5 L48 69.5 Z" fill="#4B2A63"/>
    </g>
  </svg>
</svg>
```

Utilise-le :
- dans le header, à gauche de « ShareWood » (rond de 40px) ;
- sur la page de connexion, en grand (rond de ~96px), avec « ShareWood » en Newsreader 500 et en dessous le slogan en italique : *« Les bons plans se partagent. »* ;
- comme favicon (`src/app/icon.svg` = copie du logo).

## 6. Icônes de catégories
Crée `src/components/CategoryIcon.tsx` : un composant qui prend la catégorie en prop et affiche un **rond coloré** (40px par défaut, taille réglable) contenant une **icône au trait** (SVG viewBox `0 0 48 48`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2.6"`, `stroke-linecap="round"`, `stroke-linejoin="round"`, icône à ~52 % du diamètre du rond).

Associe chaque catégorie existante dans le code à son icône (adapte les clés aux noms réellement utilisés dans le projet) :

| Catégorie | Fond du rond | Couleur du trait | Tracés SVG |
|---|---|---|---|
| Grande surface | `#1E3A2F` | `#FAF9F5` | `<path d="M5 9h5l4.5 20h21l4-14H12"/><circle cx="17" cy="36" r="2.5"/><circle cx="32" cy="36" r="2.5"/>` |
| Carte Sortir (n'est plus une catégorie depuis la tâche 28 : condition, voir `REQUIREMENTS`) | `#4B2A63` | `#FAF9F5` | `<path d="M7 14h34v6a4 4 0 0 0 0 8v6H7v-6a4 4 0 0 0 0-8z"/><path d="M30 16v16" stroke-dasharray="3 3"/><path d="M18.5 19l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z"/>` |
| Restaurant | `#CFE3CA` | `#1E3A2F` | `<path d="M17 8v32"/><path d="M12 8v9a5 5 0 0 0 10 0V8"/><path d="M34 40V8c-4.5 3-7 9-7 16h7"/>` |
| Bourses et aides | `#E6DFF0` | `#4B2A63` | `<circle cx="24" cy="24" r="16"/><path d="M30 17.5a8.5 8.5 0 1 0 0 13"/><path d="M15 22h11"/><path d="M15 26.5h11"/>` |
| Transports | `#1E3A2F` | `#FAF9F5` | `<rect x="10" y="7" width="28" height="28" rx="5"/><path d="M10 21h28"/><path d="M15 35v5"/><path d="M33 35v5"/><path d="M17 28h.01"/><path d="M31 28h.01"/>` |
| Activités | `#4B2A63` | `#FAF9F5` | `<path d="M21 7l3.2 9.3 9.3 3.2-9.3 3.2L21 32l-3.2-9.3-9.3-3.2 9.3-3.2z"/><path d="M35 28l1.7 4.3 4.3 1.7-4.3 1.7L35 40l-1.7-4.3-4.3-1.7 4.3-1.7z"/>` |
| Licence de sport | `#CFE3CA` | `#1E3A2F` | `<circle cx="24" cy="24" r="16"/><path d="M24 8v32"/><path d="M8 24h32"/><path d="M13 12.5c5.5 6.5 5.5 16.5 0 23"/><path d="M35 12.5c-5.5 6.5-5.5 16.5 0 23"/>` |

Affiche ce `CategoryIcon` partout où une catégorie apparaît : sur chaque carte d'offre (en haut à gauche, à côté du titre), dans les filtres de catégories, et sur la carte (marqueurs) s'il y en a une. Ajoute un `aria-label` avec le nom de la catégorie.

## 7. Vérification
Lance `npm run build` pour vérifier qu'il n'y a pas d'erreur, puis dis-moi de lancer `npm run dev` pour voir le résultat sur http://localhost:3000.
