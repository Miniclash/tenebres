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

## Contraintes techniques pour les visuels

- Vue de dessus. Une case de carte = 16 unités monde, mise à l'échelle selon l'écran (environ 14 px sur mobile, 23 px sur desktop).
- Manifestant : environ 7 unités de diamètre. CRS : environ 13 × 15, occupe une case. Fourgon : 18 × 30.
- Des centaines de manifestants à l'écran en même temps : les sprites doivent rester lisibles très petits.
- Le jeu est en pancartes de carton (interface) sur bitume sombre (carte). Polices actuelles : Permanent Marker et Barlow Condensed.
