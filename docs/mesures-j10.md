# Les mesures de J10 : un emploi du temps qui laisse un collègue libre

J10 essaie la piste 2, validée par Sami le 17/11 : à coût égal, préférer l'emploi du temps où, à chaque heure, un
collègue de la même matière est libre pour remplacer. Le critère est **S9** (`src/rules/cover.js`, `modele.md` § 3.2).
Pour une matière, une semaine A ou B et un créneau, si tous les professeurs de la matière présents à ce créneau ont
cours, chacune de ces heures compte 1. Son poids vaut 0 par défaut. Le replanning ne le compte pas : S9 juge un
emploi du temps à construire, pas une semaine replanifiée.

**Résultat** : S9 fait ce qu'on lui demande. Il divise par deux, et jusqu'à quinze sur les grands collèges, les heures
sans collègue libre. Mais il ne sauve **aucune heure perdue**, ni avec P1 ni avec la recherche. Et il coûte de 20 à
76 points de coût souple à l'emploi du temps. **Il n'est pas retenu** : son poids par défaut reste 0.

## 1. La mesure

Les mêmes collèges et les mêmes absences, trois emplois du temps en place. Chacun est construit par R0, puis passe
par le recuit de J3 avec S9 au poids W = 0 (la référence), 1 ou 3. Les commandes partent d'une copie figée du dépôt
(`E:/Dev/agenda-j10`, au commit 4a37d36) :

```text
node scripts/replan-compare.js --sizes S --n 15 --from 1001 --weeks 30 --tries 200000 --place anneal --cover W --json tmp/j10-W-S-1001.json
node scripts/replan-pair.js --a tmp/j10-0-S-1001.json,tmp/j10-0-S-1016.json,… --b tmp/j10-3-S-1001.json,…
```

La mesure tient en 18 jobs de la file (`agenda-j10-*`) : les tailles S, M et L, les trois poids, et les graines 1001
à 1030 en deux tranches de 15. Ils ont été mis en file le 17/11 et ont fini le même soir. Pour
chaque collège, `replan-compare.js` garde le coût de l'emploi du temps en place, compté aux poids par défaut (S1 à
S8, donc sans S9), et ses heures S9.

## 2. La référence (W = 0)

Par semaine, en moyenne sur 30 collèges ; S9 se compte sur l'emploi du temps entier, semaines A et B.

| Taille | Coût de l'emploi du temps (S1 à S8) | Heures S9 | P0 : perdues | P1 : perdues (remplacées) | R 200 000 : perdues |
|---|---|---|---|---|---|
| S | 26,8 | 277 h | 29,0 h | 25,0 h (4,3 h) | 15,5 h |
| M | 50,8 | 370 h | 38,3 h | 33,7 h (4,9 h) | 21,4 h |
| L | 90,3 | 245 h | 57,6 h | 49,9 h (8,1 h) | 33,3 h |

Ce sont les chiffres de J9 rejoués sur l'emploi du temps de R0 suivi du recuit. P1 remplace 13 à 15 % de ce que P0
perd, et la recherche à 200 000 essais sauve 33 à 38 % de ce que P1 perd.

## 3. Les écarts par paires (W − 0)

Ce sont des moyennes, avec leur intervalle à 95 %. Pour l'emploi du temps : son coût S1 à S8, et ses heures S9.
Pour les règles : les heures perdues par semaine.

### W = 1

| Taille | Coût (S1 à S8) | Heures S9 | P1 : perdues | R 200 000 : perdues |
|---|---|---|---|---|
| S | +20,7 (16,5 à 25,0) | 277 → 143 : −135 (−142 à −127) | −0,09 (−0,43 à 0,25) | +0,04 (−0,42 à 0,51) |
| M | +39,3 (33,0 à 45,6) | 370 → 177 : −193 (−204 à −182) | +0,02 (−0,31 à 0,35) | +0,34 (−0,10 à 0,78) |
| L | +37,7 (28,7 à 46,6) | 245 → 36 : −209 (−223 à −195) | +0,12 (−0,32 à 0,55) | +0,12 (−0,43 à 0,66) |

