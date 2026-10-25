# Bismillah · C'est les ténèbres

PFais sortir le cortège de la nasse avant que la préfecture ferme toutes les rues. Roguelite incrémental : entre deux actes, la colère accumulée achète des améliorations.

## Lancer

Ouvre `index.html` dans un navigateur, ou sers le dossier :

```sh
python3 -m http.server
```

Zéro dépendance, zéro build.

Le studio de sprites s'ouvre de la même façon : `studio.html`.

`index.html` est la place de la République : verticale, pixel CRT, jouable au téléphone. L'ancien proto en rues est dans `proto.html`.

## Structure

| Fichier | Rôle |
|---|---|
| `proto.html` | L'ancien proto v0.1 (rues, vue de dessus), mis de côté. |
| `css/jeu.css` | Le style de l'interface (pancartes en carton, bandeau télé). |
| `src/jeu.js` | Le proto v0.1 : foule, police, gaz, timeline, rendu, écrans. |
| `index.html`, `src/place.js`, `css/place.css` | La place de la République en vertical : foule, cordons qui chargent et reculent, rapport de force, phases rassemblement puis dispersion. Reprend le brouillon du studio s'il existe dans le navigateur. |
| `data/cartes.js` | Les cartes faites main, décrites en rues (polylignes + largeur), sorties et barrages. |
| `src/carte.js` | Rastérise une carte de `data/cartes.js` sur la grille de simulation. |
| `studio.html`, `src/studio.js`, `css/studio.css` | Le studio : dessin des pièces de persos, réglage des tirages, aperçu de la foule. |
| `src/sprites.js` | Le moteur de sprites, commun au studio et (bientôt) au jeu. |
| `data/palette.js` | La palette de 256 couleurs, générée par `tools/palette.py`. |
| `data/sprites.js` | Les pièces et les tirages, éditables à la main ou depuis le studio. |
| `docs/direction-artistique.md` | Tailles, palette, rôles, animations : la référence visuelle. |
| `src/vendor/charabia.js` | Copie du moteur de voix [Charabia](https://github.com/Miniclash/Charabia), pas encore branché. |
| `docs/etat-du-projet.md` | Ce qui existe, ce qui coince, ce qui vient. |

## Commandes

Souris ou doigt. Clavier : `1` mégaphone, `2` banderole, `3` medic, `4` filmeur, `espace` pause.
