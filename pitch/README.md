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
- Rectangle : `\card{x}{y}{largeur}{hauteur}{couleur}` ; capture fixe : `\phone{x}{y}{largeur}{image}`.
- Couleurs de l'application définies en haut du fichier.

## Texte à dire
Dans chaque diapo, bloc `\note{...}`. Pour les afficher à droite des diapos, retirer le `%` devant `\setbeameroption{show notes on second screen=right}`. Ne pas valider le PDF avec les notes affichées.

## La vidéo de la diapo 3
- La diapo 3 montre un téléphone avec une image de la vidéo promo (`images/promo-affiche.jpg`) et un bouton lecture : **un clic sur le téléphone ouvre [`sharewood-promo.mp4`](sharewood-promo.mp4)** dans le lecteur vidéo (59 s, fluide). La passer en plein écran, puis revenir au PDF.
- Le fichier MP4 doit rester **dans le même dossier que le PDF**. Adobe Acrobat demande l'autorisation d'ouvrir le fichier au premier clic : accepter. Aperçu (macOS) ne suit pas ce lien : ouvrir alors la vidéo à la main. **À essayer sur l'ordinateur de présentation avant la répétition (C4).**
- Remplace les 3 boucles vidéo intégrées d'Anne-Lise (retirées le 28/11, toujours dans l'historique git ; scripts `pitch/video/tourner3.sh`). Repli : [`demo-16x9.mp4`](demo-16x9.mp4) (ancienne vidéo de 40 s).

## La vidéo promo (format téléphone)
- [`sharewood-promo.mp4`](sharewood-promo.mp4) : 59 s, 1080 × 1920 capturé en vraie résolution, 60 i/s, sans son (piste muette), données d'exemple (compte « Sarah », offres « (démo) »).
- Parcours : profil en quelques gestes → accueil et carte → recherche « piscine » et « J'en ai profité » → partage d'une offre prise en photo → profil, activité et boutique ; cinq intercalaires (« Un profil qui te ressemble », « Repère les vrais bons plans », « Partage en quelques secondes », « Solidarité récompensée », « ShareWood »).
- Refaire : kit et marche à suivre dans [`promo/`](promo/) (`LISEZMOI.txt`).

## À savoir
- Les captures montrent l'application avec des **offres d'exemple** marquées « (démo) ».
- Le tarif de 9,90 € n'apparaît plus sur les diapos (diapo 5 : « Le temps ») ; la conclusion évoque encore Erasmus comme ouverture (diapo dédiée retirée le 28/11).
- Travailler à plusieurs : faire `git pull` avant de modifier et prévenir les autres ; en cas de conflit sur le PDF, le recompiler.
