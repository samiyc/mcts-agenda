# Agenda

Les emplois du temps d'un établissement scolaire : les professeurs, les classes, les salles et les programmes, puis
les remplacements quand un professeur manque, la veille ou le matin même.

Client de [`mcts-commun`](../mcts-commun/README.md). La recherche sera choisie par la mesure, contre un remplissage glouton.

**État** : le dépôt existe, sans modèle. Le cadrage vient d'abord (`docs/modele.md`, `docs/recherche/`).

## Les commandes

| Commande | Ce qu'elle fait |
|---|---|
| `npm install` | installe les outils, relie `mcts-commun` et active le hook de commit |
| `npm run check` | le lint, les types, puis les tests ; c'est ce que lance le hook |
| `npm run lint` (`lint:fix`) | eslint, avec le budget de complexité de lopin |
| `npm run types` | tsc vérifie le JavaScript d'après ses commentaires JSDoc, sans rien compiler |
| `npm test` (`test:coverage`) | les tests de `node --test`, dont la longueur des `.md` |

Les règles du dépôt sont dans [`CLAUDE.md`](CLAUDE.md).
