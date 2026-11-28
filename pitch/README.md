# Diapos du pitch (LaTeX / Beamer)

7 diapos, 3 minutes environ dont une vidéo de 1 minute maximum. Le PDF à présenter : [`sharewood.pdf`](sharewood.pdf).

## Modifier dans VS Code
1. Installer LaTeX : MacTeX (macOS), TeX Live ou MiKTeX (Windows / Linux).
2. Installer l'extension **LaTeX Workshop** (James Yu).
3. Ouvrir `pitch/sharewood.tex` : le PDF se recompile à chaque enregistrement.

En ligne de commande : `cd pitch && latexmk -pdf sharewood.tex` (`latexmk -c` efface les fichiers temporaires).

Sans installation : sur [Overleaf](https://www.overleaf.com), importer le contenu du dossier `pitch/` (`.tex` et `images/`).

## Où changer quoi
- Chaque diapo est un bloc repéré par un commentaire en capitales (`1. INTRODUCTION`, `2. SOLUTION`…).
- Un texte : `\txt{x}{y}{largeur}{taille}{couleur}{texte}`. Positions en « pixels » sur 1920 × 1080, depuis le coin haut gauche : augmenter `y` descend le texte. Un texte plus long peut sortir de sa carte : vérifier le PDF.
- Rectangle : `\card{x}{y}{largeur}{hauteur}{couleur}` ; capture : `\phone{x}{y}{largeur}{image}`.
- Couleurs de l'application définies en haut du fichier.

## Texte à dire
Dans chaque diapo, bloc `\note{...}`. Pour les afficher à droite des diapos, retirer le `%` devant `\setbeameroption{show notes on second screen=right}`. Ne pas valider le PDF avec les notes affichées.

## La vidéo (diapo 3)
- [`demo-16x9.mp4`](demo-16x9.mp4) (plein écran, à projeter) et [`demo-telephone.mp4`](demo-telephone.mp4) (format téléphone) : 40 s, **sans son** (à commenter en direct).
- Parcours : accueil « Pour toi » → fiche « Très fiable » → « J'en ai profité » (+15 Flèches, série × 1,5) → recherche « piscine » (la carte se recadre) → partager un bon plan avec sa position (+75 Flèches).
- Filmée par Claude sur l'application, avec des **données d'exemple locales** (compte « Sarah », offres « (démo) ») : rien n'a été écrit dans la vraie base. Les touchers sont marqués par un rond violet.
- La lancer à part au moment de la diapo 3 (la lecture d'une vidéo dans un PDF dépend du lecteur).
- Retourner après un changement d'interface : `bash pitch/video/tourner.sh` (macOS, Chrome, `ffmpeg`).

## À savoir
- Les captures montrent l'application avec des **offres d'exemple** marquées « (démo) ».
- Erasmus est une **ambition**, pas une fonction existante ; le tarif de 9,90 € est **envisagé**.
- Travailler à plusieurs : faire `git pull` avant de modifier et prévenir les autres ; en cas de conflit sur le PDF, le recompiler.
