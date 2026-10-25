"""Génère data/palette.js : 16 rampes de 16 teintes = 256 couleurs.
Chaque rampe va du plus sombre (pas 0) au plus clair (pas 15). Les ombres
glissent vers le violet, les lumières vers le jaune, comme en pixel art.
Usage : python3 tools/palette.py   (réécrit data/palette.js)"""
import colorsys, json, math, os

# nom, teinte (deg), saturation max, luminosité min, luminosité max, glissement
RAMPES = [
    ("gris",     225, .07, .04, .97, .25),
    ("bitume",    30, .065, .07, .86, .15),
    ("pierre",    38, .26, .10, .95, .30),
    ("carton",    31, .52, .08, .90, .30),
    ("peau",      22, .46, .10, .90, .25),
    ("brun",      24, .42, .04, .78, .30),
    ("rouge",      2, .72, .07, .90, .35),
    ("orange",    24, .86, .08, .90, .30),
    ("jaune",     46, .86, .08, .93, .30),
    ("vert",     115, .46, .05, .90, .35),
    ("sarcelle", 174, .52, .05, .90, .35),
    ("bleu",     212, .72, .06, .92, .30),
    ("marine",   224, .42, .04, .78, .25),
    ("violet",   272, .46, .06, .90, .30),
    ("rose",     330, .66, .07, .92, .30),
    ("acier",    208, .20, .06, .94, .25),
]

def mix_hue(h, target, k):
    d = ((target - h + 540) % 360) - 180
    return (h + d * k) % 360

def rampe(h, s, lmin, lmax, g):
    out = []
    for i in range(16):
        t = i / 15
        hh = mix_hue(h, 250, g * (0.5 - t) * 2) if t < .5 else mix_hue(h, 55, g * (t - 0.5) * 2)
        ss = s * (0.55 + 0.45 * math.sin(math.pi * (0.15 + 0.7 * t)))
        ll = lmin + (lmax - lmin) * (t ** 0.95)
        r, gg, b = colorsys.hls_to_rgb(hh / 360, ll, ss)
        out.append("#%02x%02x%02x" % tuple(round(c * 255) for c in (r, gg, b)))
    return out

rampes = {nom: rampe(h, s, a, b, g) for nom, h, s, a, b, g in RAMPES}
dest = os.path.join(os.path.dirname(__file__), "..", "data", "palette.js")
with open(dest, "w") as f:
    f.write("/*\n * Palette de Bismillah : 16 rampes × 16 pas = 256 couleurs. Générée par tools/palette.py.\n"
            " * Une couleur se nomme « rampe.pas » : \"rouge.8\", \"gris.15\". Pas 0 = le plus sombre, 15 = le plus clair.\n"
            " * Les ombres et lumières des sprites se calculent en descendant ou montant de pas dans la même rampe.\n"
            " * reservees : couleurs qu'aucun tirage aléatoire ne doit utiliser, pour que les rôles se repèrent.\n */\n")
    f.write("window.TENEBRES_PALETTE = {\n  rampes: {\n")
    for nom, cols in rampes.items():
        f.write(f"    {nom + ':':10}{json.dumps(cols)},\n")
    f.write("  },\n")
    f.write("  ombre: 3,\n  lumiere: 3,\n")
    f.write("  reservees: {\n    'gris.15': 'Medic (haut blanc)',\n    'rouge.9': 'Medic (croix)',\n    'jaune.15': 'Filmeur (écran)',\n  },\n")
    f.write("  decor: { bitume: 'bitume.4', bitumeGrain: ['bitume.3', 'bitume.5'], trottoir: 'bitume.6', dalle: 'bitume.5', bordure: 'bitume.8', marquage: 'pierre.11' },\n")
    f.write("};\n")
print(open(dest).read())
