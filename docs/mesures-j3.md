# Les mesures de J3 : le recuit et le tabou contre R0 (9-10/11/2026)

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
2. **Le recuit bat le tabou** aux trois tailles (avec les réglages de départ ; réglés, ils font jeu égal en S et M, voir
   plus bas), et l'écart grandit avec le collège (−10, −26, −47) ; le recuit coûte moins sur 22, 27 et 28 collèges sur
   30. Les deux ont les mêmes mouvements et le même temps. Le tabou a été réglé sur 3 collèges seulement (40 barrettes
   tirées par pas, 4 échanges, une interdiction de 30 à 60 pas) ; un réglage plus poussé pourrait réduire l'écart, pas
   l'inverser sans le mesurer.
3. **Le témoin A/A tient** : ses intervalles contiennent 0 à toutes les tailles (de justesse en L : −19,6 à 0,2).
   Le bruit d'une graine de recherche est de l'ordre de 5 à 10 points, bien sous les écarts mesurés.
4. **Ce qui résiste** : le lourd après 15 h (S6), qui fait maintenant un tiers du coût. Le français, les maths et la
   LV1 font 12 à 13 h par semaine dans chaque division, et les matinées n'ont que 4 créneaux. Une part de S6 est
   peut-être inévitable ; on n'a pas de borne inférieure pour le dire.
5. **Les échanges comptent** (crible sur 3 collèges M, pas une mesure) : sans eux, le recuit finit autour de 155 au
   lieu de 95, et le tabou avec les seuls déplacements ne fait guère mieux que R0 quand il tire peu de barrettes.
6. **Les chemins chauds n'allouent plus** : le banc comptait 129 passages du ramasse-miettes pendant 2 s de recuit
   sur S, il en compte 3 depuis les boucles indexées. R0 y a gagné 20 % de vitesse, sans qu'un placement change.

## Le budget : 60 s contre 20 s (nuit du 9 au 10/11)

Les mêmes 30 collèges par taille, la même commande avec `--seconds 60` (`agenda-j3-60s-S`, `-M`, `-L`, sorties
`tmp/search-j3-60-*.json`), appariés graine par graine avec les mesures à 20 s. Temps réels : 53 à 56 s.

| Taille | Recuit 20 s → 60 s | 60 s − 20 s, recuit | 60 s − 20 s, tabou | 60 s − 20 s, R0 répété |
|---|---|---|---|---|
| S | 32,9 → **16,9** | −16,0 (−19,8 à −12,2) | −17,5 (−20,9 à −14,1) | −13,1 (−19,4 à −6,8) |
| M | 58,7 → **29,5** | −29,3 (−34,6 à −23,9) | −40,0 (−45,6 à −34,5) | −20,0 (−27,1 à −12,9) |
| L | 110 → **63,5** | −47,0 (−56,1 à −37,9) | −56,8 (−61,7 à −51,8) | −40,1 (−57,2 à −23,1) |

À 60 s, le recuit bat encore le tabou (−8,6, −14,7, −36,7, bornes hautes sous zéro) et R0 répété (−290, −391,
−561) ; le témoin A/A contient 0 (−0,1, −3,8, +0,7).

- **Tripler le temps divise à peu près le coût par deux** (−49 %, −50 %, −43 %), et ce qu'on gagne, c'est surtout
  du lourd après 15 h (S6 : 11,5 en M au lieu de 19,7) et des trous de professeurs. **Q-S6 vaut la peine** : 60 s
  pour construire l'emploi du temps de l'année, c'est peu, et la recherche n'a pas calé.

## Les réglages (nuit du 9 au 10/11)

`npm run tune` (`scripts/search-tune.js`) sur les graines 2001 à 2030, M, 20 s, chaque variante appariée au réglage
par défaut (`agenda-tune-anneal-M`, `agenda-tune-tabu-M`). Variante − défaut :

| Recuit (défaut 64,3) | Écart | Tabou (défaut 80,9) | Écart |
|---|---|---|---|
| hot=3 | **−11,1** (−17,3 à −4,9) | sample=20 | **−25,0** (−31,8 à −18,2) |
| cold=0.1 | −6,2 (−12,3 à −0,1) | tenure=60 | −7,8 (−14,3 à −1,4) |
| swap=0.3 | −3,4 (−9,0 à 2,3) | tenure=15 | +0,6 (−5,9 à 7,0) |
| swap=0.7 | +13,2 (6,5 à 19,8) | swaps=8 | +7,8 (2,1 à 13,6) |
| hot=15 | +14,9 (7,5 à 22,4) | sample=80 | +21,9 (12,4 à 31,3) |

