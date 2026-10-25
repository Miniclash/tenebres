# Direction artistique

Référence commune pour tout ce qui touche à l'image du jeu. Si un asset ne respecte pas ce qui suit, il ne rentrera pas dans le jeu.

## Le style

- Pixel art en vraie basse résolution, filtre CRT sur tout l'écran (interface comprise), dans la famille visuelle de Charabia.
- Vue de dessus en faux trois-quarts, façon Zelda GBA : on voit le dessus des têtes et le dos des persos.
- Persos sans visage, façon Lemmings en plus simple. La foule doit se lire comme une masse, l'individu comme une silhouette.
- Ton mignon et grotesque. Personne de réel n'est représenté.

## Les tailles

- Densité retenue (option B) : **1 case de carte = 12 pixels natifs**. Le rendu se fait à cette résolution puis est agrandi en entier (×2 sur un desktop, environ ×1 sur mobile).
- Toutes les pièces se dessinent sur un **cadre de 9 × 11 pixels**. Le corps d'un manifestant occupe 5 × 7 (colonnes 2 à 6, lignes 4 à 10). Le pied est en (4, 10).
- Un CRS fait la même hauteur qu'un manifestant. Le bouclier l'élargit, la matraque non.
- Les pièces sont dessinées tournées vers la gauche ; le jeu les retourne pour aller à droite.
- Véhicules (fourgon, camion lance-eau) : à refaire, sur une grille à définir quand on les attaquera.

## La palette

- 256 couleurs : 16 rampes de 16 pas, dans `data/palette.js`, générées par `tools/palette.py`.
- Une couleur se nomme `rampe.pas` (`rouge.9`, `gris.15`). Les ombres et lumières se calculent dans la même rampe, 3 pas plus bas ou plus haut.
- Bitume éclairci (`bitume.4`) pour que les uniformes marine se détachent.
- Couleurs réservées aux rôles, jamais tirées pour la foule : `gris.15` et `rouge.9` (medic), `jaune.15` (écran du filmeur).

## Les persos

- Calques, du fond vers l'avant : derrière (pancarte, drapeau, parapluie), jambes, corps, bras, tête, devant (bouclier, matraque).
- Les bras sont un calque à part et prennent les couleurs du perso (manche = haut, main = peau). Une pièce peut imposer des bras : pancartes, drapeaux et parapluie imposent les bras levés. Les futures poses (panique, interpellation, reddition) pourront faire pareil.
- Un costume (banane, dinosaure, tout nu) cache les calques qu'il remplace.
- Persos : manifestant, medic, porte-drapeau (Palestine, Bretagne, arc-en-ciel), black bloc (tout en noir, parfois un parapluie), CRS bouclier et CRS matraque (liseré jaune sur le casque), et trois spéciaux rares : banane, tout nu, dinosaure gonflable.
- Composition de la foule par défaut : porte-drapeaux 1 sur 60, black blocs 1 sur 40 en grappes de 4 à 8, spéciaux 1 sur 150 au total, manifestants pour le reste. Les medics sont un rôle donné par le joueur.

## Les rôles

Le rôle se lit à la silhouette, pas à un pictogramme :

- Medic : haut blanc avec une croix rouge de 3 × 3 dans le dos.
- Filmeur : bras levé et un pixel lumineux au-dessus de la tête.
- Banderole : deux manifestants qui tiennent une bande entre eux.
- Mégaphone : un cône clair à côté de la tête, des petits arcs quand il parle.
- Un liseré au sol seulement pour le rôle sélectionné.

## Les animations prévues

Marche (2 images, faite), panique sous gaz, porté par un CRS, au sol, relevé par un medic. Police : marche en cordon, charge, interpellation. Chaque nouvelle pose s'ajoute dans `poses` de `data/sprites.js` et apparaît dans le studio.

## Le studio

`studio.html` : on dessine les pièces, on règle les tirages, la rue montre la foule générée en direct. Le travail reste dans le navigateur ; on télécharge `sprites.js` pour remplacer `data/sprites.js`. Le moteur `src/sprites.js` est celui que le jeu utilisera.
