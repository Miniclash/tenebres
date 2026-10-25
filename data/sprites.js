/*
 * Sprites de Bismillah : les pièces, les persos et la composition de la foule.
 *
 * Ce fichier se modifie à la main OU dans le studio (studio.html) :
 * dessine dans le studio, télécharge sprites.js, remplace celui-ci.
 *
 * cadre   : toutes les pièces se dessinent sur la même grille de 9 × 11 pixels.
 *           Le corps d'un manifestant occupe les colonnes 2 à 6 et les lignes 4 à 10 (5 × 7).
 *           pied = le point posé au sol, celui qui suit la position du perso dans le jeu.
 *           Les pièces sont dessinées tournées vers la gauche ; le jeu les retourne pour aller à droite.
 * poses   : les animations. Chaque pièce a des images pour chaque pose ; une seule image = immobile.
 * calques : l'ordre de dessin, du fond vers l'avant. Un perso = au plus une pièce par calque.
 * canaux  : les couleurs tirées au hasard pour chaque perso (peau, haut…).
 *
 * pieces : chaque pièce a
 *   calque  : où elle se range
 *   legende : à quoi correspond chaque lettre de la grille
 *             "haut"   → la couleur tirée pour le canal haut
 *             "haut-"  → la même, en ombre (quelques pas plus sombre dans la même rampe)
 *             "haut+"  → la même, en lumière
 *             "gris.15" → une couleur fixe de la palette (data/palette.js)
 *   poses   : pour chaque pose, la liste des images ; chaque image = 11 lignes de 9 caractères, « . » = vide.
 *   impose  : (facultatif) force une pièce dans un autre calque, ex. { "bras": "bras_leves" }
 *   masque  : (facultatif) calques cachés quand cette pièce est portée, ex. ["tete", "bras"]
 *
 * types : les persos.
 *   herite  : reprend un autre perso, puis remplace ce qui est précisé
 *   calques : pour chaque calque, les pièces possibles et leur poids (piece: null = rien)
 *   canaux  : pour chaque canal, les couleurs possibles (répéter une couleur = plus fréquente)
 *
 * foule : la composition d'une manif.
 *   reste   : le perso qui remplit tout ce que les groupes ne prennent pas
 *   groupes : chaque groupe prend « un_sur » N manifestants, tirés parmi ses types ;
 *             paquet: [min, max] les fait arriver en grappes.
 */
