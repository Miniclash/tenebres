/*
 * Palette de Bismillah : 16 rampes × 16 pas = 256 couleurs. Générée par tools/palette.py.
 * Une couleur se nomme « rampe.pas » : "rouge.8", "gris.15". Pas 0 = le plus sombre, 15 = le plus clair.
 * Les ombres et lumières des sprites se calculent en descendant ou montant de pas dans la même rampe.
 * reservees : couleurs qu'aucun tirage aléatoire ne doit utiliser, pour que les rôles se repèrent.
 */
window.TENEBRES_PALETTE = {
  rampes: {
    gris:     ["#0a0a0b", "#1b1b1e", "#2a2b30", "#3a3b42", "#494b53", "#575a64", "#666975", "#747986", "#858995", "#959ba3", "#a6abb1", "#b6bcbf", "#c7cbcd", "#d7dadb", "#e7e9ea", "#f7f8f8"],
    bitume:   ["#131111", "#23201f", "#322e2d", "#413c3a", "#504a47", "#5e5753", "#6d6560", "#7b736c", "#898179", "#958e87", "#a19b95", "#ada8a3", "#b9b5b0", "#c5c2be", "#d1cfcc", "#dddcda"],
    pierre:   ["#1f1416", "#332121", "#462f2d", "#5a3e37", "#6d4e42", "#80604c", "#927356", "#a38862", "#ad9974", "#b8a686", "#c2b498", "#ccc1aa", "#d6cebc", "#e0dace", "#eae7df", "#f5f3f0"],
    carton:   ["#1c0c0f", "#341518", "#4a1c1c", "#612923", "#773729", "#8d492f", "#a35e34", "#b9763b", "#c68b49", "#cc9a5f", "#d1a874", "#d7b68a", "#dcc39f", "#e2d0b4", "#e9dcc8", "#f0e8db"],
    peau:     ["#221114", "#381a1d", "#4e2223", "#632b29", "#78372f", "#8d4636", "#a1563c", "#b66943", "#c07c54", "#c68d68", "#cd9d7c", "#d3ad90", "#d9bca4", "#e0cab7", "#e7d8ca", "#eee6dd"],
    brun:     ["#0d0709", "#211013", "#34181b", "#472020", "#592b27", "#6c382d", "#7e4834", "#90593b", "#a26942", "#b3774a", "#ba865b", "#c0946d", "#c6a280", "#ccb092", "#d2bda4", "#d9c9b5"],
    rouge:    ["#1c0814", "#360e23", "#4f132e", "#691634", "#831936", "#9d1c34", "#b61f2d", "#cf2224", "#dd3930", "#e05648", "#e37361", "#e58d7a", "#e8a592", "#ebbbaa", "#efcfc1", "#f3e1d8"],
    orange:   ["#22070e", "#3e0b14", "#590d14", "#750f0f", "#911a0f", "#ac2b10", "#c84110", "#e25c11", "#ee7521", "#ef893b", "#f09b56", "#f0ad70", "#f1bd8b", "#f2cca4", "#f3dabd", "#f6e7d5"],
    jaune:    ["#220708", "#3f100b", "#5b1d0e", "#782e0f", "#954510", "#b16210", "#ce8411", "#e9ac12", "#efc129", "#f0c944", "#f1d15f", "#f1d87b", "#f2df96", "#f3e6b0", "#f5edc9", "#f9f4e2"],
    vert:     ["#08110f", "#12281f", "#1b3e2d", "#235536", "#2a6b3d", "#318140", "#38973f", "#43ac40", "#58bd4c", "#70c461", "#87cb76", "#9cd18b", "#b1d8a0", "#c3dfb5", "#d4e6c9", "#e4eedd"],
    sarcelle: ["#080e12", "#11232a", "#193841", "#204f58", "#26676f", "#2c8286", "#329d9c", "#39b3aa", "#44c4b1", "#5acaaf", "#70d0b0", "#87d6b4", "#9ddcbb", "#b2e2c5", "#c7e8d1", "#dbf0e0"],
    bleu:     ["#070c18", "#0d1933", "#12254d", "#163368", "#194183", "#1c509d", "#1f60b7", "#2272d1", "#328bde", "#4ca9e1", "#65c1e4", "#7fd5e6", "#98e4e9", "#b1edea", "#c9f1eb", "#e0f6f0"],
    marine:   ["#07080d", "#101321", "#181d34", "#202847", "#273259", "#2d3c6c", "#34467e", "#3b5190", "#4260a2", "#4a75b3", "#5b8bba", "#6d9fc0", "#80b0c6", "#92bfcc", "#a4ccd2", "#b5d8d9"],
    violet:   ["#0e0a15", "#1e142b", "#2d1c41", "#3c2457", "#4b2b6d", "#5a3283", "#6a3999", "#7a40ae", "#8e4dbd", "#a462c4", "#b877cb", "#c88cd2", "#d6a1d8", "#dfb5dd", "#e6c9e2", "#eeddea"],
    rose:     ["#1b0919", "#35102f", "#4e1542", "#681a53", "#811e62", "#9a226e", "#b42678", "#cc2a7f", "#d73b85", "#db548c", "#df6c95", "#e284a1", "#e69cae", "#eab4be", "#efcbcf", "#f5e0e2"],
    acier:    ["#0d0f12", "#1b1f26", "#282f39", "#343e4c", "#404e5e", "#4c5d71", "#586d83", "#637d95", "#748ea2", "#85a0ae", "#97b0b9", "#a9bfc4", "#bacecf", "#ccdbdb", "#dde6e5", "#edf2f1"],
  },
  ombre: 3,
  lumiere: 3,
  reservees: {
    'gris.15': 'Medic (haut blanc)',
    'rouge.9': 'Medic (croix)',
    'jaune.15': 'Filmeur (écran)',
  },
  decor: { bitume: 'bitume.4', bitumeGrain: ['bitume.3', 'bitume.5'], trottoir: 'bitume.6', dalle: 'bitume.5', bordure: 'bitume.8', marquage: 'pierre.11' },
};
