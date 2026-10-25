/* Cartes faites main. Coordonnées en cases (centre de case = entier).
   Une rue = une polyligne + une largeur (1, 2 ou 3 cases).
   Rue de largeur 2 : mettre la ligne sur une demi-case (x.5 ou y.5) pour qu'elle tombe entre deux colonnes.
   sortie : la rue débouche sur le bord de la carte et sert de sortie (dest = direction affichée).
   barre : la rue est barrée d'office au bout (barrières, fourgon), décor.
   La géographie est approximative : l'ordre des rues est respecté, pas les distances. */
window.CARTES = {
  republique: {
    nom: 'Place de la République',
    w: 60, h: 34,
    place: { x0: 2, y0: 9, x1: 18, y1: 18, statue: { x: 7, y: 13, w: 2, h: 2 } },
    rues: [
      // les grandes artères
      { nom: 'Boulevard Voltaire', type: 'bd', w: 3, pts: [[18,14],[59,14]], sortie: { dest: 'Nation', principale: true } },
      { nom: 'Avenue de la République', type: 'bd', w: 3, pts: [[17,10],[24,3],[59,3]], sortie: { dest: 'Père-Lachaise', ouverte: true } },
      { nom: 'Boulevard du Temple', type: 'bd', w: 3, pts: [[17,17],[25,25]] },
      { nom: 'Boulevard Beaumarchais', type: 'bd', w: 3, pts: [[25,25],[25,33]], sortie: { dest: 'Bastille', ouverte: true } },
      { nom: 'Rue du Temple', type: 'rue', w: 2, pts: [[7.5,19],[7.5,33]], sortie: { dest: 'Hôtel de Ville' } },
      { nom: 'Rue Amelot', type: 'rue', w: 2, pts: [[33.5,15],[33.5,33]], sortie: { dest: 'Bastille' } },

      // entre Avenue de la République et Voltaire
      { nom: 'Rue de Malte', type: 'rue', w: 2, pts: [[28.5,4],[28.5,13]] },
      { nom: 'Rue Jean-Pierre-Timbaud', type: 'rue', w: 2, pts: [[29,8.5],[52,8.5]] },
      { nom: 'Rue de la Folie-Méricourt', type: 'rue', w: 2, pts: [[41.5,4],[41.5,21]] },
      { nom: 'Rue Saint-Maur', type: 'rue', w: 2, pts: [[52.5,4],[52.5,21]] },

      // entre Voltaire et Beaumarchais
      { nom: 'Rue Oberkampf', type: 'rue', w: 2, pts: [[26,21.5],[59,21.5]], barre: true },
      { nom: 'Boulevard Richard-Lenoir', type: 'bd', w: 3, pts: [[47,15],[47,33]], sortie: { dest: 'Bastille' } },
      { nom: 'Rue du Chemin-Vert', type: 'rue', w: 2, pts: [[34,28.5],[59,28.5]], barre: true },
      { nom: 'Rue de Crussol', type: 'rue', w: 1, pts: [[34,18],[41,18]] },

      // entre Rue du Temple et Beaumarchais
      { nom: 'Rue Charlot', type: 'rue', w: 2, pts: [[15.5,19],[15.5,28]] },
      { nom: 'Rue Béranger', type: 'rue', w: 2, pts: [[8,22.5],[21,22.5]] },
      { nom: 'Rue de Bretagne', type: 'rue', w: 2, pts: [[8,28.5],[24,28.5]] },

      // barrées d'office
      { nom: 'Boulevard de Magenta', type: 'bd', w: 3, pts: [[5,8],[5,0]], barre: true },
      { nom: 'Rue du Faubourg-du-Temple', type: 'rue', w: 2, pts: [[14.5,8],[14.5,0]], barre: true },
      { nom: 'Boulevard Saint-Martin', type: 'bd', w: 3, pts: [[1,13],[0,13]], barre: true },
    ],
  },
};