window.TENEBRES_SPRITES = {
  "version": 2,
  "cadre": { "l": 9, "h": 11, "pied": [4, 10] },
  "poses": [
    { "id": "marche", "nom": "Marche", "images": 2 }
  ],
  "calques": [
    { "id": "derriere", "nom": "Derrière" },
    { "id": "jambes", "nom": "Jambes" },
    { "id": "corps", "nom": "Corps" },
    { "id": "bras", "nom": "Bras" },
    { "id": "tete", "nom": "Tête" },
    { "id": "devant", "nom": "Devant" }
  ],
  "canaux": [
    { "id": "peau", "nom": "Peau, mains" },
    { "id": "cheveux", "nom": "Cheveux" },
    { "id": "haut", "nom": "Haut" },
    { "id": "bas", "nom": "Bas" },
    { "id": "chaussures", "nom": "Chaussures" },
    { "id": "coiffe", "nom": "Coiffe" },
    { "id": "objet", "nom": "Objet" },
    { "id": "casque", "nom": "Casque" },
    { "id": "equipement", "nom": "Équipement" }
  ],
  "pieces": [
    {
      "id": "pancarte", "nom": "Pancarte", "calque": "derriere",
      "legende": { "o": "objet", "O": "objet-", "i": "brun.2" },
      "poses": { "marche": [[
        "..ooooo..",
        "..oiiio..",
        "..OOOOO..",
        "....O....",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ]] },
      "impose": { "bras": "bras_leves" }
    },
    {
      "id": "drapeau_palestine", "nom": "Drapeau Palestine", "calque": "derriere",
      "legende": { "k": "gris.1", "w": "gris.14", "g": "vert.6", "r": "rouge.8", "s": "brun.7" },
      "poses": { "marche": [[
        "..kkkrs..",
        "..wwrrs..",
        "..gggrs..",
        "......s..",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ]] },
      "impose": { "bras": "bras_leves" }
    },
    {
      "id": "drapeau_bretagne", "nom": "Drapeau Bretagne", "calque": "derriere",
      "legende": { "k": "gris.1", "w": "gris.14", "s": "brun.7" },
      "poses": { "marche": [[
        "..kkwws..",
        "..wwwws..",
        "..kkkks..",
        "......s..",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ]] },
      "impose": { "bras": "bras_leves" }
    },
    {
      "id": "drapeau_arcenciel", "nom": "Drapeau arc-en-ciel", "calque": "derriere",
      "legende": { "r": "rouge.8", "j": "jaune.10", "v": "vert.7", "b": "violet.8", "s": "brun.7" },
      "poses": { "marche": [[
        "..rrrrs..",
        "..jjjjs..",
        "..vvvvs..",
        "..bbbbs..",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ]] },
      "impose": { "bras": "bras_leves" }
    },
    {
      "id": "parapluie", "nom": "Parapluie", "calque": "derriere",
      "legende": { "q": "gris.2", "Q": "gris.4", "s": "gris.6" },
      "poses": { "marche": [[
        ".........",
        "..qqqqq..",
        ".qQqQqQq.",
        "....s....",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ]] },
      "impose": { "bras": "bras_leves" }
    },
    {
      "id": "jambes", "nom": "Jambes", "calque": "jambes",
      "legende": { "b": "bas", "k": "chaussures" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "...b.b...",
        "...k.k..."
      ], [
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "....b....",
        "....k...."
      ]] }
    },
    {
      "id": "haut", "nom": "Haut", "calque": "corps",
      "legende": { "h": "haut" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "...hhh...",
        "...hhh...",
        "...hhh...",
        ".........",
        "........."
      ]] }
    },
    {
      "id": "haut_medic", "nom": "Haut medic", "calque": "corps",
      "legende": { "h": "haut", "r": "rouge.9" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "...hrh...",
        "...rrr...",
        "...hrh...",
        ".........",
        "........."
      ]] }
    },
    {
      "id": "uniforme_crs", "nom": "Uniforme CRS", "calque": "corps",
      "legende": { "h": "haut", "c": "gris.1" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "...hhh...",
        "...hhh...",
        "...ccc...",
        ".........",
        "........."
      ]] }
    },
    {
      "id": "banane", "nom": "Costume banane", "calque": "corps",
      "legende": { "y": "jaune.10", "Y": "jaune.7", "k": "brun.3" },
      "poses": { "marche": [[
        ".........",
        "....k....",
        "....yY...",
        "...yyY...",
        "...yyY...",
        "..yyyY...",
        "..yyyY...",
        "..yyyY...",
        "...yyY...",
        ".........",
        "........."
      ]] },
      "masque": ["tete", "bras", "derriere"]
    },
    {
      "id": "nu", "nom": "Tout nu", "calque": "corps",
      "legende": { "p": "peau", "P": "peau-", "c": "gris.0" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "..PpppP..",
        "..ppppp..",
        "...ccc...",
        "...p.p...",
        "...P.P..."
      ], [
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "..PpppP..",
        "..ppppp..",
        "...ccc...",
        "....p....",
        "....P...."
      ]] },
      "masque": ["bras", "jambes", "derriere"]
    },
    {
      "id": "dinosaure", "nom": "Dinosaure gonflable", "calque": "corps",
      "legende": { "g": "vert.8", "G": "vert.5", "k": "gris.1", "l": "vert.11" },
      "poses": { "marche": [[
        ".........",
        "..ggg....",
        ".gkggg...",
        ".gggg....",
        "..ggg....",
        "..gggg...",
        ".lggggg..",
        "..ggggggG",
        "...gggGG.",
        ".........",
        "........."
      ]] },
      "masque": ["tete", "bras", "derriere"]
    },
    {
      "id": "bras_bas", "nom": "Bras le long du corps", "calque": "bras",
      "legende": { "H": "haut-", "p": "peau" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "..H...H..",
        "..p...p..",
        ".........",
        ".........",
        "........."
      ]] }
    },
    {
      "id": "bras_leves", "nom": "Bras levés", "calque": "bras",
      "legende": { "H": "haut-", "p": "peau" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        "..p...p..",
        "..H...H..",
        "..H...H..",
        "..H...H..",
        ".........",
        ".........",
        ".........",
        "........."
      ]] }
    },
    {
      "id": "tete_cheveux", "nom": "Cheveux", "calque": "tete",
      "legende": { "c": "cheveux", "L": "cheveux+" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        "...cLc...",
        "...ccc...",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ]] }
    },
    {
      "id": "tete_capuche", "nom": "Capuche", "calque": "tete",
      "legende": { "h": "haut", "L": "haut+" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        "...hLh...",
        "...hhh...",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ]] }
    },
    {
      "id": "tete_bonnet", "nom": "Bonnet", "calque": "tete",
      "legende": { "o": "coiffe", "L": "coiffe+", "c": "cheveux" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        "....L....",
        "...ooo...",
        "...ccc...",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ]] }
    },
    {
      "id": "casque_crs", "nom": "Casque CRS", "calque": "tete",
      "legende": { "M": "casque", "j": "jaune.10" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        "...MjM...",
        "...MMM...",
        ".........",
        ".........",
        ".........",
        ".........",
        "........."
      ]] }
    },
    {
      "id": "bouclier", "nom": "Bouclier", "calque": "devant",
      "legende": { "D": "equipement", "d": "equipement-" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        "dD.......",
        "dD.......",
        "dD.......",
        "dD.......",
        "dD.......",
        "dD.......",
        "dD......."
      ]] }
    },
    {
      "id": "matraque", "nom": "Matraque", "calque": "devant",
      "legende": { "t": "gris.1" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        ".......t.",
        ".......t.",
        ".......t.",
        ".........",
        ".........",
        ".........",
        "........."
      ]] }
    }
  ],
  "types": [
    {
      "id": "manifestant", "nom": "Manifestant",
      "calques": {
        "derriere": [{ "piece": null, "poids": 7 }, { "piece": "pancarte", "poids": 3 }],
        "jambes": [{ "piece": "jambes", "poids": 1 }],
        "corps": [{ "piece": "haut", "poids": 1 }],
        "bras": [{ "piece": "bras_bas", "poids": 1 }],
        "tete": [{ "piece": "tete_cheveux", "poids": 6 }, { "piece": "tete_capuche", "poids": 2 }, { "piece": "tete_bonnet", "poids": 2 }]
      },
      "canaux": {
        "peau": ["peau.5", "peau.7", "peau.9", "peau.10", "peau.12", "peau.13"],
        "cheveux": ["brun.1", "brun.3", "brun.5", "brun.8", "jaune.11", "gris.1", "gris.10", "rose.8"],
        "haut": ["rouge.7", "bleu.7", "jaune.10", "gris.2", "vert.7", "pierre.13", "violet.7", "orange.9", "sarcelle.8", "rose.8", "marine.6", "gris.3"],
        "bas": ["marine.3", "bleu.4", "gris.2", "brun.4", "vert.3", "bitume.2"],
        "chaussures": ["gris.1", "brun.2", "gris.12"],
        "coiffe": ["rouge.7", "jaune.10", "gris.2", "vert.6", "bleu.6", "orange.9"],
        "objet": ["carton.9", "carton.10", "carton.11", "pierre.13"]
      }
    },
    {
      "id": "medic", "nom": "Medic", "herite": "manifestant",
      "calques": {
        "derriere": [{ "piece": null, "poids": 1 }],
        "corps": [{ "piece": "haut_medic", "poids": 1 }],
        "tete": [{ "piece": "tete_cheveux", "poids": 3 }, { "piece": "tete_bonnet", "poids": 1 }]
      },
      "canaux": {
        "haut": ["gris.15"]
      }
    },
    {
      "id": "porte_drapeau", "nom": "Porte-drapeau", "herite": "manifestant",
      "calques": {
        "derriere": [{ "piece": "drapeau_palestine", "poids": 1 }, { "piece": "drapeau_bretagne", "poids": 1 }, { "piece": "drapeau_arcenciel", "poids": 1 }]
      },
      "canaux": {}
    },
    {
      "id": "black_bloc", "nom": "Black bloc", "herite": "manifestant",
      "calques": {
        "derriere": [{ "piece": null, "poids": 6 }, { "piece": "parapluie", "poids": 2 }],
        "tete": [{ "piece": "tete_capuche", "poids": 1 }]
      },
      "canaux": {
        "peau": ["gris.2", "gris.2", "peau.7", "peau.10"],
        "haut": ["gris.1", "gris.1", "gris.2"],
        "bas": ["gris.1"],
        "chaussures": ["gris.1"]
      }
    },
    {
      "id": "crs_bouclier", "nom": "CRS bouclier",
      "calques": {
        "jambes": [{ "piece": "jambes", "poids": 1 }],
        "corps": [{ "piece": "uniforme_crs", "poids": 1 }],
        "bras": [{ "piece": "bras_bas", "poids": 1 }],
        "tete": [{ "piece": "casque_crs", "poids": 1 }],
        "devant": [{ "piece": "bouclier", "poids": 1 }]
      },
      "canaux": {
        "peau": ["gris.2"],
        "haut": ["marine.3"],
        "bas": ["marine.3"],
        "chaussures": ["gris.1"],
        "casque": ["marine.2"],
        "equipement": ["acier.10"]
      }
    },
    {
      "id": "crs_matraque", "nom": "CRS matraque", "herite": "crs_bouclier",
      "calques": {
        "devant": [{ "piece": "matraque", "poids": 1 }]
      },
      "canaux": {}
    },
    {
      "id": "banane", "nom": "Banane", "herite": "manifestant",
      "calques": {
        "corps": [{ "piece": "banane", "poids": 1 }]
      },
      "canaux": {}
    },
    {
      "id": "tout_nu", "nom": "Tout nu", "herite": "manifestant",
      "calques": {
        "corps": [{ "piece": "nu", "poids": 1 }]
      },
      "canaux": {}
    },
    {
      "id": "dinosaure", "nom": "Dinosaure", "herite": "manifestant",
      "calques": {
        "corps": [{ "piece": "dinosaure", "poids": 1 }]
      },
      "canaux": {}
    }
  ],
  "foule": {
    "reste": "manifestant",
    "groupes": [
      { "nom": "Porte-drapeaux", "types": ["porte_drapeau"], "un_sur": 60 },
      { "nom": "Black blocs", "types": ["black_bloc"], "un_sur": 40, "paquet": [4, 8] },
      { "nom": "Spéciaux", "types": ["banane", "tout_nu", "dinosaure"], "un_sur": 150 }
    ]
  }
};
