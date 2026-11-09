# Agenda

Les emplois du temps d'un établissement scolaire : les professeurs, les classes, les salles et les programmes, puis
les remplacements quand un professeur manque, la veille ou le matin même.

Client de [`mcts-commun`](../mcts-commun/README.md). La recherche est choisie par la mesure, contre un remplissage glouton.

**État** (9/11/2026) : le cadrage est écrit, et le jalon J1 est là : le collège tiré par graine (`src/school/`), l'évaluateur
(`src/evaluate.js`, les contraintes dures et souples de `src/rules/`), les deux règles simples R0-naïf et R0
(`src/build/greedy.js`). La première mesure, [`docs/mesures-j1.md`](docs/mesures-j1.md) : R0
place presque tout (un cours laissé sur 2 à 5 collèges sur 30), R0-naïf en laisse 12 à 22. J2 a ajouté les barrettes
(la LV2 et le soutien de 6e par paires de divisions) et les demi-groupes de sciences, alternés sur les semaines A et B
(`src/school/courses.js`) ; R0 y laisse un cours sur 1 à 3 collèges sur 30 ([`docs/mesures-j2.md`](docs/mesures-j2.md)).
J3 a ajouté la recherche locale (`src/search/`) : le recuit et le tabou partent de R0, déplacent ou échangent des
barrettes sans casser de contrainte dure. En 20 s, le recuit divise le coût de R0 par 7 à 12 et bat le tabou
([`docs/mesures-j3.md`](docs/mesures-j3.md)). La page (`npm run page`) montre la semaine d'une division, d'un
professeur ou d'une salle, après la règle et la recherche.

- [`docs/modele.md`](docs/modele.md) : un collège fictif tiré par graine, ses contraintes dures et souples, les
  absences et le replanning, les règles à battre (le glouton R0, le remplacement P1), les mesures par paires, les bancs
  publics (XHSTT-2014 d'ITC 2011, puis ITC 2019), ce qu'on prend de la lib, les jalons J1 à J6 ;
- [`docs/recherche/`](docs/recherche/README.md) : les sources et leur niveau de lecture, le glossaire, le prompt de
  recherche métier, les questions pour Sami et pour un principal adjoint ou un CPE.

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
| `npm run page` | la page sur http://127.0.0.1:4805/web/ : l'emploi du temps d'une division, d'un professeur ou d'une salle, les coûts |
| `npm run changelog` | réécrit `web/changelog.html` depuis `docs/changelog.json` |
| `node scripts/refresh-fingerprints.js` | réécrit les empreintes, pour un changement voulu du modèle (le commit le dit, mesures avant et après) |

Les règles du dépôt sont dans [`CLAUDE.md`](CLAUDE.md).
