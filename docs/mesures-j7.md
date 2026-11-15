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

**Les résultats** (15/11 ; 500 courses, moyennes sur les 10 graines ; six jobs tués par erreur pendant l'écrémage de
§ 3 et relancés tels quels, code 143) :

| Instance | Meilleur connu | Règle | Recuit hard=50 | Recuit hard=10 |
|---|---|---|---|---|
| AU-BG-98 | 0/128 | 364,8/1254 | 102,6/734 | 95,5/681 |
| AU-SA-96 | 0/0 | 112,4/134 | 17,5/34 | 16,7/31 |
| AU-TE-99 | 0/20 | 39,9/199 | 1,8/78 | 1,7/77 |
| BR-SA-00 | 0/5 | 8,1/147 | 1/44 | **0**/79 |
| BR-SM-00 | 0/51 | 45,5/108 | 4,2/129 | **0**/140 |
| BR-SN-00 | 0/35 | 22,9/321 | 3,8/193 | **0**/215 |
| DK-FG-12 | 0/1263 | 32,2/7943 | 0/2706 | 0/2718 |
| DK-HG-12 | 12/2330 | 37,8/14245 | 12/6032 | 12/6071 |
| DK-VG-09 | 2/2323 | 27,7/10335 | 2/3786 | 2/3753 |
| ES-SS-08 | 0/335 | 22,9/7366 | 0/671 | 0/664 |
| FI-MP-06 | 0/77 | 21,7/286 | 0/95 | 0/96 |
| FI-PB-98 | 0/0 | 67,4/512 | 0/18 | 0/16 |
| FI-WP-06 | 0/0 | 22,3/224 | 0/10 | 0/11 |
| GR-H1-97 | 0/0 | 7,2/0 | 0/0 | 0/0 |
| GR-P3-10 | 0/0 | 8,7/688 | 0/106 | 0/109 |
| GR-PA-08 | 0/3 | 39,8/74 | 35/11 | 35/12 |
| IT-I4-96 | 0/27 | 11,2/2957 | 0/331 | 0/328 |
| KS-PR-11 | 0/0 | 323,2/2297 | 274/819 | 274/822 |
| NL-KP-03 | 0/199 | 19,3/21341 | 0/5837 | 0/5936 |
| NL-KP-05 | 0/425 | 76/8270 | 17,6/5528 | 19,1/5755 |
| NL-KP-09 | 0/1620 | 74,1/110817 | 9,1/17753 | 9,1/16633 |
| UK-SP-06 | 2/1410 | 92,9/1843 | 47,9/1337 | 48,7/1307 |
| US-WS-09 | 0/101 | 7,6/970 | 0/743 | 0/744 |
| ZA-LW-09 | 0/0 | 14,9/226 | 0/20 | 0/20 |
| ZA-WD-09 | 0/0 | 155,5/233 | 2,9/65 | 3,6/60 |

