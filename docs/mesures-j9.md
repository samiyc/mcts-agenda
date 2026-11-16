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

Neuf jobs de la file (`agenda-j9-*`, S, M et L), mis en file le 16/11 au soir. **Ce qu'on regarde** :

- **le calage de P1** : à J5, P1 remplaçait 10 à 12 % des heures perdues, l'ordre des 13 % publiés. Les volontaires
  n'ont pas changé ; avec deux fois plus d'absences, P1 devrait en remplacer à peu près deux fois moins. Si c'est le
  cas, le calage des volontaires (2 h une semaine sur quatre, **H**) est à revoir, à décider avec Sami ;
- **la recherche contre P1** : J5 sauvait 21 à 45 % des heures que P1 perd. Avec plus d'absences, plus de séances
  à rattraper, mais moins de place pour les rattraper ;
- **J6** : ne pas connaître la durée d'une maladie coûtait 0,03 à 0,05 h par semaine ; plus d'absences
  qui se chevauchent pourraient creuser l'écart.

Les chiffres viendront ici, au matin du 17/11.
