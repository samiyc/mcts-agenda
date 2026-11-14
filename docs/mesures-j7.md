# Les mesures de J7 : le banc XHSTT-2014 (14/11/2026)

Le solveur des instances publiques d'XHSTT-2014 ([`modele.md`](modele.md) § 13) sur ses 25 instances : la règle
simple (`src/xhstt/greedy.js`), puis le recuit (`src/xhstt/anneal.js`) qui part d'elle. Chaque course est vérifiée à
la fin par l'évaluateur de J4, qui redonne les coûts d'HSEval sur 150 des 160 solutions publiées : le banc s'arrête si
le coût tenu à jour par la recherche s'en écarte. Il ne s'en est écarté sur aucune des courses ci-dessous.

Un coût s'écrit **infaisabilité / objectif** : les violations des contraintes requises, puis le coût des autres. Deux
coûts se comparent infaisabilité d'abord. Le **meilleur connu** est le plus bas entre la page de l'instance sur le site
de Twente et les solutions de son fichier, évaluées par le nôtre.

## 1. L'écrémage des réglages

**La commande** (25 jobs `agenda-j7-screen-*`, commit dbb4a4e, graines 1 et 2, 3 millions d'essais, de 7 s à 170 s
la course selon l'instance) :

```text
node scripts/xhstt-bench.js --only ID --seeds 1,2 --tries 3000000 --configs "hard=50;hard=1;hard=3;hard=10;hard=3,kempe=0;hard=3,reshape=0" --json tmp/xhstt-screen-ID.json
node scripts/xhstt-report.js --prefix tmp/xhstt-screen- --ref hard=50
```

Six réglages : le poids d'une violation requise (`hard`, en multiples de l'échelle de l'objectif) à 50 (le défaut),
1, 3 et 10 ; puis à 3 sans chaînes de Kempe, et à 3 sans coupes ni recollages. Le **rang** est celui d'ITC 2011 : sur
chaque instance et chaque graine, les réglages classés infaisabilité d'abord, les ex aequo partageant leur rang ; puis
la moyenne.

| réglage | rang moyen | courses sans infaisabilité | instances sans infaisabilité | contre hard=50 (rang, par paires sur les instances) | mieux / égal / moins bien |
|---|---|---|---|---|---|
| hard=50 | 3,29 | 21/50 | 10/25 | | |
| hard=1 | 4,06 | 18/50 | 8/25 | +0,77 (−0,38 à +1,92) | 7 / 1 / 17 |
| hard=3 | 2,96 | 22/50 | 11/25 | −0,33 (−1,14 à +0,48) | 14 / 1 / 10 |
| hard=10 | 3,00 | 24/50 | 11/25 | −0,29 (−0,80 à +0,22) | 14 / 2 / 9 |
| hard=3, sans Kempe | 4,05 | 18/50 | 7/25 | +0,76 (−0,09 à +1,61) | 9 / 1 / 15 |
| hard=3, sans coupes | 3,64 | 18/50 | 9/25 | +0,35 (−0,38 à +1,08) | 9 / 1 / 15 |

**Ce que l'écrémage écarte** : `hard=1` (moins bon sur 17 instances sur 25), et retirer les chaînes de Kempe ou les
coupes (moins bon sur 15). Les chaînes et les coupes restent donc. Il ne promeut rien : hard=3 et hard=10 font un peu
mieux que le défaut, mais leurs intervalles passent par zéro. Les deux poids extrêmes divergent selon l'instance :
hard=1 fait tomber KS-PR-11 de 274 à 133 violations et GR-PA-08 de 35 à 0, mais remonte AU-SA-96, ES-SS-08 et
NL-KP-05.

**Où l'on est à ce budget** (la règle, puis le recuit hard=10, moyennes sur deux graines ; le meilleur connu) :

| instance | meilleur connu | règle | recuit | instance | meilleur connu | règle | recuit |
|---|---|---|---|---|---|---|---|
| AU-BG-98 | 0/128 | 366/1355 | 118/1132 | GR-H1-97 | 0/0 | 7/0 | 0/0 |
| AU-SA-96 | 0/0 | 113/125 | 31/97 | GR-P3-10 | 0/0 | 10/708 | 0/135 |
| AU-TE-99 | 0/20 | 43/233 | 2/147 | GR-PA-08 | 0/3 | 41/80 | 35/14 |
| BR-SA-00 | 0/5 | 10/114 | 0/82 | IT-I4-96 | 0/27 | 11/3424 | 0/360 |
| BR-SM-00 | 0/51 | 38/131 | 3/157 | KS-PR-11 | 0/0 | 325/2194 | 274/949 |
| BR-SN-00 | 0/35 | 19/341 | 0/233 | NL-KP-03 | 0/199 | 22/16803 | 1/9032 |
| DK-FG-12 | 0/1263 | 32/8125 | 0/3218 | NL-KP-05 | 0/425 | 74/9648 | 26/10378 |
| DK-HG-12 | 12/2330 | 35/14246 | 12/8043 | NL-KP-09 | 0/1620 | 77/150660 | 14/36285 |
| DK-VG-09 | 2/2323 | 25/10246 | 2/4835 | UK-SP-06 | 2/1410 | 98/1625 | 50/1767 |
| ES-SS-08 | 0/335 | 17/7683 | 0/995 | US-WS-09 | 0/101 | 9/912 | 0/2366 |
| FI-MP-06 | 0/77 | 21/343 | 0/108 | ZA-LW-09 | 0/0 | 15/247 | 0/103 |
| FI-PB-98 | 0/0 | 63/472 | 2/59 | ZA-WD-09 | 0/0 | 157/201 | 12/146 |
| FI-WP-06 | 0/0 | 20/192 | 0/35 | | | | |

Le recuit bat la règle partout. Il atteint l'infaisabilité du meilleur connu sur 13 instances (sur DK-HG-12 et DK-VG-09,
le meilleur connu en a lui-même), mais reste loin de son objectif : de 1,4 fois (FI-MP-06) à 23 fois (US-WS-09) quand
il n'est pas nul, et seul GR-H1-97 le rejoint tout à fait (0/0). Trois instances résistent : KS-PR-11
(274 violations), AU-BG-98 (118) et UK-SP-06 (50), là où le meilleur connu en a 0, 0 et 2.

## 2. La mesure au budget d'ITC 2011

**La commande** (250 jobs `agenda-j7-final-ID-sGRAINE`, graines neuves 101 à 110, réglages hard=50 et hard=10) :

```text
node scripts/xhstt-bench.js --only ID --seeds GRAINE --tries ESSAIS --configs "hard=50;hard=10" --json tmp/xhstt-final-ID-sGRAINE.json
node scripts/xhstt-report.js --prefix tmp/xhstt-final- --ref hard=50
```

**Le budget** : 1 000 s par course, comme à ITC 2011, traduites en un nombre d'essais fixé par instance, d'après sa
vitesse à l'écrémage (machine pleine, 18 fils). Le résultat ne dépend donc pas de la charge de la machine pendant la
mesure, et se rejoue de sa graine. Ces essais vont de 15 millions (DK-HG-12, DK-VG-09, UK-SP-06) à 414 millions
(ZA-LW-09) ; la liste est dans `tmp/j7-final-budget.json`. La machine d'ITC 2011 n'est pas la nôtre : à budget de temps
égal, la comparaison aux résultats publiés n'est qu'indicative.

**Une copie figée** : les jobs tournent dans une copie du dépôt au commit 45f2391 (`git worktree`, hors du dossier des
projets), pour que le travail sur les instances dures puisse continuer dans `src/` pendant la mesure.

Les résultats viendront ici.
