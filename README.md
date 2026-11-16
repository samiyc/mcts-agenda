# Agenda

Les emplois du temps d'un établissement scolaire : les professeurs, les classes, les salles et les programmes, puis
les remplacements quand un professeur manque, la veille ou le matin même.

Client de [`mcts-commun`](../mcts-commun/README.md). La recherche est choisie par la mesure, contre un remplissage glouton.

**État** (16/11/2026) : le cadrage est écrit, et le jalon J1 est là : le collège tiré par graine (`src/school/`), l'évaluateur
(`src/evaluate.js`, les contraintes dures et souples de `src/rules/`), les deux règles simples R0-naïf et R0
(`src/build/greedy.js`). La première mesure, [`docs/mesures-j1.md`](docs/mesures-j1.md) : R0
place presque tout (un cours laissé sur 2 à 5 collèges sur 30), R0-naïf en laisse 12 à 22. J2 a ajouté les barrettes
(la LV2 et le soutien de 6e par paires de divisions) et les demi-groupes de sciences, alternés sur les semaines A et B
(`src/school/courses.js`) ; R0 y laisse un cours sur 1 à 3 collèges sur 30 ([`docs/mesures-j2.md`](docs/mesures-j2.md)).
J3 a ajouté la recherche locale (`src/search/`) : le recuit et le tabou partent de R0, déplacent ou échangent des
barrettes sans casser de contrainte dure. En 20 s, le recuit divise le coût de R0 par 7 à 12 et bat le tabou
([`docs/mesures-j3.md`](docs/mesures-j3.md)). J4 lit le format public XHSTT (`src/xhstt/`) : notre évaluateur
redonne le coût publié par HSEval de 150 solutions sur 152 ([`docs/mesures-j4.md`](docs/mesures-j4.md)). J5 joue des
semaines d'absences (`src/absence/`) : P1 remplace ce que remplacent les collèges (10 à 12 % des heures), la
recherche, qui rattrape les heures un autre jour, en sauve 21 à 45 % de plus que P1, au prix d'environ une séance déplacée par heure sauvée
([`docs/mesures-j5.md`](docs/mesures-j5.md)). J6 cache la durée d'une maladie sur deux : ne pas la
connaître ne coûte que 0,03 à 0,05 h par semaine à cette recherche ([`docs/mesures-j6.md`](docs/mesures-j6.md)).
J7 lance un solveur sur les 25 instances publiques d'XHSTT-2014, au budget d'ITC 2011 (1 000 s) : son recuit bat la
règle simple sur chaque course et retrouve la faisabilité connue sur 13 instances, mais reste derrière les solveurs
publiés sur 21 comparaisons sur 25 ([`docs/mesures-j7.md`](docs/mesures-j7.md)).
J8 ouvre un bac à sable : sur la page, on règle les poids des contraintes, les disponibilités des professeurs, on
verrouille la semaine d'une classe ou on déplace un cours à la main, et on choisit les absences de la semaine des
remplacements ([`docs/modele.md`](docs/modele.md) § 14).
J9 recale le modèle sur la recherche du 16/11 : un professeur d'EPS fait 6 h par jour au plus (D10), et les
absences passent à 9 % des heures ; les remplacements sont rejoués ([`docs/mesures-j9.md`](docs/mesures-j9.md)).
La page (`npm run page`) montre la semaine d'une division, d'un professeur ou d'une salle, après la règle et la
recherche ; `remplacement.html` rejoue une semaine d'absences, avant et après, moment par moment.

- [`docs/modele.md`](docs/modele.md) : un collège fictif tiré par graine, ses contraintes dures et souples, les
  absences et le replanning, les règles à battre (le glouton R0, le remplacement P1), les mesures par paires, les bancs
  publics (XHSTT-2014 d'ITC 2011 ; ITC 2019 si le lycée vient), ce qu'on prend de la lib, les jalons J1 à J8 ;
- [`docs/recherche/`](docs/recherche/README.md) : les sources et leur niveau de lecture, le glossaire, le prompt de
  recherche métier, les questions pour Sami et pour un principal adjoint ou un CPE.

## Tester soi-même

1. `npm run page`, puis http://127.0.0.1:4805/web/ : choisir un collège et une graine, « Construire ».
2. **Réglages** (sous le résumé) : changer un poids, rendre un professeur indisponible ou « préfère pas » une
   demi-journée, puis « Construire » à nouveau pour voir l'effet ; les coûts disent ce qui a bougé.
3. **Verrous** : « Voir : une division », puis « Verrouiller la semaine » ; une nouvelle construction, même avec le
   recuit, la laisse telle quelle. Un clic sur un cours propose de le déplacer, et l'y verrouille.
4. **Les remplacements** (lien en haut de la page) : « Absences : choisies à la main », ajouter une absence, « Jouer
   la semaine » ; l'emploi du temps en place garde les verrous et les disponibilités.
5. **Fichier** : exporter les réglages pour les garder ou les envoyer, les importer ailleurs ; ils restent aussi
   dans le navigateur, par collège et graine.

## Les commandes

| Commande | Ce qu'elle fait |
|---|---|
| `npm install` | installe les outils, relie `mcts-commun` et active le hook de commit |
| `npm run check` | le lint, les types, puis les tests ; c'est ce que lance le hook |
| `npm run lint` (`lint:fix`) | eslint, avec le budget de complexité de lopin |
| `npm run types` | tsc vérifie le JavaScript d'après ses commentaires JSDoc, sans rien compiler |
| `npm test` (`test:coverage`) | les tests de `node --test`, dont la longueur des `.md` et les empreintes |
| `npm run compare -- --sizes S,M,L --n 30 --from 1001` | R0 contre R0-naïf par paires sur les mêmes collèges, et le témoin A/A ; `--json F` garde les lignes |
| `npm run bench -- --sizes M --n 2` | le banc des recherches : le temps, les essais par milliseconde, les passages du ramasse-miettes, le coût contre R0 |
| `node scripts/search-compare.js --sizes M --n 30 --from 1001 --seconds 20` | le recuit et le tabou contre R0 et R0 répété, par paires à temps égal, et le témoin A/A ; par la file |
| `npm run xhstt` | notre évaluateur XHSTT contre les rapports d'HSEval et les valeurs publiées ; les archives dans `data/xhstt/` (voir `docs/mesures-j4.md`) |
| `npm run xhstt:bench -- --only KS-PR-11 --seeds 1,2 --tries 3000000 --configs "hard=50;hard=10"` | le banc XHSTT-2014 : la règle simple puis le recuit, chaque course vérifiée par l'évaluateur ; `--json F`, puis `node scripts/xhstt-report.js --prefix F` pour les rangs d'ITC 2011 (voir `docs/mesures-j7.md`) |
| `npm run replan -- --sizes M --n 30 --weeks 30` | le replanning des absences : P0, P1 et la recherche, par paires ; `--place anneal`, `--hours H` pour les variantes |
| `npm run tune -- --search anneal --variants "hot=3;swap=0.7"` | les réglages d'une recherche contre ses défauts, sur les graines 2001 et suivantes |
| `npm run page` | la page sur http://127.0.0.1:4805/web/ : l'emploi du temps d'une division, d'un professeur ou d'une salle, les coûts, les réglages du bac à sable ; `remplacement.html` les remplacements |
| `npm run changelog` | réécrit `web/changelog.html` depuis `docs/changelog.json` |
| `node scripts/refresh-fingerprints.js` | réécrit les empreintes, pour un changement voulu du modèle (le commit le dit, mesures avant et après) |

Les règles du dépôt sont dans [`CLAUDE.md`](CLAUDE.md).
