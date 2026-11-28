// Version PowerPoint du pitch : chaque diapo = image du PDF (pitch/sharewood.pdf), notes d'orateur,
// vidéo promo intégrée dans le téléphone de la diapo 3 (lecture au clic), liens rétablis.
// Usage (pptxgenjs installé dans DIR) : NODE_PATH=DIR/node_modules node pitch/promo/pptx.cjs <dossier des images slideN.png> <notes.json> <aperçu.png> <sortie.pptx>
// puis : python3 pitch/promo/pptx_fix.py <sortie.pptx>   (numéros de formes uniques, sans entrées de dossier)
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const [imgDir, notesFile, cover, out] = process.argv.slice(2);
const pitch = path.join(__dirname, "..");
const notes = JSON.parse(fs.readFileSync(notesFile, "utf8"));
const VIDEO = "https://youtube.com/shorts/NvxBMh5c1zU";
const APP = "https://sharewood-ensai.vercel.app";
// Positions en « pixels » de la diapo LaTeX (1920 × 1080) → pouces (10 × 5,625).
const px = (v) => v / 192;
const transparent = "image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAADklEQVR4nGNgGAWgEAAAAQgAAaUERR4AAAAASUVORK5CYII="; // image entièrement transparente
const link = (slide, x, y, w, h, url, tooltip) => slide.addImage({ data: transparent, x, y, w, h, hyperlink: { url, tooltip }, altText: tooltip });

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "ShareWood — pitch";
pres.author = "Anne-Lise, Justin, Matteo, Sacha";
notes[2] = notes[2].replace(/\(La vidéo est en ligne[^)]*\)/, "(Cliquer sur la vidéo du téléphone pour la lancer : 59 s, sans son. Elle est aussi en ligne : QR code et lien.)");
notes.forEach((note, i) => {
  const slide = pres.addSlide();
  slide.background = { path: path.join(imgDir, `slide${i + 1}.png`) };
  if (i === 2) {
    // Écran du téléphone : (432, 182), 484 × 860 sur 1920 × 1080, proportions de la vidéo.
    slide.addMedia({
      type: "video",
      path: path.join(pitch, "sharewood-promo.mp4"),
      cover: "image/png;base64," + fs.readFileSync(cover).toString("base64"), // image de la vidéo à 23 s, en PNG
      x: px(432), y: px(182), w: px(484), h: px(860),
    });
    link(slide, px(1130), px(290), px(380), px(380), VIDEO, "Voir la vidéo sur YouTube");
    link(slide, px(1080), px(870), px(480), px(50), VIDEO, "Voir la vidéo sur YouTube");
  }
  if (i === 5) link(slide, 3.73, 4.66, 2.54, 0.22, APP, "Ouvrir ShareWood");
  if (note) slide.addNotes(note);
});
pres.writeFile({ fileName: out }).then((f) => console.log("écrit :", f));
