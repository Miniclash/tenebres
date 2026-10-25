# Bismillah · C'est les ténèbres

Petit jeu satirique inspiré des manifestations du 17 octobre 2026 à Paris. Tower defense inversé façon Lemmings : tu n'es pas un manifestant, tu es la manif. Il faut faire sortir le cortège de la nasse avant que la préfecture ferme toutes les rues. Roguelite incrémental : entre deux actes, la colère accumulée achète des améliorations.

## Lancer

Ouvre `index.html` dans un navigateur, ou sers le dossier :

```sh
python3 -m http.server
```

Zéro dépendance, zéro build.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | La page : HUD, scène, outils, bandeau d'info. |
| `css/jeu.css` | Le style de l'interface (pancartes en carton, bandeau télé). |
| `src/jeu.js` | Le proto v0.1 en un seul fichier : génération de carte, foule, police, gaz, timeline, rendu, écrans. |
| `src/vendor/charabia.js` | Copie du moteur de voix [Charabia](https://github.com/Miniclash/Charabia), pas encore branché. |
| `docs/etat-du-projet.md` | Ce qui existe, ce qui coince, ce qui vient. |

## Commandes

Souris ou doigt. Clavier : `1` mégaphone, `2` banderole, `3` medic, `4` filmeur, `espace` pause.
