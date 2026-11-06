# Agenda

Les emplois du temps d'un établissement scolaire : les professeurs, les classes, les salles et les programmes, puis
les remplacements quand un professeur manque, la veille ou le matin même.

Client de [`mcts-commun`](../mcts-commun/README.md). La recherche sera choisie par la mesure, contre un remplissage glouton.

**État** (6/11/2026) : le cadrage est écrit, sans code de modèle ni de recherche.
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
| `npm test` (`test:coverage`) | les tests de `node --test`, dont la longueur des `.md` |

Les règles du dépôt sont dans [`CLAUDE.md`](CLAUDE.md).
