# Les mesures de J9 : le modèle recalé sur la recherche du 16/11

J9 applique deux décisions de Sami du 16/11, tirées de la recherche du jour ([`recherche/sources.md`](recherche/sources.md)
§ 9, [`recherche/questions.md`](recherche/questions.md)) :

- **D10, une nouvelle contrainte dure** : un professeur d'EPS fait 6 heures de cours par jour au plus (la fiche de
  l'IH2EF sur l'emploi du temps). La règle et les recherches la tiennent (`tryCourse`), l'évaluateur compte les heures
  au-delà, et le replanning ne donne ni un remplacement ni une séance déplacée qui la passerait
  (`src/rules/day.js`, `src/absence/plan.js`) ;
- **les absences à 9 % des heures** au lieu d'un jour par mois (`src/absence/scenario.js`). Les collèges perdent
  7,8 % de leurs heures en absences courtes non remplacées (DEPP, 2024-2025, hors fermetures) et en remplacent 13 à
  19 % : les professeurs manquent environ 9 % de leurs heures (notre calcul, **H**, Q-P17). Une absence commence un
  jour donné avec la probabilité 1/18 au lieu de 1/40. Simulé sur l'emploi du temps de R0 d'un collège M : 1/40
  donnait **4,3 %** des heures (et non 5 %), 1/18 donne **9,1 %**.

Une seule empreinte bouge, celle des constructions de R0 et R0-naïf (le plafond change quelques placements).

## 1. Le plafond des professeurs d'EPS (R0, avant et après)

Les graines 1001 à 1030, R0 sur chaque collège, compté sur les deux semaines A et B (un script jetable de `tmp/`, hors
file par un créneau, le 16/11 au soir). Un crible, pas une mesure par paires : il dit si le plafond mord, et ce qu'il coûte
à peu près.

| Taille | Journées d'un professeur d'EPS | Au-delà de 6 h, avant | Avant : heures en trop, la plus longue | Après | D1 (créneaux non placés, 30 collèges), avant → après | Coût moyen, avant → après |
|---|---|---|---|---|---|---|
| S | 677 | 10 | 20 h ; 8 h | 0 | 6 → 2 | 393 → 401 |
| M | 852 | 10 | 20 h ; 8 h | 0 | 2 → 0 | 529 → 519 |
| L | 1 352 | 9 | 18 h ; 8 h | 0 | 2 → 1 | 741 → 738 |

**Ce qu'on en tire** : R0 dépassait le plafond sur environ 1 % des journées d'un professeur d'EPS, d'un bloc de 2 h à
chaque fois. Avec D10, plus aucune, et R0 ne laisse pas plus de cours (les écarts de D1 et du coût sont du bruit
de quelques placements). Le plafond ne rend pas les collèges plus difficiles.

## 2. Les remplacements, rejoués avec deux fois plus d'absences

Les commandes de J5 et de J6, inchangées, depuis une copie figée du dépôt (`E:/Dev/agenda-j9`, au commit de J9) :

```text
node scripts/replan-compare.js --sizes S --n 30 --from 1001 --weeks 30 --tries 20000,200000,2000000 --json tmp/replan-j9-S.json
node scripts/replan-compare.js --sizes S --n 30 --from 1001 --weeks 30 --tries 200000 --hidden veille --beliefs known,worst,odds --json tmp/replan-j9-veille-S.json
node scripts/replan-compare.js --sizes S --n 30 --from 1001 --weeks 30 --tries 200000 --hidden matin --told-whole 0 --beliefs known,worst,odds --json tmp/replan-j9-matin0-S.json
```

Neuf jobs de la file (`agenda-j9-*`, S, M et L), mis en file le 16/11 au soir, finis le 17/11 vers 4 h. Les
absences sont les mêmes d'un fichier à l'autre, graine pour graine : on apparie comme à J6.

### 2.1 P1 et la recherche (J5 rejoué)

**Par semaine, en moyenne sur 30 collèges** (heures perdues ; entre parenthèses, les séances changées) :

| Taille | P0 : perdues | P1 : perdues (changées ; remplacées) | R 20 000 | R 200 000 | R 2 000 000 |
|---|---|---|---|---|---|
| S | 29,1 h | 27,1 h (1,3 ; 2,2 h) | 20,6 h (6,7) | 17,4 h (10,2) | **15,3 h** (12,5) |
| M | 38,4 h | 36,0 h (1,4 ; 2,5 h) | 27,9 h (8,3) | 23,6 h (12,5) | **20,8 h** (16,2) |
| L | 57,6 h | 53,6 h (2,4 ; 4,1 h) | 43,0 h (11,9) | 36,2 h (18,6) | **31,4 h** (25,5) |

P0 perd 2,2 fois les heures de J5 (13,4, 17,8 et 26,2 h), comme le taux d'absence (4,3 → 9,1 %).

