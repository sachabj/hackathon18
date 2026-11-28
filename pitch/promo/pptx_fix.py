# Corrige le .pptx écrit par pptxgenjs : numéros de formes uniques sur chaque diapo (sinon PowerPoint peut proposer
# une réparation) et archive sans entrées de dossier. Usage : python3 pptx_fix.py deck.pptx
import re, sys, zipfile
path = sys.argv[1]
with zipfile.ZipFile(path) as z:
    items = [(i, z.read(i)) for i in z.infolist() if not i.filename.endswith("/")]
out = []
for info, data in items:
    if re.fullmatch(r"ppt/slides/slide\d+\.xml", info.filename):
        n = iter(range(2, 10_000))
        data = re.sub(rb'(<p:cNvPr id=")\d+(")', lambda m: m.group(1) + str(next(n)).encode() + m.group(2), data)
    out.append((info.filename, data))
out.sort(key=lambda x: x[0] != "[Content_Types].xml")
with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
    for name, data in out:
        z.writestr(name, data, compress_type=zipfile.ZIP_STORED if name.endswith(".mp4") else zipfile.ZIP_DEFLATED)
print("corrigé :", path, len(out), "parties")
