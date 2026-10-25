# État du projet

## Le concept

- Le joueur est la manif, pas un manifestant. Pas de verbe offensif contre la police : on gagne en tenant, en protégeant, en documentant et en s'échappant.
- Tower defense inversé : la police fait office de tours, le cortège est la vague qui doit passer.
- Rôles façon Lemmings, attribués approximativement : on touche une zone, le manifestant le plus proche prend le rôle.
- Roguelite incrémental : chaque acte se termine (sortie, nasse), la colère gagnée achète des améliorations, la répression monte quand on gagne.
- Ton : satire grotesque. Les personnages publics restent des archétypes (le Préfet, le Ministre), aucun nom réel, aucune victime réelle dans le jeu.

## Ce que fait le proto v0.1

- Carte de rues générée à chaque acte, place de la République au départ, Boulevard du Préfet barré d'office.
- Outils : Mégaphone (le cortège converge vers un point), Banderole (bloque un cordon), Medic (soigne, relève), Filmeur (ralentit la police, rapporte des preuves, perdues si GAV).
- Police : cordons qui avancent et interpellent, lance-lacrymo, fourgons.
- Timeline : cordons et lacrymo, arrêté préfectoral vers 1:25 (une sortie ferme, une autre ouvre), nasse vers 1:50, tout fermé vers 2:30.
- Bilan avec chiffres organisateurs / préfecture, caisse de grève à 9 améliorations, sauvegarde locale.
- Bandeau d'info satirique façon chaîne info en continu.

## Retours du premier test (Tanguy)

1. La police est molle : peu belliqueuse, peu mobile.
2. Le gaz repousse trop mollement, on veut du chaos quand un manifestant le touche.
3. On ne comprend pas ce qui fait bouger la foule, elle semble passive.
4. Les outils ne semblent pas servir au début, on gagne sans comprendre pourquoi.
5. Parfois tout est bloqué, aucune sortie possible : réaliste, pas ludique.
6. Le bandeau délirant est très réussi, à garder et enrichir.

## Pistes retenues (pas encore codées)

- Police : voltigeurs à moto qui chargent, cordons qui sprintent puis se reforment, grenadiers mobiles, charges télégraphiées.
- Gaz : panique contagieuse, sprints aléatoires, bousculades, banderoles lâchées.
- Foule : tête de cortège avec sono, pression qui monte quand c'est bloqué et fait reculer un cordon.
- Lisibilité : chaque outil a un effet visible, acte I qui introduit les menaces une par une.
- Blocages : toujours une faille, et des rôles pour en créer (Digicode par les cours d'immeuble, Grimpeur).
- Son : Charabia pour le Préfet, le présentateur du bandeau, les slogans de la foule, la radio des CRS.
- Code : séparer simulation, rendu et réglages pour équilibrer et brancher des sprites.

## Direction visuelle (décidée)

La référence détaillée est `docs/direction-artistique.md` dans le repo tenebres.

- Pixel art basse résolution avec filtre CRT sur tout l'écran, interface comprise, dans la famille de Charabia. L'interface actuelle (Permanent Marker, Barlow Condensed) sera refaite dans ce style.
- Faux trois-quarts façon Zelda GBA, persos sans visage façon Lemmings.
- Densité B : 1 case de carte = 12 pixels natifs, agrandis en entier. Pièces sur un cadre de 9 × 11, corps du manifestant en 5 × 7, pied en (4, 10). CRS de même hauteur, élargi par le bouclier.
- Palette de 256 couleurs (16 rampes × 16 pas), bitume éclairci pour détacher les CRS, couleurs réservées aux rôles.
- Rôles lisibles à la silhouette : croix rouge dans le dos du medic, bras levé et écran du filmeur, banderole tenue à deux, cône du mégaphone.
- Véhicules (fourgon, lance-eau) : la maquette n'a pas convaincu, à refaire.

## Studio de sprites (v0 en place)

- `studio.html` dans le repo : dessin des pièces par calques (derrière, jambes, corps, tête, devant), couleurs par canaux tirés au hasard, tirages par type (manifestant, medic, CRS bouclier, CRS matraque), rue animée et cortège de cartes.
- Le travail reste dans le navigateur ; on exporte `sprites.js` pour remplacer `data/sprites.js`.
- `src/sprites.js` est le moteur que le jeu reprendra pour son rendu.
- Prochaines étapes : poses supplémentaires (panique, porté, au sol, relevé, charge), pièces des autres rôles, véhicules, puis brancher le rendu du jeu sur le moteur.

## Carte de République (v0.2)

- Le générateur aléatoire est remplacé par une carte faite main : `data/cartes.js`, rastérisée par `src/carte.js`.
- Géographie approximative mais dans l'ordre : place à gauche, Av. de la République en haut à droite (sortie Père-Lachaise), Bd Voltaire au milieu (sortie Nation, parcours déclaré, barré d'office), Bd du Temple puis Beaumarchais en bas à droite (sortie Bastille), Rue du Temple en bas (sortie Hôtel de Ville), Amelot et Richard-Lenoir en sorties fermées au départ.
- Rues de liaison : Malte, Jean-Pierre-Timbaud, Folie-Méricourt, Saint-Maur, Oberkampf, Crussol, Charlot, Béranger, Bretagne. Magenta, Faubourg-du-Temple, Saint-Martin, Oberkampf et Chemin-Vert sont barrées au bout (décor).
- Une rue = polyligne + largeur (1, 2 ou 3 cases), angles à 0°, 45° et 90°. Les cordons savent se poser en travers des rues en diagonale.
- Carte fixe en paysage (plus de rotation en portrait) : le faux trois-quarts ne se tourne pas.
- Rendu provisoire en aplats : façades sur le bord sud des îlots, trottoirs, arbres d'alignement, bouches de métro, barrières Vauban.
- Corrigé : l'écran-titre restait affiché en voile sombre pendant la partie et captait les clics.

