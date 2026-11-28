# Diapos du pitch (LaTeX / Beamer)

6 diapos, 3 minutes environ dont une vidéo de 1 minute maximum. Le PDF à présenter : [`sharewood.pdf`](sharewood.pdf).

## Modifier dans VS Code
1. Installer LaTeX : MacTeX (macOS), TeX Live ou MiKTeX (Windows / Linux).
2. Installer l'extension **LaTeX Workshop** (James Yu).
3. Ouvrir `pitch/sharewood.tex` : le PDF se recompile à chaque enregistrement.

En ligne de commande : `cd pitch && latexmk -pdf sharewood.tex` (`latexmk -c` efface les fichiers temporaires).
Sans installer LaTeX : [Tectonic](https://tectonic-typesetting.github.io) (un seul exécutable, télécharge les paquets), `cd pitch && tectonic sharewood.tex`.

Sans installation : sur [Overleaf](https://www.overleaf.com), importer le contenu du dossier `pitch/` (`.tex` et `images/`).

## Où changer quoi
- Chaque diapo est un bloc repéré par un commentaire en capitales (`1. INTRODUCTION`, `2. SOLUTION`…).
- Un texte : `\txt{x}{y}{largeur}{taille}{couleur}{texte}`. Positions en « pixels » sur 1920 × 1080, depuis le coin haut gauche : augmenter `y` descend le texte. Un texte plus long peut sortir de sa carte : vérifier le PDF.
- Rectangle : `\card{x}{y}{largeur}{hauteur}{couleur}` ; capture fixe : `\phone{x}{y}{largeur}{image}` ; boucle vidéo (diapo 3) : `\phonevideo{x}{y}{largeur}{im/s}{nom}{premier}{dernier}`.
- Couleurs de l'application définies en haut du fichier.

## Texte à dire
Dans chaque diapo, bloc `\note{...}`. Pour les afficher à droite des diapos, retirer le `%` devant `\setbeameroption{show notes on second screen=right}`. Ne pas valider le PDF avec les notes affichées.

## Les 3 vidéos en boucle (diapo 3)
- Les 3 téléphones de la diapo 3 sont des **boucles vidéo intégrées au PDF** (`\phonevideo`, paquet LaTeX `animate`, images `pitch/images/anim{recherche,partager,recompenses}*.jpg`) : recherche (carte **et** barre de recherche, « J'en ai profité », cœur favori), partage d'un bon plan, page récompenses.
- **Pas d'autoplay** : chaque téléphone a ses propres petits boutons lecture/pause (▶/❙❙/⏭), affichés sous l'image. On clique sur le 1er quand on en parle, puis le 2e, puis le 3e — au rythme du discours, pas tous en même temps.
- ⚠️ **Ça ne marche que dans Adobe Acrobat / Adobe Reader.** Dans Preview.app, Chrome, Firefox ou tout autre lecteur, seule la première image de chaque téléphone s'affiche (fixe, sans les boutons). **Avant la répétition (C4) : vérifier que la machine de présentation a Adobe Acrobat Reader installé et que les 3 boutons apparaissent et lancent bien chaque vidéo.**
- Filmées par Claude sur l'application, avec des **données d'exemple locales** (compte « Sarah », offres « (démo) », boutique de récompenses mockée) : rien n'a été écrit dans la vraie base. Les touchers sont marqués par un rond violet.
- Repli si Acrobat n'est pas disponible le jour J : [`demo-16x9.mp4`](demo-16x9.mp4) / [`demo-telephone.mp4`](demo-telephone.mp4) (ancienne vidéo de 40 s, parcours différent — accueil/carte/fiche) restent dans le dépôt et peuvent être relancées à la main pendant la diapo 3.
- Retourner les 3 boucles après un changement d'interface : `bash pitch/video/tourner3.sh` (macOS, Chrome ; pas besoin de `ffmpeg`), puis recompiler le PDF. L'ancienne vidéo seule : `bash pitch/video/tourner.sh` (macOS, Chrome, `ffmpeg`).

## À savoir
- Les captures montrent l'application avec des **offres d'exemple** marquées « (démo) ».
- Le tarif de 9,90 € n'apparaît plus sur les diapos (diapo 5 : « Le temps ») ; la conclusion évoque encore Erasmus comme ouverture (diapo dédiée retirée le 28/11).
- Travailler à plusieurs : faire `git pull` avant de modifier et prévenir les autres ; en cas de conflit sur le PDF, le recompiler.
