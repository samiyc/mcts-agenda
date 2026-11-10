# Les mesures de J5 : le replanning des absences, P0, P1 et la recherche (9-10/11/2026)

J5 joue des semaines d'absences sur l'emploi du temps en place ([`modele.md`](modele.md) § 4 et § 5.2) : chaque jour,
la veille puis le matin, les absences connues à ce moment-là sont révélées et la règle décide. On compare P0 (rien,
des études), P1 (un volontaire de la discipline, sinon de l'équipe, le jour de l'absence) et la recherche (P1, puis un
recuit qui rattrape une heure perdue un autre jour de la semaine, déplace une séance pour lui faire de la place, ou
remet une séance à sa place).

**La commande** (les graines 1001 à 1030, celles des jalons précédents ; 30 semaines par collège) :

```text
node scripts/replan-compare.js --sizes S --n 30 --from 1001 --weeks 30 --tries 20000,200000,2000000 --json tmp/replan-j5-S.json
```

Un job de la file par taille (`agenda-j5-replan-S`, `-M`, `-L`). L'emploi du temps en place est celui de R0, comme le
veut le cadrage (§ 6.1). **Un échantillon est un collège** : la moyenne de ses 30 semaines, car elles partagent un
emploi du temps. Les budgets de la recherche se comptent en mouvements essayés à chaque moment (la veille, le matin),
dix moments par semaine : 20 000 (environ 4 ms par moment), 200 000 (40 ms) et 2 millions (0,4 s). Le cadrage
accorde 60 s la veille et 10 s le matin (Q-S6) : on reste très en dessous.

**Ce que comptent les chiffres**, par semaine : les **heures perdues**, les heures de cours d'une division que personne
n'a données (une demi-division compte une demi-heure) ; les **séances changées**, celles qui diffèrent de l'emploi du
temps en place (½ si décidé la veille, 1 le matin) ; les **heures remplacées** par des volontaires ; les **études en
trop**, au-delà de deux études à la fois (**H**).

## Les chiffres

**Par semaine, en moyenne sur 30 collèges** :

| Taille | P0 : perdues | P1 : perdues (changées, remplacées) | R 20 000 | R 200 000 | R 2 000 000 |
|---|---|---|---|---|---|
| S | 13,4 h | 11,9 h (1,0 ; 1,6 h) | 8,9 h (6,9) | 7,3 h (11,6) | **6,5 h** (15,3) |
| M | 17,8 h | 16,0 h (1,1 ; 1,9 h) | 12,2 h (9,2) | 10,1 h (15,4) | **8,9 h** (20,1) |
| L | 26,2 h | 23,1 h (1,9 ; 3,2 h) | 18,1 h (21,6) | 14,9 h (40,5) | **12,9 h** (53,6) |

Entre parenthèses pour la recherche : les séances changées.

**Les écarts par paires** (A − B, moyenne et intervalle à 95 %, en heures perdues par semaine) :

| Taille | P1 − P0 | R 20 000 − P1 | R 200 000 − P1 | R 2 000 000 − P1 | Témoin A/A (R 20 000, autre graine) |
|---|---|---|---|---|---|
| S | −1,52 (−1,75 à −1,28) | −3,03 (−3,25 à −2,81) | −4,55 (−4,82 à −4,27) | −5,41 (−5,73 à −5,09) | +0,02 (−0,04 à 0,08) |
| M | −1,86 (−2,12 à −1,60) | −3,74 (−4,00 à −3,49) | −5,83 (−6,18 à −5,49) | −7,11 (−7,48 à −6,74) | −0,01 (−0,09 à 0,06) |
| L | −3,11 (−3,52 à −2,70) | −4,96 (−5,23 à −4,70) | −8,23 (−8,60 à −7,87) | −10,22 (−10,65 à −9,80) | −0,05 (−0,15 à 0,04) |

**Le prix en séances changées**, R − P1 : +6,0, +10,6, +14,3 en S ; +8,1, +14,3, +18,9 en M ; +19,7, +38,6, +51,7 en L
(intervalles de ±0,3 à ±1,3). Soit, pour une heure sauvée, 2 à 2,6 séances changées en S et M, 4 à 5 en L.

**Les études en trop** baissent avec la recherche : de 0,58 à 0,25 en M, de 1,77 à 0,73 en L.

## Ce qu'on en tire

1. **P1 remplace ce que remplacent les collèges** : 10 à 12 % des heures perdues par P0, dans l'ordre des 13 % publiés
   pour 2024-2025. C'est le calage des volontaires (2 h une semaine sur quatre, `modele.md` § 4) qui le donne.
