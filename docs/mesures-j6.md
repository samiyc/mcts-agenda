# Les mesures de J6 : décider sans connaître la durée d'une absence (14/11/2026)

J6 cache la durée d'une partie des absences ([`modele.md`](modele.md) § 4) : une maladie sur deux s'apprend jour
après jour, chaque jour de plus la veille au soir (**H**, Q-P17). La recherche de J5 décide alors sans savoir si le
professeur revient demain. On compare trois **croyances** de la même recherche (§ 7, `src/absence/belief.js`) :

- **known**, la recherche de J5 telle quelle : un jour qu'on ne sait pas encore manqué compte comme un jour de présence ;
- **worst** : le professeur manque jusqu'au troisième jour de son absence ;
- **odds** : une heure perdue compte par la probabilité que le scénario donne à l'absence (2/3 de durer un deuxième
  jour, 1/2 un troisième une fois le deuxième connu). La recherche connaît la loi des durées (**H**).

Sous worst et odds, la recherche peut aussi remplacer d'avance un cours dont le professeur manquera peut-être.

**Les commandes** (les graines 1001 à 1030, 30 semaines par collège, 200 000 essais par moment, le budget du milieu
de J5) :

```text
node scripts/replan-compare.js --sizes S --n 30 --from 1001 --weeks 30 --tries 200000 --hidden veille --beliefs known,worst,odds --json tmp/replan-j6-veille-S.json
node scripts/replan-compare.js --sizes S --n 30 --from 1001 --weeks 30 --tries 200000 --hidden matin --told-whole 0 --beliefs known,worst,odds --json tmp/replan-j6-matin0-S.json
node scripts/replan-compare.js --sizes S --n 30 --from 1001 --weeks 30 --tries 200000 --json tmp/replan-j6-open-S.json
```

Neuf jobs de la file (`agenda-j6-veille-*`, `agenda-j6-matin0-*`, `agenda-j6-open-*`). Trois façons d'apprendre :

- **veille**, l'hypothèse du modèle : une maladie sur deux apprise jour après jour, chaque jour de plus la veille ;
- **matin0**, le pire cas : toutes les maladies apprises jour après jour, chaque jour de plus le matin même ;
- **ouvert**, la référence : toutes les durées connues dès le premier jour, comme à J5.

Les absences sont les mêmes partout, graine pour graine (les drapeaux de J6 sont tirés sur un flux à part) : on
apparie d'un fichier à l'autre. La recherche ouverte rejoue exactement les chiffres de J5 à 200 000 essais.

**Ce qui est nouveau dans les chiffres** : les **annonces**, les changements annoncés moment après moment, pondérés
comme les séances changées (½ la veille, 1 le matin). Une séance déplacée deux fois, ou déplacée puis remise, compte
deux fois ; les séances changées ne comptent que l'état final.

## Les chiffres

**Par semaine, en moyenne sur 30 collèges** (perdues ; changées ; annonces) :

| Taille | Ouvert | Veille : known | worst | odds | Matin0 : known | worst | odds |
|---|---|---|---|---|---|---|---|
| S | 7,46 h ; 4,8 ; 8,4 | 7,52 ; 5,0 ; 8,5 | 7,55 ; 4,9 ; 9,1 | 7,44 ; 5,3 ; 9,8 | 7,65 ; 5,1 ; 9,2 | 7,78 ; 5,0 ; 10,0 | 7,45 ; 5,6 ; 11,5 |
| M | 10,28 h ; 5,9 ; 10,4 | 10,32 ; 6,1 ; 10,6 | 10,47 ; 5,9 ; 11,2 | 10,28 ; 6,4 ; 12,1 | 10,47 ; 6,3 ; 11,4 | 10,70 ; 6,1 ; 12,6 | 10,24 ; 7,1 ; 14,9 |
| L | 15,13 h ; 8,7 ; 16,4 | 15,16 ; 9,2 ; 16,7 | 15,36 ; 8,8 ; 17,4 | 15,10 ; 9,6 ; 18,8 | 15,37 ; 9,4 ; 18,0 | 15,76 ; 8,9 ; 18,6 | 15,17 ; 10,3 ; 22,2 |

P1 perd 11,9, 16,0 et 23,1 h ; P0, 13,4, 17,8 et 26,2 h, partout (ni l'un ni l'autre ne regarde les jours suivants).

**Ce que coûte de ne pas savoir**, chaque croyance moins la recherche ouverte, par paires (perdues ; changées ;
annonces) :