## La place (v0.3) : `index.html`

(L'ancien proto en rues est passé dans `proto.html`.)

On met de côté le réseau de rues. Un seul écran vertical, jouable au téléphone : la place de la République, en pixel CRT avec les persos du studio.

- Rendu natif 180 × 312 (15 × 26 cases de 12 px), agrandi en entier. Haut = nord-ouest (René-Boulanger, Saint-Martin, Magenta), bas = sud-est (Bd du Temple, Voltaire, Av. de la République). Côtés : Turbigo et Rue du Temple à gauche, Léon-Jouhaux et Faubourg-du-Temple à droite. Ordre approximatif, à corriger sur place.
- Les rues ne sont que des débouchés de 2 à 5 cases. Chaque débouché est à la fois une sortie et l'entrée des CRS (cordon + fourgon).
- Phase 1, rassemblement (1:30) : la foule arrive par le métro et les rues ouvertes. Les CRS ferment les rues une à une, chargent (télégraphié : points d'exclamation et chevrons rouges), puis reculent. Grenadiers à partir de 0:40.
- Rapport de force : on compte les gens au contact qui poussent vers un cordon. Plus nombreux que ce que le cordon encaisse (≈ 1,1 par CRS), il recule. Repoussé hors de la rue, il se replie et la rue se rouvre ; la police revient plus tard.
- Phase 2, dispersion (1:00) : sommations, métro fermé, sortie « conseillée » par Voltaire. Seul un manifestant sur cinq connaît le chemin, les autres suivent par contagion ou par le mégaphone. Nasse depuis le haut, arrêté préfectoral qui déplace la sortie, nasse depuis le bas, tout ferme 10 s avant la fin.
- Victoire : 45 % de la foule sortie. Ceux qui restent sont nassés.
- Chutes : charges, gaz, et bousculades (panique dans une foule trop serrée). Au sol 9 s sans medic = évacué blessé.
- Outils : mégaphone (illimité), banderole (arrête une charge, encaisse 2 charges), medic (relève, calme la panique autour), filmeur (cône : la police hésite, interpelle moitié moins, preuves perdues si GAV).
- Caisse de grève propre à cette version (sauvegarde `bismillah-place-v1`).
- Simulations automatiques : sans rien faire on perd (20 à 44 sortis sur 59), un joueur qui n'utilise que le mégaphone gagne en répression 1 et perd en répression 3.

À faire ensuite : poses de face et de dos pour les CRS (ils ne savent que regarder à gauche ou à droite), pose de charge, pose au sol, son (Charabia), et vérifier l'ordre des rues autour de la place.
