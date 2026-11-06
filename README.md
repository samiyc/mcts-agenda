# Agenda

Les emplois du temps d'un établissement scolaire : les professeurs, les classes, les salles et les programmes, puis
les remplacements quand un professeur manque, la veille ou le matin même.

Client de [`mcts-commun`](../mcts-commun/README.md). La recherche sera choisie par la mesure, contre un remplissage glouton.

**État** (6/11/2026) : le cadrage est écrit, et le jalon J1 est là : le collège tiré par graine (`src/school/`), l'évaluateur
(`src/evaluate.js`, les contraintes dures et souples de `src/rules/`), les deux règles simples R0-naïf et R0
(`src/build/greedy.js`). Pas encore de recherche. La première mesure, [`docs/mesures-j1.md`](docs/mesures-j1.md) : R0
place presque tout (un cours laissé sur 2 à 5 collèges sur 30), R0-naïf en laisse 12 à 22.
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
| `node scripts/refresh-fingerprints.js` | réécrit les empreintes, pour un changement voulu du modèle (le commit le dit, mesures avant et après) |

Les règles du dépôt sont dans [`CLAUDE.md`](CLAUDE.md).