| | Veille : known − ouvert | Veille : odds − ouvert | Matin0 : known − ouvert | Matin0 : odds − ouvert |
|---|---|---|---|---|
| S | +0,05 (0,02 à 0,08) ; +0,17 ; +0,07 | −0,02 (−0,05 à 0,00) ; +0,44 ; +1,38 | +0,18 (0,13 à 0,24) ; +0,27 ; +0,71 | −0,02 (−0,05 à 0,02) ; +0,80 ; +3,04 |
| M | +0,04 (0,01 à 0,07) ; +0,23 ; +0,21 | +0,00 (−0,03 à 0,04) ; +0,47 ; +1,69 | +0,19 (0,14 à 0,24) ; +0,40 ; +0,97 | −0,04 (−0,09 à 0,01) ; +1,16 ; +4,49 |
| L | +0,03 (0,00 à 0,06) ; +0,42 ; +0,22 | −0,02 (−0,07 à 0,02) ; +0,84 ; +2,36 | +0,24 (0,19 à 0,29) ; +0,71 ; +1,58 | +0,05 (−0,01 à 0,10) ; +1,60 ; +5,71 |

Les intervalles des séances changées et des annonces vont de ±0,07 à ±0,5. **worst** perd 0,08 à 0,63 h de plus que
la recherche ouverte : plus que known partout, pour un peu moins de séances changées. Le témoin A/A (known, une
autre graine) contient 0 sur les heures, sauf en S veille (+0,07, 0,01 à 0,13) : l'écart de cet ordre est au bord
du bruit.

## Ce qu'on en tire

1. **Ne pas connaître la durée ne coûte presque rien.** Sous l'hypothèse du modèle, la recherche de J5 perd 0,03 à
   0,05 h de plus par semaine qu'en connaissant les durées, moins de 1 % de ses heures perdues, et change 0,2 à 0,4
   séance de plus. Même au pire cas, c'est 0,2 h (1,6 à 2,4 %) et 0,3 à 0,7 séance. La raison : une heure perdue se
   rattrape n'importe quel jour de la semaine ; quand un rattrapage tombe sur un jour où le professeur manque encore,
   la recherche le déplace de nouveau au moment suivant, et il reste presque toujours un autre créneau.
2. **odds rattrape tout ce que coûte l'ignorance, en heures**, au pire cas comme sous l'hypothèse (les intervalles
   contiennent 0) ; mais **elle dérange plus** : 0,4 à 1,6 séance changée et 1,4 à 5,7 annonces de plus que la
   recherche ouverte. Elle remplace et déplace d'avance des cours dont le professeur, souvent, revient. odds perd 0,04 à 0,23 h de moins que known.
   Sous le score (une heure vaut cent séances changées, Q-S4), odds bat donc known ; si une annonce annulée dérange autant qu'une séance
   changée, le compte est moins net : au pire cas en L, 0,19 h sauvée pour 4,1 annonces de plus.
3. **worst est à écarter** : il perd plus d'heures que known (0,13 à 0,39 h ; l'intervalle ne contient 0 qu'en S
   veille), pour 0,1 à 0,5 séance changée de moins.
4. **L'ISMCTS n'a presque rien à gagner ici.** Ce qu'une recherche plus fine pourrait reprendre est borné par l'écart
   à la recherche qui connaît les durées : 0,03 à 0,24 h par semaine pour known, rien en heures pour odds, et au plus
   les 0,4 à 1,6 séances et 1,4 à 5,7 annonces qu'odds coûte en plus. Construire un arbre sur des mondes tirés pour un
   gain de cet ordre n'est pas rentable ; on ne le construit pas, sauf si un professionnel dit que les durées sont bien
   plus incertaines que notre hypothèse (Q-P17).
5. **Le défaut reste known** (`REPLAN`, celui de J5) : il ne coûte presque rien sous l'hypothèse, et dérange le moins.
   odds le remplacerait si l'incertitude est forte (Q-P17) et si une annonce annulée gêne peu (Q-P16).

## Ce qui reste

- **Les annonces dans le score** : elles sont mesurées, pas encore comptées dans la valeur de la recherche. À décider
  avec Q-P16 (une annonce annulée dérange-t-elle autant qu'un changement maintenu ?).
- **Le banc public** (XHSTT-2014, validé le 13/11) : construire sur les instances d'ITC 2011 avec le recuit de J3, et se
  comparer aux meilleures solutions publiées. C'est la suite qui apprend le plus.
