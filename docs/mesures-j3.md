# Les mesures de J3 : le recuit et le tabou contre R0 (9/11/2026)

La recherche locale de J3 ([`modele.md`](modele.md) § 7) part de l'emploi du temps de R0 et ne casse aucune
contrainte dure. On la compare à R0 et à **R0 répété** (R0 relancé avec d'autres graines d'égalités pendant le même
temps, le meilleur gardé), par paires sur les mêmes collèges, avec le témoin A/A : le recuit rejoué avec une autre
graine.

**La commande** (les graines 1001 à 1030, celles de J1 et J2 ; les réglages ont été choisis sur les graines 1 à 3) :

```text
node scripts/search-compare.js --sizes S --n 30 --from 1001 --seconds 20 --json tmp/search-j3-S.json
```

Un job de la file par taille (`agenda-j3-search-S`, `-M`, `-L`), un fil chacun. **Le budget** : 20 s par recherche
(**H** ; Q-S6 propose 60 s pour M), converti en créneaux essayés aux taux du banc (140 essais par milliseconde pour le
recuit, 580 pour le tabou). Les temps réels ont été de 17 à 18 s. R0 répété tourne 17 fois en S, 8 en M et 3 en L,
soit 16 à 21 s.

## Les chiffres

**Le coût moyen** (l'infaisabilité est nulle partout, sauf pour R0, qui laisse un cours sur 5 collèges sur 90 ; les
deux recherches le placent chaque fois) :

| Taille | R0 | R0 répété | Recuit | Tabou | Témoin A/A (recuit, autre graine) |
|---|---|---|---|---|---|
| S | 393 | 320 | **32,9** | 43,1 | 31,7 |
| M | 529 | 440 | **58,7** | 84,2 | 62,5 |
| L | 741 | 664 | **110** | 157 | 120 |

**Les écarts par paires** (A − B, moyenne et intervalle à 95 % ; sous zéro, A coûte moins) :

| Taille | Recuit − R0 | Tabou − R0 | R0 répété − R0 | Recuit − R0 répété | Recuit − tabou | Recuit − témoin |
|---|---|---|---|---|---|---|
| S | −360 (−379 à −342) | −350 (−368 à −332) | −73,5 (−92,0 à −55,1) | −287 (−295 à −278) | −10,1 (−16,5 à −3,8) | +1,2 (−4,9 à 7,3) |
| M | −470 (−491 à −450) | −445 (−466 à −423) | −88,6 (−114 à −62,8) | −382 (−396 à −368) | −25,5 (−32,2 à −18,8) | −3,8 (−10,1 à 2,6) |
| L | −631 (−656 à −605) | −584 (−610 à −559) | −76,8 (−101 à −52,5) | −554 (−576 à −532) | −46,5 (−57,7 à −35,3) | −9,7 (−19,6 à 0,2) |

**Ce qui reste**, par contrainte, en moyenne par collège, avant les poids (R0 → recuit) :

| Taille | S1 trous des divisions | S2 trous des professeurs | S3 vœux | S4 deux fois le même jour | S6 lourd après 15 h | S8 EPS rapprochée |
|---|---|---|---|---|---|---|
| S | 2,3 → 0 | 45,7 → 1,2 | 2,7 → 2,0 | 44,2 → 1,9 | 42,6 → 11,1 | 0 → 0,2 |
| M | 3,4 → 0 | 63,9 → 3,9 | 4,4 → 2,8 | 55,3 → 3,0 | 59,3 → 19,7 | 0,1 → 0,3 |
| L | 4,5 → 0 | 83,7 → 7,3 | 6,1 → 4,6 | 82,8 → 6,6 | 83,5 → 37,0 | 0,1 → 0,7 |

S5 (plus de 7 h en cycle 4) et S7 (hors de sa salle) restent à 0.

## Ce qu'on en tire

1. **Le recuit bat R0 de loin** : il divise le coût par 7 à 12, et sa borne haute reste très sous zéro aux trois
   tailles. Il bat aussi R0 répété : donner à R0 le même temps ne fait gagner que 15 % (−74 à −89).
2. **Le recuit bat le tabou** aux trois tailles, et l'écart grandit avec le collège (−10, −26, −47) ; le recuit coûte moins sur 22, 27 et
   28 collèges sur 30. Les deux ont
   les mêmes mouvements et le même temps. Le tabou a été réglé sur 3 collèges seulement (40 barrettes tirées par pas,
   4 échanges, une interdiction de 30 à 60 pas) ; un réglage plus poussé pourrait réduire l'écart, pas l'inverser sans
   le mesurer.
3. **Le témoin A/A tient** : ses intervalles contiennent 0 à toutes les tailles (de justesse en L : −19,6 à 0,2).
   Le bruit d'une graine de recherche est de l'ordre de 5 à 10 points, bien sous les écarts mesurés.
4. **Ce qui résiste** : le lourd après 15 h (S6), qui fait maintenant un tiers du coût. Le français, les maths et la
   LV1 font 12 à 13 h par semaine dans chaque division, et les matinées n'ont que 4 créneaux. Une part de S6 est
   peut-être inévitable ; on n'a pas de borne inférieure pour le dire.
5. **Les échanges comptent** (crible sur 3 collèges M, pas une mesure) : sans eux, le recuit finit autour de 155 au
   lieu de 95, et le tabou avec les seuls déplacements ne fait guère mieux que R0 quand il tire peu de barrettes.
6. **Les chemins chauds n'allouent plus** : le banc comptait 129 passages du ramasse-miettes pendant 2 s de recuit
   sur S, il en compte 3 depuis les boucles indexées. R0 y a gagné 20 % de vitesse, sans qu'un placement change.

## La suite

- **Le recuit est la recherche de référence** pour la suite (le replanning de J5 partira de lui).
- **Le budget** : mesurer le recuit à 60 s contre 20 s, pour savoir si Q-S6 vaut la peine.
- **Les chaînes de Kempe** et un réglage du tabou sur des graines à part, si le recuit cale.
