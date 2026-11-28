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
- Le PDF est déposé sur un site : il ne peut ni lire une vidéo ni ouvrir un fichier local. La diapo 3 montre donc un téléphone avec une image de la vidéo, un **QR code** et le **lien YouTube** de la vidéo promo, cliquables.
- Lien de la vidéo : **https://youtube.com/shorts/NvxBMh5c1zU** (aussi dans le formulaire de rendu). Il se règle **une seule fois** en haut de `sharewood.tex` (`\demourl`), puis recompiler ; s'il vaut `A_REMPLACER`, un bandeau rouge s'affiche sur la diapo.
- Mise en ligne YouTube (titre, description, miniature, réglages) : [`promo/youtube.md`](promo/youtube.md).
- Remplace les 3 boucles vidéo d'Anne-Lise (retirées le 28/11, toujours dans l'historique git). Repli en présentation : ouvrir [`sharewood-promo.mp4`](sharewood-promo.mp4) à la main.

## Version PowerPoint (vidéo intégrée)
- [`sharewood.pptx`](sharewood.pptx) (12 Mo) : les 6 diapos du PDF en images, avec les notes d'orateur ; **la vidéo promo est dans le fichier**, dans le téléphone de la diapo 3 : un clic dessus la lance (59 s, sans son). QR code, lien YouTube et lien de l'appli restent cliquables.
- Textes non modifiables dans PowerPoint : modifier `sharewood.tex`, recompiler le PDF, puis refaire le .pptx :
  `gs -sDEVICE=png16m -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -g2560x1440 -dPDFFitPage -o /tmp/s/slide%d.png sharewood.pdf`, une image PNG de la vidéo (`sips -s format png images/promo-affiche.jpg --out /tmp/s/cover.png`), les notes en JSON, puis `NODE_PATH=<dossier avec pptxgenjs>/node_modules node promo/pptx.cjs /tmp/s notes.json /tmp/s/cover.png sharewood.pptx && python3 promo/pptx_fix.py sharewood.pptx`.
- Pas essayé dans PowerPoint ni Keynote (absents de ce poste) : rendu vérifié avec LibreOffice. **Ouvrir le fichier sur l'ordinateur de présentation et cliquer sur la vidéo avant de présenter.**

## La vidéo promo (format téléphone)
- [`sharewood-promo.mp4`](sharewood-promo.mp4) : 59 s, 1080 × 1920 capturé en vraie résolution, 60 i/s, sans son (piste muette), données d'exemple (compte « Sarah », offres « (démo) »).
- Parcours : profil en quelques gestes → accueil et carte → recherche « piscine » et « J'en ai profité » → partage d'une offre prise en photo → profil, activité et boutique ; cinq intercalaires (« Un profil qui te ressemble », « Repère les vrais bons plans », « Partage en quelques secondes », « Solidarité récompensée », « ShareWood »).
- Refaire : kit et marche à suivre dans [`promo/`](promo/) (`LISEZMOI.txt`).

## À savoir
- Les captures montrent l'application avec des **offres d'exemple** marquées « (démo) ».
- Le tarif de 9,90 € n'apparaît plus sur les diapos (diapo 5 : « Le temps ») ; la conclusion évoque encore Erasmus comme ouverture (diapo dédiée retirée le 28/11).
- Travailler à plusieurs : faire `git pull` avant de modifier et prévenir les autres ; en cas de conflit sur le PDF, le recompiler.