**Contre la règle simple** : le recuit (hard=50) fait mieux qu'elle sur chacune des 250 courses, donc sur les
25 instances ; hard=10 sur 249 (l'exception plus bas).

**hard=10 contre hard=50** : rang moyen 1,44 contre 1,56, soit −0,11 (−0,28 à +0,06) par paires sur les instances,
mieux sur 12, égal sur 1, moins bien sur 12. L'intervalle contient zéro : **hard=10 n'est pas promu**, la référence
reste hard=50. Il rend pourtant faisables les trois instances brésiliennes à chaque graine (141 courses sans
infaisabilité sur 250, contre 110 ; 14 instances contre 11), au prix de l'objectif ailleurs.

**Contre le meilleur connu** : la même infaisabilité moyenne sur 13 instances (16 avec hard=10), dont 12 sans
infaisabilité et DK-HG-12, DK-VG-09 au plancher connu (12 et 2). L'objectif n'y égale le meilleur connu que sur GR-H1-97 ;
ailleurs il vaut 1,2 fois (FI-MP-06) à 29 fois (NL-KP-03) le meilleur connu. Restent infaisables à chaque graine :
AU-BG-98, AU-SA-96, AU-TE-99 (hard=50), GR-PA-08, KS-PR-11 (274 à chaque graine, le piège de § 3), NL-KP-05, NL-KP-09,
UK-SP-06, ZA-WD-09.

**Contre les moyennes publiées à 1 000 s** (la table 15 de Ceschia, Di Gaspero et Schaerf, arXiv 2201.07525, lue
colonne par colonne par `pdftotext -table` ; `docs/recherche/sources.md`) : trois solveurs y donnent une moyenne à
1 000 s, sur une partie des instances seulement, 25 comparaisons en tout :

| Solveur | Instances | Recuit hard=50 mieux | à peu près égal | moins bien |
|---|---|---|---|---|
| Demirović et Musliu 2017 (LNS par MaxSAT) | BR-SA, BR-SM, BR-SN, FI-PB, FI-WP, FI-MP, GR-PA, IT-I4 | FI-PB (0/18 contre 54,6) | FI-WP (9,6 contre 9,8), FI-MP (95,3 contre 95,2) | 5 |
| Demirović et Stuckey 2018 | BR-SA, BR-SM, BR-SN, FI-PB, FI-WP, FI-MP, GR-PA, ZA-LW | — | — | 8 |
| Teixeira et al. 2018 | AU-BG, AU-SA, AU-TE, BR-SM, BR-SN, FI-WP, FI-MP, NL-KP-03, NL-KP-05 | AU-TE (1,8/78 contre 7/13) | — | 8 |

Les écarts sont nets là où nous perdons : les instances brésiliennes et GR-PA-08 sont faisables chez eux (GR-PA à 5 et
7 d'objectif, nous à 35 d'infaisabilité), IT-I4-96 à 35 contre 331, NL-KP-03 à 1 383 contre 5 837, AU-BG-98 à 3/514
contre 103/734. Les machines diffèrent et le nombre de courses publiées n'est pas dit : la comparaison est
indicative. **Où nous en sommes** : un recuit générique bat largement la règle simple et tient la faisabilité connue
sur la moitié des instances, mais reste derrière les solveurs publiés sur 21 comparaisons sur 25, par l'objectif
quand il est faisable, par la faisabilité sur les instances dures.

**Un défaut trouvé** : la course NL-KP-05 graine 103 finit au plan de la règle (68/10640 avec hard=10, 56/1157 avec
hard=50, pire que la règle d'abord par l'infaisabilité). L'échelle du recuit est la hausse moyenne de l'objectif sur
400 mouvements tirés qui gardent l'infaisabilité ; partie de 68 violations, aucun des 400 ne la gardait, et l'échelle
retombait à 1 : une violation ne pesait plus que 10 à 50 points d'objectif, contre plusieurs centaines aux autres
graines, et le recuit échangeait l'une contre l'autre. Seule cette course en souffre (BR-SM-00 graine 106 et GR-H1-97
retombent aussi à 1, mais leur échelle vraie est de 1 à 8). Sans elle, NL-KP-05 vaut 13,3/6014 (hard=50) et 13,7/5212
(hard=10) au lieu de 17,6 et 19,1 ; les conclusions ne changent pas. Corrigé après la mesure (`scaleOf` prend alors la
hausse moyenne sur tous les mouvements tirés : 204 sur cette graine). L'estimation reste bruitée sur NL-KP-05 (de 10 à
1 300 selon la graine) : une piste.

## 3. Au peigne fin : KS-PR-11, AU-BG-98, UK-SP-06

Les trois instances où le recuit reste le plus loin du meilleur connu (§ 1), regardées de près pendant la mesure du
§ 2 (des essais courts, par les créneaux de la machine ; ce sont des écrémages).