2. **La recherche bat P1 de loin, et plus elle cherche, plus elle sauve** : 23 à 25 % des heures que P1 perd dès
   20 000 essais par moment, 44 à 45 % à 2 millions, en 0,4 s par moment. Les bornes hautes restent très sous zéro à
   toutes les tailles et tous les budgets ; le témoin A/A contient 0 partout.
3. **Elle sauve surtout par les rattrapages** : elle remplace un peu moins d'heures que P1 (1,7 h contre 1,9 h en M),
   mais déplace le cours perdu un autre jour où son professeur est là, et d'autres séances pour lui faire de la place.
4. **Le prix est le dérangement**, et il grandit avec le collège : 2 à 2,6 séances changées par heure sauvée en S et
   M, 4 à 5 en L. Le score met les heures perdues d'abord (Q-S4), c'est donc un gain ; mais 54 séances changées par
   semaine dans un grand collège, c'est beaucoup à annoncer. À montrer à un principal adjoint (Q-P16) : faut-il un
   plafond de changements, ou un poids qui rachète une heure perdue par un certain nombre de changements ?
5. **Le gain ne plafonne pas encore** à 2 millions d'essais : de 200 000 à 2 millions, encore −0,9 à −2,0 h. Le budget
   du cadrage (10 s le matin) est 25 fois plus grand.

## Les variantes (nuit du 9 au 10/11)

Les mêmes collèges et les mêmes semaines, donc appariables d'un fichier à l'autre. Les commandes ajoutent
`--place anneal` (`agenda-j5-place-anneal-*`, `tmp/replan-j5-anneal-*.json`) ou `--hours 5` / `--hours 0`
(`agenda-j5-hours5-M`, `agenda-j5-hours0-M`).

**L'emploi du temps du recuit plutôt que celui de R0** (le recuit à 2,8 millions d'essais, le budget de J3) :

| Taille | P0 | P1 | R 2 000 000 (changées) | R 2 000 000 − P1 | Recuit − R0, R 2 000 000 : perdues ; changées |
|---|---|---|---|---|---|
| S | 13,3 h | 11,8 h | 6,4 h (13,7) | −5,47 (−5,79 à −5,15) | −0,12 (−0,33 à 0,09) ; −1,5 (−2,1 à −1,0) |
| M | 17,7 h | 15,9 h | 8,7 h (20,7) | −7,16 (−7,56 à −6,77) | −0,14 (−0,36 à 0,07) ; +0,7 (0,1 à 1,2) |
| L | 26,3 h | 23,2 h | 13,1 h (50,4) | −10,16 (−10,59 à −9,74) | +0,22 (−0,06 à 0,50) ; −3,2 (−4,3 à −2,1) |

**Les heures des volontaires**, en M (emploi du temps de R0) :

| Volontaires | P0 | P1 (remplacées) | R 2 000 000 (changées) | R 2 000 000 − P1 |
|---|---|---|---|---|
| Aucun | 17,8 h | 17,8 h (0) | 10,3 h (19,1) | −7,51 (−7,89 à −7,14) |
| Calés : 2 h une semaine sur quatre | 17,8 h | 16,0 h (1,9 h) | 8,9 h (20,1) | −7,11 (−7,48 à −6,74) |
| 5 h chaque semaine | 17,8 h | 6,7 h (11,6 h) | 2,6 h (23,7) | −4,08 (−4,65 à −3,51) |

- **Un meilleur emploi du temps de l'année ne coûte rien au replanning** : sur celui du recuit, 7 à 12 fois moins
  cher que celui de R0, on perd autant d'heures (les intervalles contiennent 0) et on change à peu près autant de
  séances. On ne paie pas la qualité de l'année en semaines d'absences.
- **Sans aucun volontaire, la recherche sauve encore 7,5 h** sur 17,8 : ce sont les rattrapages, pas les
  remplacements. Les volontaires calés n'y ajoutent que 1,4 h (8,9 h perdues au lieu de 10,3).
- **Avec 5 h de volontaires chaque semaine**, P1 remplace 63 % des heures (ce n'est pas le terrain : 13 % publiés), et
  la recherche enlève encore 61 % de ce qui reste (6,7 → 2,6 h), pour 17 séances changées de plus.

## Ce qui reste à J5

- **Le coût souple** du nouvel emploi du temps (le 3e critère du score) n'est pas compté : les rattrapages allongent
  des journées sans que le score le voie.
- **La page** : la journée avant et après, ce qui a changé (§ 10).
- **J6** : la durée d'une absence inconnue quand on décide ; ici elle est connue dès que l'absence l'est.
