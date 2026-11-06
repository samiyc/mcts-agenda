# Les mesures de J2 : R0 sur les collèges à barrettes (6/11/2026)

Les collèges de J2 ont leurs barrettes et leurs demi-groupes ([`modele.md`](modele.md) § 2.4) : la LV2 et le soutien
de 6e par paires de divisions, la SVT et la physique-chimie en demi-groupes alternés sur les semaines A et B. On
mesure R0 et R0-naïf sur ces collèges, par paires, avec le témoin A/A, comme en J1 ([`mesures-j1.md`](mesures-j1.md)).

**La commande** (les graines 1001 à 1030, celles de J1) :

```text
node scripts/compare.js --sizes S,M,L --n 30 --from 1001 --json tmp/compare-j2.json
```

M et L : job `agenda-j2-r0-20261106-153002` de la file. S : remesuré par `--slot` après la correction des salles
(ci-dessous), `tmp/compare-j2-s.json`. M et L n'ont pas de division seule, la correction ne les change pas.

## Les chiffres

| Taille | Cours (barrettes), graine 1 | R0-naïf : cases non placées (cours) | R0 − R0-naïf, infaisabilité | R0 : collèges avec un cours non placé (le témoin) | R0 : coût moyen (min, médiane, max) | R0 : temps |
|---|---|---|---|---|---|---|
| S | 364 (308) | 36,5 (12,8) | −36,3 (−38,6 à −34,0) | 3 sur 30 (1) | 393 (293, 409, 490) | 1,2 s |
| M | 472 (404) | 47,7 (14,4) | −47,6 (−48,8 à −46,4) | 1 sur 30 (0) | 529 (420, 532, 704) | 2,0 s |
| L | 708 (606) | 71,6 (23,0) | −71,5 (−73,9 à −69,2) | 1 sur 30 (0) | 741 (618, 741, 903) | 6,6 s |

**Le témoin A/A** (R0 contre R0 avec une autre graine d'égalités) :

| Taille | Infaisabilité | Coût |
|---|---|---|
| S | +0,1 (−0,1 à 0,4) | −4,8 (−31,4 à 21,8) |
| M | +0,1 (−0,1 à 0,2) | +27,2 (−0,4 à 54,8) |
| L | +0,1 (−0,1 à 0,2) | +21,2 (−11,0 à 53,3) |

**Le coût de R0 par contrainte**, en moyenne par collège, avant les poids :

| Taille | S1 trous des divisions | S2 trous des professeurs | S3 vœux | S4 deux fois le même jour | S5 journée longue | S6 lourd après 15 h | S7 hors de sa salle | S8 EPS rapprochée |
|---|---|---|---|---|---|---|---|---|
| S | 2,3 | 45,7 | 2,7 | 44,2 | 0 | 42,6 | 0 | 0 |
| M | 3,4 | 63,9 | 4,4 | 55,3 | 0 | 59,3 | 0 | 0,1 |
| L | 4,5 | 83,7 | 6,1 | 82,8 | 0 | 83,5 | 0 | 0,1 |

## La correction des salles, mesurée

La première mesure de S donnait S7 à 11,1 par collège. Une division seule de son niveau (S en a 3 par niveau) a les
deux groupes de sa barrette, et le second groupe, sans salle attitrée, prenait la première salle ordinaire libre :
celle de la 6e A, sortie à ce moment-là. La 6e A trouvait ensuite sa salle prise. Un groupe sans salle attitrée prend
maintenant d'abord la salle en plus (`src/school/index.js`).

Sur les 30 collèges S, par paires, après − avant : le coût −20,5 (−31,6 à −9,5), S7 passe de 11,1 à 0 ;
l'infaisabilité +0,2 (−0,0 à 0,4), dans le bruit du témoin. Les collèges laissant un cours passent de 0 à 3 : ce sont
d'autres égalités tirées. Le témoin en laisse 1.

## Ce qu'on en tire

1. **Les barrettes ne gênent pas R0** : sur les collèges de J2, il laisse un cours sur 5 collèges sur 90, contre 9
   sur 90 en J1. Une barrette a moins d'options qu'un cours seul ; R0, qui place d'abord le plus contraint, la place
   donc tôt. Le contraste avec R0-naïf grandit en M (−47,6 contre −40,3 en J1).
2. **Le coût monte avec le nombre de cours** : +9 % en M (529 contre 487) et L (741 contre 679), −2 % en S (393 contre
   401). Les collèges ne sont pas les mêmes qu'en J1 : ce n'est pas une mesure par paires. Les trous des
   professeurs (S2), les disciplines deux fois le même jour (S4) et le lourd après 15 h (S6) font toujours presque
   tout.
3. **Le bruit du témoin a grandi en M** : son coût varie de ±28 (6 % du coût), le même ordre qu'en J1.
4. **R0 va deux fois moins vite** : 6,6 s pour L, contre 3,1 s en J1. Le jour d'une division se lit maintenant moitié
   par moitié, et une barrette se pose et se retire pour chaque créneau essayé. Le banc de J3 dira où passe le temps.
