/*
 * Sprites de Bismillah : les pièces et les tirages de la foule.
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
 *
 * types : les sortes de persos.
 *   herite  : reprend un autre type, puis remplace ce qui est précisé
 *   calques : pour chaque calque, les pièces possibles et leur poids (piece: null = rien)
 *   canaux  : pour chaque canal, les couleurs possibles (répéter une couleur = plus fréquente)
 */
window.TENEBRES_SPRITES = {
  "version": 1,
  "cadre": { "l": 9, "h": 11, "pied": [4, 10] },
  "poses": [
    { "id": "marche", "nom": "Marche", "images": 2 }
  ],
  "calques": [
    { "id": "derriere", "nom": "Derrière" },
    { "id": "jambes", "nom": "Jambes" },
    { "id": "corps", "nom": "Corps" },
    { "id": "tete", "nom": "Tête" },
    { "id": "devant", "nom": "Devant" }
  ],
  "canaux": [
    { "id": "peau", "nom": "Peau" },
    { "id": "cheveux", "nom": "Cheveux" },
    { "id": "haut", "nom": "Haut" },
    { "id": "bas", "nom": "Bas" },
    { "id": "chaussures", "nom": "Chaussures" },
    { "id": "coiffe", "nom": "Coiffe" },
    { "id": "objet", "nom": "Objet" },
    { "id": "uniforme", "nom": "Uniforme" },
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
      ]] }
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
      "id": "jambes_crs", "nom": "Jambes CRS", "calque": "jambes",
      "legende": { "u": "uniforme", "k": "gris.2" },
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
        "...u.u...",
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
        "....u....",
        "....k...."
      ]] }
    },
    {
      "id": "haut", "nom": "Haut", "calque": "corps",
      "legende": { "h": "haut", "H": "haut-", "p": "peau" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "..HhhhH..",
        "..phhhp..",
        "...hhh...",
        ".........",
        "........."
      ]] }
    },
    {
      "id": "haut_medic", "nom": "Haut medic", "calque": "corps",
      "legende": { "W": "gris.15", "w": "gris.12", "r": "rouge.9", "p": "peau" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "..wWrWw..",
        "..prrrp..",
        "...WrW...",
        ".........",
        "........."
      ]] }
    },
    {
      "id": "uniforme_crs", "nom": "Uniforme CRS", "calque": "corps",
      "legende": { "U": "uniforme", "u": "uniforme-" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        ".........",
        "..uUUUu..",
        "..uUUUu..",
        "...UUU...",
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
      "legende": { "M": "casque", "m": "acier.11" },
      "poses": { "marche": [[
        ".........",
        ".........",
        ".........",
        ".........",
        "...MmM...",
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
      "canaux": {}
    },
    {
      "id": "crs_bouclier", "nom": "CRS bouclier",
      "calques": {
        "jambes": [{ "piece": "jambes_crs", "poids": 1 }],
        "corps": [{ "piece": "uniforme_crs", "poids": 1 }],
        "tete": [{ "piece": "casque_crs", "poids": 1 }],
        "devant": [{ "piece": "bouclier", "poids": 1 }]
      },
      "canaux": {
        "uniforme": ["marine.3"],
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
    }
  ]
};