**Les écarts par paires** (A − B, moyenne et intervalle à 95 %, heures perdues par semaine) :

| Taille | P1 − P0 | R 20 000 − P1 | R 200 000 − P1 | R 2 000 000 − P1 | Témoin A/A (R 20 000, autre graine) |
|---|---|---|---|---|---|
| S | −2,07 (−2,39 à −1,75) | −6,48 (−6,81 à −6,16) | −9,67 (−10,08 à −9,27) | −11,72 (−12,23 à −11,22) | +0,01 (−0,12 à 0,13) |
| M | −2,32 (−2,66 à −1,98) | −8,15 (−8,49 à −7,81) | −12,40 (−12,83 à −11,97) | −15,23 (−15,68 à −14,78) | −0,12 (−0,26 à 0,02) |
| L | −3,96 (−4,48 à −3,44) | −10,60 (−11,02 à −10,18) | −17,41 (−17,96 à −16,87) | −22,25 (−22,89 à −21,60) | +0,05 (−0,12 à 0,21) |

Le prix, R 2 000 000 − P1 : +11,3, +14,7 et +23,2 séances changées, +87, +117 et +183 points de coût souple
(J5 : +42, +56, +85).

### 2.2 Ne pas connaître la durée (J6 rejoué)

Chaque croyance moins la recherche ouverte à 200 000 essais, par paires (perdues ; changées ; annonces) :

| | Veille : known − ouvert | Veille : odds − ouvert | Matin0 : known − ouvert | Matin0 : odds − ouvert |
|---|---|---|---|---|
| S | +0,12 (0,06 à 0,17) ; +0,51 ; +0,12 | +0,01 (−0,05 à 0,06) ; +1,05 ; +2,87 | +0,49 (0,43 à 0,56) ; +0,67 ; +1,34 | −0,02 (−0,12 à 0,09) ; +1,87 ; +6,66 |
| M | +0,14 (0,08 à 0,20) ; +0,61 ; +0,00 | −0,08 (−0,16 à −0,01) ; +1,34 ; +3,21 | +0,58 (0,50 à 0,67) ; +0,91 ; +1,57 | −0,06 (−0,17 à 0,05) ; +2,66 ; +7,96 |
| L | +0,10 (0,02 à 0,18) ; +1,09 ; +0,80 | −0,03 (−0,12 à 0,06) ; +2,08 ; +5,74 | +0,61 (0,50 à 0,73) ; +1,65 ; +3,70 | +0,04 (−0,08 à 0,15) ; +4,04 ; +13,48 |

**worst** perd 0,27 à 0,57 h de plus que la recherche ouverte la veille, 0,73 à 1,41 h au pire cas, plus que known
partout. Le témoin (known, une autre graine) contient 0 sur les heures dans les six fichiers.

### 2.3 Ce qu'on en tire

1. **P1 ne remplace plus que 6 à 7 % des heures perdues** (7,1 %, 6,0 % et 6,9 %), contre 10 à 12 % à J5, sous les
   13 à 19 % publiés. Les volontaires saturent : ils remplacent 30 à 40 % d'heures de plus qu'à J5 (2,2 h contre 1,6 h
   en S), pas le double. **Le calage des volontaires est à revoir** (20 % des professeurs, 2 h une semaine sur quatre,
   **H**) : à décider avec Sami.
2. **La recherche sauve la même part, donc deux fois plus d'heures** : 20 à 24 % de ce que P1 perd à 20 000 essais,
   32 à 36 % à 200 000, 41 à 43 % à 2 millions (J5 : 21 à 25 %, 34 à 37 %, 44 à 45 %). Elle sauve 11,7 à 22,3 h par
   semaine au lieu de 5,4 à 10,1 h, toujours pour environ une séance changée par heure sauvée. Plus de séances à
   rattraper, et assez de place pour les rattraper : la part ne perd que 1 à 3 points.
3. **Ne pas connaître la durée coûte 2 à 3 fois plus qu'à J6, et reste petit.** Sous l'hypothèse du modèle, 0,10 à
   0,14 h par semaine (J6 : 0,03 à 0,05), moins de 1 % des heures perdues par la recherche ; au pire cas, 0,49 à
   0,61 h (1,7 à 2,8 %). **odds rattrape encore tout, en heures** (les intervalles contiennent 0, sauf en M la veille
   où odds perd même 0,08 h de moins que la recherche ouverte), pour 1 à 4 séances changées et 3 à 13 annonces de plus.
   **worst reste à écarter.**
4. **Les conclusions de J6 tiennent** : le défaut reste known, et l'ISMCTS n'a toujours presque rien à gagner (au plus
   0,1 à 0,6 h par semaine). Le cas d'odds se renforce un peu au pire cas ; il dépend toujours de Q-P16 et Q-P17.