- **Le recuit part trop chaud** (8) et **le tabou tire trop de barrettes** (40) : les deux réglages venaient de
  3 collèges. Le tabou réglé (55,9) passerait devant le recuit par défaut (64,3) sur ces graines : le classement
  « le recuit bat le tabou » est peut-être un effet de réglage. Il faut les comparer réglés tous les deux.
**La confirmation** (10/11, graines neuves 3001 à 3030, 20 s, `agenda-confirm-*`, `tmp/confirm-*.json`), variante −
défaut :

| Taille | Recuit hot=3 | Recuit hot=3, cold=0.1 | Tabou sample=20 | Tabou sample=20, tenure=60 |
|---|---|---|---|---|
| S | −8,2 (−12,9 à −3,6) | −10,9 (−16,0 à −5,8) | −18,1 (−23,4 à −12,7) | −17,4 (−21,3 à −13,5) |
| M | −12,8 (−17,4 à −8,3) | −10,0 (−15,0 à −5,0) | −29,2 (−37,2 à −21,1) | **−34,1** (−41,9 à −26,3) |
| L | **−30,2** (−37,8 à −22,6) | −23,3 (−32,1 à −14,5) | −37,3 (−45,3 à −29,3) | **−50,6** (−56,6 à −44,7) |

**Le second tour** (graines 2001 à 2030, M, `agenda-tune2-*`), variante − ancien défaut : recuit hot=2 −18,5 (−25,0
à −11,9), hot=4 −9,6, hot=3 et cold=0.15 −16,3, hot=2 et cold=0.1 −13,5 ; tabou sample=15 **−30,5** (−36,9 à
−24,1), sample=10 −12,5, sample=20 et tenure=45 −24,7, sample=10 et tenure=60 +6,2.

- **Les deux gagnants tiennent sur des graines neuves, aux trois tailles**, et le gain grandit avec le collège : ils
  entrent dans les défauts le 10/11, **recuit hot=3** et **tabou sample=20, tenure=60** (le froid à 0,1 n'apporte
  rien de sûr). Le coût moyen à 20 s baisse de 21 à 26 % pour le recuit, de 33 à 40 % pour le tabou.
- **Le second tour ne tient pas** : sur les graines neuves 4001 à 4030 (`agenda-confirm2-*`), contre les nouveaux
  défauts, recuit hot=2 −2,3 (−4,9 à 0,3), −4,5 (−10,3 à 1,3), +1,2 (−7,2 à 9,6) ; tabou sample=15 +6,3 (3,4 à 9,1),
  +1,1 (−5,1 à 7,3), −4,9 (−11,7 à 1,8). Ses gains sur les graines du réglage venaient du choix du meilleur parmi
  quatre ; les défauts restent hot=3 et sample=20, tenure=60.

## Recuit réglé contre tabou réglé (10/11)

Les graines de la mesure (1001 à 1030), 20 s, les nouveaux défauts (`agenda-j3-tuned-*`,
`tmp/search-j3-tuned-*.json`) :

| Taille | Recuit (avant réglage) | Tabou (avant réglage) | Recuit − tabou | Recuit − témoin |
|---|---|---|---|---|
| S | **27,1** (32,9) | 27,5 (43,1) | −0,4 (−4,3 à 3,6) | +4,1 (0,2 à 8,0) |
| M | 50,2 (58,7) | **46,2** (84,2) | +4,0 (−0,8 à 8,9) | +3,0 (−3,0 à 9,0) |
| L | **89,3** (110) | 107 (157) | −18,0 (−25,8 à −10,3) | −0,8 (−6,9 à 5,4) |

- **Réglés tous les deux, ils font jeu égal en S et M, le recuit gagne en L.** L'écart de J3 (−10, −26, −47) venait
  surtout du réglage du tabou. Le tabou laisse un peu moins de lourd après 15 h (S6), le recuit moins de trous de
  professeurs et de matières deux fois le même jour.
- **Le témoin A/A sort de justesse en S** (0,2 à 8,0) : un intervalle sur vingt doit le faire ; les autres le
  contiennent. Le bruit d'une graine de recherche est de 4 à 9 points en S et M.
- **Le recuit reste la recherche de référence** : jamais battu, meilleur sur les grands collèges, et un seul réglage
  qui compte (la température de départ).

## La suite

- **Le budget** : 60 s (Q-S6), mesuré ci-dessus ; à 60 s le gain ne plafonne pas.
- **Les chaînes de Kempe**, si la recherche cale ; ou un départ du tabou depuis le recuit, puisqu'ils ne laissent pas
  les mêmes coûts.