### W = 3

| Taille | Coût (S1 à S8) | Heures S9 | P1 : perdues | R 200 000 : perdues |
|---|---|---|---|---|
| S | +34,7 (30,4 à 39,0) | 277 → 136 : −141 (−148 à −134) | +0,03 (−0,27 à 0,32) | +0,14 (−0,20 à 0,48) |
| M | +65,5 (57,2 à 73,8) | 370 → 166 : −205 (−215 à −194) | −0,08 (−0,39 à 0,23) | +0,35 (−0,05 à 0,76) |
| L | +76,1 (65,5 à 86,7) | 245 → 17 : −228 (−242 à −215) | +0,36 (−0,15 à 0,88) | +0,38 (−0,17 à 0,93) |

**Le critère** (§ 6 de `modele.md`) : une variante n'est retenue que si la borne haute de l'écart des heures perdues
reste sous zéro. Aucune des douze ne le passe. Les écarts sont tous à moins d'une demi-heure par semaine, et la
moitié penche du mauvais côté. Un seul intervalle sur dix-huit exclut zéro, celui du témoin en M, W = 3 :
+0,46 (0,06 à 0,86), donc **plus** d'heures perdues. C'est à la mesure de ce qu'on attend du hasard sur autant
d'intervalles.

Le coût souple de la semaine replanifiée monte aussi, de +10 à +39, pour toutes les règles, P0 compris. C'est le
coût de l'emploi du temps lui-même, que chaque semaine reprend.

## 4. Pourquoi S9 ne sert à rien ici

Les heures remplacées par P1 ne bougent pas :

| Taille | W = 0 | W = 1 | W = 3 | Au plus, par volontaire (budget : 2 h) |
|---|---|---|---|---|
| S | 4,31 h | 4,37 h | 4,37 h | 1,80 h |
| M | 4,89 h | 4,90 h | 4,93 h | 1,85 h |
| L | 8,06 h | 8,07 h | 8,08 h | 1,98 h |

Ce qui manque à P1, ce n'est pas un collègue libre, c'est **un volontaire qui a encore des heures**.

- Seul un volontaire remplace : un professeur sur cinq, dont un sur deux peut donner 2 h dans la semaine
  (`modele.md` § 4).
- Les volontaires qui remplacent donnent presque tout ce qu'ils peuvent (1,8 à 2 h sur 2). Leur budget est épuisé.
- S9 compte tous les professeurs de la matière. Le collègue libre qu'il ménage est le plus souvent quelqu'un qui ne
  remplace pas, ou qui n'a plus d'heures.
- Faute d'un volontaire de la matière, P1 prend un volontaire de l'équipe de la classe. La matière compte donc moins
  que le budget.

La recherche, elle, sauve surtout en rattrapant les séances perdues à un autre moment de la semaine, non en les
faisant remplacer. C'était le risque dit dans le plan, et il s'est réalisé : remplacées 3,9 à 7,6 h par la
recherche, contre 9 à 17 h sauvées sur P1.

## 5. Ce qu'on en tire

- **S9 reste au poids 0 par défaut.** Il reste dans le code et sur la page. Il y compte, dans les coûts, les heures
  sans collègue libre, et le bac à sable peut lui donner un poids. Rien ne change sans réglage : les empreintes sont
  celles de J9.
- **Une couverture par les seuls volontaires** (la piste laissée hors du plan) n'aiderait pas plus tant que leur
  budget est épuisé. Elle ne vaut d'être essayée que si les volontaires avaient plus d'heures. C'est une question
  de modèle (Q-P14, Q-P15), pas d'algorithme.
- **Le levier qui reste est celui de la recherche** : les rattrapages. Un emploi du temps qui laisse, pour chaque
  classe et chaque professeur, des créneaux libres communs plus tard dans la semaine. Ce critère n'est pas local,
  donc il est cher à suivre dans le recuit (`modele.md` § 12). C'est la suite, si on veut continuer cette piste.
