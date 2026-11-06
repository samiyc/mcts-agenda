# Les mesures de J1 : R0 contre R0-naïf (6/11/2026)

La première mesure du modèle de [`modele.md`](modele.md) : les deux règles simples sur les mêmes collèges, par paires,
et le témoin A/A (R0 contre lui-même, avec une autre graine pour départager ses égalités).

**La commande** (job `agenda-j1-r0-20261106-115735` de la file, 1 fil, environ 3 min, code de 2059c19) :

```text
node scripts/compare.js --sizes S,M,L --n 30 --from 1001 --json tmp/compare-j1.json
```

Les graines 1001 à 1030, à l'écart de celles des tests (1 à 7). Un écart est A − B : sous zéro, A coûte moins.
L'infaisabilité compte les cases non placées (un créneau sur une semaine, D1 à D8) ; le coût, les contraintes souples
pondérées (§ 3.2 du modèle).

## Les chiffres

| Taille | R0-naïf : cases non placées (cours) | R0 : cases non placées (cours) | R0 − R0-naïf, infaisabilité | R0 : coût moyen (min, médiane, max) | R0 : temps |
|---|---|---|---|---|---|
| S | 36,8 (12,2) | 0,1 (0,1) | −36,7 (−38,5 à −34,8) | 401 (296, 417, 463) | 0,7 s |
| M | 40,4 (12,1) | 0,1 (0,1) | −40,3 (−41,6 à −39,0) | 487 (327, 500, 621) | 1,3 s |
| L | 68,4 (21,6) | 0,3 (0,2) | −68,1 (−69,7 à −66,5) | 679 (523, 679, 798) | 3,1 s |

**Le témoin A/A** : R0 contre R0 avec une autre graine d'égalités.

| Taille | Infaisabilité | Coût |
|---|---|---|
| S | −0,0 (−0,2 à 0,2) | +15,4 (−5,5 à 36,3) |
| M | −0,2 (−0,4 à 0,0) | −2,8 (−30,9 à 25,2) |
| L | 0,0 (−0,3 à 0,3) | −8,8 (−38,3 à 20,8) |

**Le coût de R0 par contrainte**, en moyenne par collège, avant les poids :

| Taille | S1 trous des divisions | S2 trous des professeurs | S3 vœux | S4 deux fois le même jour | S5 journée longue | S6 lourd après 15 h | S7 hors de sa salle | S8 EPS rapprochée |
|---|---|---|---|---|---|---|---|---|
| S | 3,0 | 47,9 | 2,3 | 43,8 | 0 | 40,9 | 0 | 0,1 |
| M | 3,0 | 59,9 | 3,5 | 51,7 | 0 | 53,0 | 0 | 0 |
| L | 4,1 | 74,0 | 5,4 | 76,8 | 0 | 81,8 | 0 | 0 |

## Ce qu'on en tire

1. **R0 bat R0-naïf de très loin**, sur les trois tailles : l'intervalle de l'écart reste loin sous zéro. Placer d'abord
   le cours le plus contraint suffit à presque tout placer ; dans l'ordre du fichier, les blocs d'EPS et les cours des
   professeurs absents un jour arrivent trop tard.
2. **R0 n'est pas toujours faisable** : il laisse un cours sur 2 collèges S sur 30, 2 M et 5 L (le témoin : 3, 5 et 4).
   C'est la première cible de la recherche de J3 : zéro case non placée partout.
3. **L'arène tient** : le témoin A/A donne des écarts dont l'intervalle contient zéro. Il dit aussi le bruit des seules
   égalités de R0 sur le coût : environ ±30 points sur un collège M, soit 6 % de son coût. Un gain de recherche plus
   petit ne se verrait qu'avec beaucoup de collèges ; c'est la taille du `h1` de Q-S3 (−5 %).
4. **Ce que coûte R0** : les trous des professeurs (S2, poids 3), les disciplines deux fois le même jour (S4, poids 4)
   et les matières lourdes après 15 h (S6, poids 1) font presque tout le coût. Les trous des élèves (S1), la journée
   longue (S5), la salle (S7) et l'EPS rapprochée (S8) sont presque nuls : R0 les évite déjà. Une part de S4 est
   inévitable (4,5 h de français sur quatre jours et demi en semaine A).
5. **Le temps** : 0,7 à 3,1 s pour R0, qui recalcule les options de tous les cours à chaque pas. Assez pour J1 ; la
   recherche de J3 partira de son emploi du temps, et son banc mesurera ce qui doit aller plus vite.
