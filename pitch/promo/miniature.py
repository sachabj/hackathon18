# Miniature YouTube 1280 × 720 de la vidéo promo : python3 miniature.py <image accueil> <image boutique>
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont
W, H = 1280, 720
FOREST, DARK, CREAM, SAGE, GOLD = (30, 58, 47), (16, 36, 28), (250, 249, 245), (207, 227, 202), (242, 193, 78)
img = Image.new("RGB", (W, H))
d = ImageDraw.Draw(img)
for y in range(H):  # dégradé vertical forêt
    k = y / H
    d.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * k) for a, b in zip(FOREST, DARK)))
f = lambda name, size: ImageFont.truetype(f"fonts/{name}.ttf", size)

def phone(path, h, angle):
    shot = Image.open(path).convert("RGB")
    w = int(h * shot.width / shot.height)
    shot = shot.resize((w, h), Image.LANCZOS)
    pad, r = 12, 34
    body = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle([0, 0, w + 2 * pad - 1, h + 2 * pad - 1], r + pad, fill=(18, 18, 16, 255))
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], r, fill=255)
    body.paste(shot, (pad, pad), mask)
    return body.rotate(angle, resample=Image.BICUBIC, expand=True)

def shadowed(layer, xy):
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    a = layer.getchannel("A").point(lambda v: int(v * 0.45))
    sh.paste((0, 0, 0, 255), (xy[0] + 14, xy[1] + 22), a)
    img.paste(sh.filter(ImageFilter.GaussianBlur(18)), (0, 0), sh.filter(ImageFilter.GaussianBlur(18)))
    img.paste(layer, xy, layer)

shadowed(phone(sys.argv[1], 640, 6), (735, 40))
shadowed(phone(sys.argv[2], 600, -5), (880, 95))

logo = Image.open("cards/logo.png").convert("RGBA").resize((120, 120), Image.LANCZOS)
img.paste(logo, (70, 92), logo)
d = ImageDraw.Draw(img)
d.text((70, 240), "ShareWood", font=f("newsreader-500", 124), fill=CREAM)
d.text((74, 400), "Le Waze des bons plans", font=f("inter-500", 46), fill=SAGE)
d.text((74, 458), "étudiants", font=f("inter-500", 46), fill=SAGE)
d.rounded_rectangle([74, 556, 74 + 330, 556 + 64], 32, fill=GOLD)
d.text((74 + 165, 588), "Démo · 59 s", font=f("inter-500", 32), fill=DARK, anchor="mm")
d.text((74, 650), "Hackathon ENSAI · 27-28 novembre 2026", font=f("inter-400", 26), fill=(170, 190, 180))
img.save(sys.argv[3] if len(sys.argv) > 3 else "miniature.jpg", quality=92)