**KS-PR-11 (Kosovo) : une marche que le recuit ne franchissait pas.** Les classes y sont pleines : 30 ou 31 heures
pour 31 places, sans trou permis. Une contrainte requise veut qu'une classe occupée à l'une des premières heures de
ses demi-journées le soit à cinq au moins. Placer une seule séance à une première heure coûte donc plus qu'elle ne
rapporte, et le recuit laissait toutes les premières heures vides : 26 places pour 31 heures, d'où des conflits et
des séances non placées. Il finissait à **274 violations quelles que soient la graine et la durée** (3 et 20 millions
d'essais). Deux options y répondent (`modele.md` § 13) :

- `slide` décale toute la semaine d'une ressource d'une heure : la classe prend ses cinq premières heures d'un coup ;
- `feasible` passe une première part du budget sur l'infaisabilité seule.

| KS-PR-11, AU-BG-98 : 3 millions d'essais ; UK-SP-06 : 1 million ; graines 1 et 2 | KS-PR-11 | AU-BG-98 | UK-SP-06 |
|---|---|---|---|
| meilleur connu | 0/0 | 0/128 | 2/1410 |
| défaut (hard=50) | 274/850 | 144/995 | 59,5/1799 |
| feasible=0.8, slide=0.1 | **4/1174** | **48,5/2095** | 75/2130 |
| feasible=0.8, slide=0.1, free=0.5, alike=0.5 | **2/1147** (une course à 0) | **45/1823** | 77/2251 |

KS-PR-11 passe de 274 à 2 à 4 violations, et une course n'en a aucune. AU-BG-98 tombe de 144 à 45. UK-SP-06 fait
moins bien avec la première phase : ses classes aussi sont pleines (25 heures pour 25 places), mais ses conflits sont
surtout des professeurs, entre des cours liés de 2 à 9 classes. Sans `slide`, `feasible` seul fait déjà tomber
KS-PR-11 vers 130 ; l'échange de plages (`block`) n'y a rien changé.

**Sur les 25 instances** (50 jobs `agenda-j7-comb-*`, copie figée de 7486fec, graines 1 et 2, 3 millions d'essais,
contre hard=10) :

| réglage (avec hard=10) | rang moyen | courses sans infaisabilité | instances sans infaisabilité | contre hard=10 (rang) | mieux / égal / moins bien |
|---|---|---|---|---|---|
| — | 2,25 | 22/50 | 10/25 | | |
| slide=0.1 | 2,14 | 23/50 | 10/25 | −0,11 (−0,50 à +0,28) | 10 / 2 / 13 |
| feasible=0.5, slide=0.1 | 2,49 | **28/50** | **13/25** | +0,24 (−0,40 à +0,88) | 9 / 1 / 15 |
| feasible=0.8, slide=0.1, free=0.5 | 3,12 | 24/50 | 10/25 | +0,87 (+0,22 à +1,52) | 8 / 1 / 16 |

Le décalage seul ne change presque rien ailleurs qu'à KS-PR-11 (274 → 255 : il lui faut aussi la première phase).
La première phase à moitié du budget rend trois instances faisables de plus (BR-SM-00, GR-PA-08 de 35 à 0, BR-SN-00) et
fait tomber KS-PR-11 à 4,5 et AU-BG-98 à 55. Mais elle perd au rang : là où les deux réglages sont faisables, la
moitié du budget ôtée à l'objectif se paie (US-WS-09 : 2 366 → 3 579), et NL-KP-05 remonte de 29,5 à 56,5. La
variante à 80 % avec `free` est **écartée** (son intervalle exclut zéro).

D'où une retouche : **la première phase s'arrête dès qu'un plan n'a plus d'infaisabilité** (11b55b9), et rend le
reste du budget à l'objectif. Elle n'est alors longue que là où il le faut.

**La retouche ne suffit pas** (50 jobs `agenda-j7-comb2-*`, mêmes graines, rangs recalculés sur les six réglages) :
feasible=0.5 avec arrêt précoce donne les mêmes 13 instances faisables, et ne regagne qu'un peu d'objectif (rang
contre hard=10 : +0,11, de −0,74 à +0,96 ; 10 mieux, 14 moins bien). US-WS-09 reste à 3 468 contre 2 366 : la
première phase, chaude sur l'objectif (une violation y vaut 100 points d'objectif), rend un plan faisable mais
désordonné, que le recuit ne remet pas en ordre. À 80 %, elle est **écartée** (+1,47, de +0,37 à +2,57).

**Où l'on en est** : le décalage et la première phase règlent KS-PR-11 (de 274 à 4 violations), AU-BG-98 (de 144
à 55) et GR-PA-08 (de 35 à 0), mais coûtent de l'objectif ailleurs ; aucun réglage n'est promu, et la mesure du § 2
garde le recuit tel quel. Les pistes : une première phase plus froide sur l'objectif, ou lancée seulement quand le
recuit ordinaire reste infaisable ; et pour UK-SP-06, des mouvements pour ses cours liés.
