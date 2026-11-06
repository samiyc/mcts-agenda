# Le modèle d'Agenda : le cadrage (6/11/2026)

Les emplois du temps d'un collège : placer chaque heure de cours de chaque classe dans la semaine, avec son professeur
et une salle, sous des contraintes dures et souples. Puis, quand un professeur manque, la veille ou le matin même,
refaire le moins possible pour perdre le moins d'heures. Ce document fixe ce qu'on va construire et comment on saura
que ça marche. **Il n'y a encore ni modèle ni recherche dans `src/`.**

Les chiffres viennent de [`recherche/sources.md`](recherche/sources.md) (les sources, et jusqu'où chacune a été lue).
Une valeur marquée **H** est une hypothèse, avec sa question dans [`recherche/questions.md`](recherche/questions.md) :
`Q-Sn` pour Sami, `Q-Pn` pour un professionnel. Les mots du métier sont dans
[`recherche/glossaire.md`](recherche/glossaire.md).

## 1. Ce que la recherche a déjà changé

1. **Le banc public le plus proche d'un collège n'est pas ITC 2019.** ITC 2019 est un problème d'**université** : des
   cours découpés en sections que chaque étudiant choisit, des semaines différentes d'un cours à l'autre, des créneaux
   de 5 minutes et des temps de trajet entre bâtiments. La compétition de **2011** (ITC 2011, le format XHSTT) portait,
   elle, sur les **lycées et collèges** : des classes fixes, des professeurs déjà affectés, une semaine type. C'est
   notre problème. Ses 25 instances de référence viennent de 12 pays, aucune de France. On propose XHSTT d'abord,
   ITC 2019 ensuite (Q-S2).
2. **La valeur est dans le remplacement plus que dans la construction.** Un emploi du temps se construit une fois par
   an, l'été, avec un logiciel que l'éditeur dit installé dans plus de 9 100 collèges et lycées. Les absences, elles,
   coûtent toute l'année : la Cour des comptes compte 9 % des heures de cours perdues dans les collèges publics en
   2023-2024 (10,3 millions d'heures), surtout des absences non remplacées. Celles de moins de 15 jours n'étaient
   remplacées qu'à 20 % en 2018-2019, et deux fois sur trois elles étaient prévues d'avance.
3. **Le remplacement qui dérange le moins a un nom et une littérature** : le *minimal perturbation problem*
   (Müller, Rudová et Barták, 2005, sur les emplois du temps de Purdue). On repart de la solution en place, et on
   compte ce qui change. C'est notre second jalon.
4. **Les programmes sont publics et réglementaires.** Chaque niveau du collège a 26 heures par semaine, réparties par
   discipline par arrêté (la 6e modifiée en 2023, le cycle 4 en 2017). Un collège fictif peut donc être réaliste sans
   aucune donnée réelle.
5. **Le collège français a ses propres formes** : les **barrettes** (plusieurs groupes de classes différentes au même
   créneau : la LV2, le soutien de 6e, les groupes de besoins en 6e et 5e), les **semaines A et B** (les demi-heures
   de la grille), et la pause méridienne d'au moins 1 h 30 pour chaque élève. Aucune n'est propre à un banc public :
   XHSTT les exprime, à sa façon.
6. **La lib donne moins que prévu.** La feuille de route dit `schedule` : à la lecture, il ordonne des jobs sur des
   fils (la règle de Smith, les prérequis, les échéances). Il n'y a rien à y prendre pour placer des cours dans une
   semaine. On en garde la forme : une fonction pure qui dit **pourquoi** un élément ne peut pas partir (§ 9).

## 2. Ce qui se passe

**L'établissement** est un collège public fictif, tiré par graine. Au départ (**H**, Q-S1) :

| Taille | Divisions | Élèves | Professeurs (environ) | Salles ordinaires | Salles spécialisées |
|---|---|---|---|---|---|
| S | 12 (3 par niveau) | 330 | 22 | 13 | 5 |
| M | 16 (4 par niveau) | 440 | 28 | 17 | 6 |
| L | 24 (6 par niveau) | 660 | 42 | 25 | 8 |

Les effectifs sont tirés de 24 à 30 élèves par division (**H**). Le nombre de professeurs suit des heures à couvrir
(§ 2.3) ; les salles spécialisées sont les laboratoires de SVT et de physique-chimie, la technologie, les arts
plastiques, la musique, une salle informatique et le gymnase.

### 2.1 La semaine

- **Deux semaines, A et B**, pour les demi-heures de la grille (4,5 h de français : 4 h chaque semaine, plus 1 h en
  semaine A seulement, ou l'inverse). Un cours a ses semaines : `AB` (presque tous), `A` ou `B`. C'est le même geste
  que les semaines en bits d'ITC 2019, réduit à deux.
- **Les créneaux** d'une heure, de 8 h à 17 h, soit 9 par jour, le lundi, le mardi, le jeudi et le vendredi, et 4 le
  mercredi matin : 40 créneaux par semaine, 80 sur A et B (**H**, Q-P6). Le mercredi après-midi est libre (**H**).
- **La pause méridienne** : chaque division a au moins deux créneaux libres consécutifs entre 11 h et 14 h, soit
  2 h, plus que les 1 h 30 du texte. Avec des créneaux d'une heure, 1 h 30 se lit ainsi (**H**, Q-P6).
- **Ni vie de classe ni accompagnement aux devoirs** au départ : les 10 heures annuelles de vie de classe se placent
  à la main en pratique (**H**).

### 2.2 Les programmes

La grille de chaque niveau (lue dans les textes, `sources.md` § 1) :

| Discipline | 6e (2023) | 5e | 4e | 3e |
|---|---|---|---|---|
| Français | 4,5 | 4,5 | 4,5 | 4 |
| Mathématiques | 4,5 | 3,5 | 3,5 | 3,5 |
| Langue vivante 1 | 4 | 3 | 3 | 3 |
| Langue vivante 2 | – | 2,5 | 2,5 | 2,5 |
| Histoire-géographie, EMC | 3 | 3 | 3 | 3,5 |
| SVT | 3 (SVT, physique-chimie) | 1,5 | 1,5 | 1,5 |
| Physique-chimie | (ci-dessus) | 1,5 | 1,5 | 1,5 |
| Technologie | – (retirée en 2023) | 1,5 | 1,5 | 1,5 |
| Arts plastiques | 1 | 1 | 1 | 1 |
| Éducation musicale | 1 | 1 | 1 | 1 |
| EPS | 4 | 3 | 3 | 3 |
| Soutien ou approfondissement (français ou maths) | 1 | – | – | – |
| **Total** | **26** | **26** | **26** | **26** |

Le cycle 4 compte 4 heures d'enseignements complémentaires (EPI, accompagnement personnalisé) **dans** ses 26 heures :
elles sont portées par les disciplines. L'établissement peut moduler la répartition d'une année à l'autre du cycle,
tant que le total du cycle est tenu : on ne module pas au départ. **À vérifier** : la grille de la rentrée 2026 (les
groupes de besoins de 2025 changent l'organisation du français et des maths en 6e et 5e, peut-être pas les volumes ;
Q-P9).

### 2.3 Les professeurs

- **Le service** : 18 heures pour un certifié, 15 pour un agrégé, et une heure supplémentaire qu'on peut imposer
  (décret de 2014). Un professeur a une discipline, son service, et peut le compléter dans un autre établissement :
  il est alors indisponible un ou deux jours (**H**, une part de 15 % des professeurs).
- **Les classes de chaque professeur sont données** : en France, la répartition des services (le TRS) est arrêtée
  avant l'emploi du temps. Le modèle reçoit donc, pour chaque division, qui enseigne quoi, comme les événements
  d'XHSTT avec leur professeur. Optimiser cette répartition reste hors du modèle (§ 12).
- **Les vœux** : un professeur peut demander une demi-journée libre, ou pas de cours à 8 h (**H**, Q-P3). Un vœu est
  une contrainte souple.

Les heures à couvrir dans le collège M : 16 divisions × 26 h, soit 416 heures-classe par semaine. La LV2 se fait en
barrette sur deux divisions, en deux langues, ce qui garde le même nombre de groupes que de divisions. 416 h sur des
services de 15 à 18 h font environ 24 professeurs pleins, 28 avec les services partiels (**H**).

### 2.4 Les cours

Un **cours** est l'unité qu'on place : une division (ou un groupe), une discipline, un professeur, une durée (1 ou
2 créneaux), ses semaines (`AB`, `A`, `B`) et le type de salle qu'il demande. On lui choisit un créneau de départ et
une salle. Le collège M en a environ 400 (**H**).

- **L'EPS en blocs de 2 heures** (Sami, 6/11 : « le sport est sur 2 h une fois par semaine, à vérifier » ; vérifié
  dans `sources.md` § 2) : **au cycle 4, un bloc de 2 h et une heure seule**, un autre jour ; **en 6e, deux blocs de
  2 h**, car les 4 h ne tiennent pas en un seul bloc (trois heures d'affilée sont réservées aux activités de pleine
  nature). Les deux séances d'une division sont espacées d'au moins 24 h (S8). Un TP de sciences reste en heures
  simples (**H**, Q-P4). Un bloc ne traverse pas la pause méridienne.
- **Les barrettes**, au jalon J2 : la LV2 (deux divisions, deux groupes, deux professeurs, au même créneau) et l'heure
  de soutien de 6e (toutes les 6e au même créneau, en groupes recomposés chaque trimestre).
- **Les demi-groupes** (une division coupée en deux pour un TP), au jalon J2.

## 3. Les contraintes

Un emploi du temps a deux coûts, comme dans XHSTT : **l'infaisabilité** (la somme des contraintes dures violées) et
**le coût** (la somme pondérée des souples). On compare d'abord l'infaisabilité, puis le coût.

### 3.1 Les dures

| # | La contrainte | Source |
|---|---|---|
| D1 | chaque cours est placé, toutes ses heures | la grille (§ 2.2) |
| D2 | ni un professeur, ni une division, ni une salle à deux endroits à la fois, semaine par semaine | évident |
| D3 | la salle a le bon type et assez de places | **H** |
| D4 | les indisponibilités : le complément de service ailleurs, le gymnase pris par la commune | **H**, Q-P4 |
| D5 | la pause méridienne de chaque division (§ 2.1) | le décret de 2016, lu en résumé |
| D6 | en 6e, 6 heures de cours au plus par jour | le ministère, lu en résumé |
| D7 | rien le mercredi après-midi | **H** |
| D8 | un bloc de 2 h est d'un seul tenant, dans une demi-journée | l'usage, l'EPS lue en résumé (`sources.md` § 2) |
| D9 | les groupes d'une barrette au même créneau (J2) | l'usage, **H** |

### 3.2 Les souples

Les poids sont des hypothèses, à faire relire (Q-P1, Q-P2).

| # | La contrainte | Poids **H** | Ce qu'on compte |
|---|---|---|---|
| S1 | les trous d'une division | 10 | une heure libre entre deux cours d'une même demi-journée : des élèves en permanence |
| S2 | les trous d'un professeur | 3 | une heure libre entre deux cours d'une même journée, hors pause |
| S3 | un vœu non tenu | 5 | par vœu |
| S4 | une discipline deux fois le même jour, hors bloc | 4 | par jour et par discipline |
| S5 | en cycle 4, plus de 7 heures dans une journée | 10 | par heure de trop |
| S6 | une discipline lourde (français, maths, LV1) après 15 h | 1 | par cours |
| S7 | une division hors de sa salle attitrée, quand le cours ne demande pas de salle spécialisée | 1 | par cours |
| S8 | deux séances d'EPS d'une division à moins de 24 h l'une de l'autre (le même jour, ou le lendemain plus tôt) | 3 | par paire |

## 4. Les absences et le replanning

Le jalon J5. Un emploi du temps est en place ; un **scénario d'absences** tiré par graine dit qui manque, quand, et
quand on l'apprend.

- **Les absences** (**H**, Q-P17) : chaque professeur manque en moyenne un jour par mois. Deux absences sur trois sont
  connues d'avance (une formation, une réunion, une sortie scolaire), une sur trois le matin même (une maladie). Elles
  durent 1 à 3 jours, et leur durée n'est pas toujours connue quand on décide.
- **La veille au soir** (vers 18 h, **H**) : on peut toucher toute la journée du lendemain, et prévenir un collègue.
- **Le matin même** (vers 7 h 30, **H**) : seuls les cours qui n'ont pas commencé bougent, et seuls les professeurs
  déjà au collège ce jour-là peuvent remplacer, sauf un volontaire qui accepte de venir (**H**, Q-P12).

**Ce qu'on peut faire d'un cours sans professeur** (Q-P13) :

1. **Le remplacer** par un collègue libre à ce créneau : de la même discipline d'abord, sinon de l'équipe de la
   classe. C'est une heure supplémentaire pour lui. Le décret de 2023 demande d'abord des volontaires (le Pacte).
2. **Échanger** : avancer dans le trou le cours d'un professeur présent pour la même division, si son professeur et
   une salle sont libres. L'heure perdue glisse vers la fin de journée, ou disparaît si l'absent rattrape plus tard.
3. **Une étude** : la classe en permanence, sous la surveillance de la vie scolaire, dans la limite de ses
   surveillants (**H**, deux études à la fois).
4. **Libérer les élèves**, en fin de journée seulement, avec l'autorisation des familles (**H**).

**Les limites** (lues en résumé, à vérifier, Q-P15) : un professeur désigné sans être volontaire est prévenu 24 h
avant, et ne fait pas plus de 5 heures supplémentaires dans une semaine.

**Le score d'un replanning**, dans cet ordre (Q-S4) :
1. **Les heures perdues** : les heures de cours d'une division que personne n'a enseignées (une étude ou une sortie) ;
2. **le dérangement** : le nombre de cours changés (de créneau, de professeur ou de salle), la mesure de Müller et
   al. ; on rapporte aussi les personnes dont la journée change (élèves et professeurs), et un changement fait la
   veille compte moitié moins qu'un changement du matin (**H**, Q-P16) ;
3. **le coût souple** du nouvel emploi du temps (§ 3.2) ;
4. **l'équité** : les heures de remplacement réparties entre les volontaires.

## 5. La règle simple à battre

### 5.1 Construire : le glouton du plus contraint d'abord (R0)

Le remplissage glouton classique des emplois du temps, qui vient de la coloration de graphes (le degré de saturation
de Brélaz, 1979) :

1. Pour chaque cours non placé, compter ses **options** : les couples (créneau, salle) qui ne violent aucune contrainte
   dure avec ce qui est déjà placé.
2. Prendre le cours qui en a **le moins**. À égalité : le plus long (les blocs), puis celui du professeur le plus
   chargé, puis l'ordre du fichier.
3. Le placer sur l'option qui ajoute **le moins de coût souple**. À égalité, le tirage de la graine.
4. Un cours sans option reste **non placé** : il compte dans l'infaisabilité. Aucun retour arrière.

R0 est déterministe pour une graine. Un plancher sous lui, **R0-naïf** (l'ordre du fichier, la première option
libre), montre que R0 n'est pas trivial à battre.

### 5.2 Replanifier : le glouton du remplacement (P1)

- **P0, le statu quo** : chaque cours sans professeur devient une étude. C'est ce qui arrive le plus souvent : 80 %
  des heures d'absences courtes n'étaient pas remplacées en 2018-2019.
- **P1** : les cours sans professeur, dans l'ordre du temps. Pour chacun : un collègue volontaire de la même
  discipline, libre, qui a fait le moins d'heures de remplacement cette semaine ; sinon un collègue de l'équipe de la
  classe ; sinon l'échange qui ne crée aucune violation dure et ajoute le moins de coût ; sinon une étude. P1 ne touche
  qu'au jour de l'absence.

Une recherche de replanning doit battre **P1**, pas seulement P0.

## 6. Les mesures

### 6.1 Les instances

- **Les collèges** : `S`, `M`, `L` (§ 2), 30 graines chacun au départ (**H**, Q-S5). Une graine fait un collège : ses
  divisions, ses professeurs, leurs vœux et leurs indisponibilités, ses salles.
- **Les scénarios d'absences** : pour chaque collège, 30 semaines tirées par graine, sur l'emploi du temps que R0 a
  construit (le même pour toutes les règles comparées).
- **Les graines sont disjointes** entre les écrémages, les mesures et les reprises (la pratique de codingame).

### 6.2 Ce qu'on mesure

| Problème | Le premier chiffre | Les suivants |
|---|---|---|
| Construire | les heures non placées (l'infaisabilité) | le coût souple, par contrainte ; le temps |
| Replanifier | les heures perdues sur la semaine | les cours changés, les personnes dérangées, le coût souple, le temps |

### 6.3 Par paires, avec l'intervalle

- **Les deux règles jouent les mêmes instances** ; l'échantillon est l'écart A − B par instance. `paired` de la lib en
  donne la moyenne et l'intervalle à 95 %. Une recherche est retenue si **la borne haute de l'écart reste sous zéro**
  (elle coûte moins, sûrement), sur l'infaisabilité d'abord, puis sur le coût.
- **`sprt`** arrête une série tranchée (`h0: 0`, `h1` le plus petit gain qui vaille, Q-S3) ; le résultat se rapporte
  quand même avec `paired`.
- **Un écrémage rapide rejette, il ne promeut jamais** ; un résultat qui passe juste se remesure sur des graines
  neuves ; un témoin A/A (R0 contre R0, deux graines de tirage) vérifie l'arène ; l'ablation retire un réglage à la
  fois.
- **Le budget de temps** est fixe et le même pour tous (**H**, Q-S6) : 60 s pour construire le collège M, 60 s pour
  replanifier la veille, 10 s le matin.

### 6.4 Se comparer à du public

| Banc | Ce que c'est | Ce qu'on en fait |
|---|---|---|
| **XHSTT-2014** (ITC 2011) | 25 instances de lycées et collèges de 12 pays ; un évaluateur en ligne (HSEval) ; les meilleures solutions connues et leurs bornes publiées | le premier banc : notre coût contre le meilleur connu, aux règles du tour 2 d'ITC 2011 (1 000 s par instance, 10 graines, le rang moyen) |
| **ITC 2019** | 30 instances d'universités, 10 établissements ; 19 types de contraintes de distribution ; un validateur en ligne | ensuite, et seulement si on passe au lycée (Q-S2) : son modèle est plus large que le nôtre |

**Avant de comparer** : un évaluateur ne se croit qu'une fois rejoué à l'identique (la leçon des moteurs de
codingame). Le nôtre doit redonner, au point près, le coût publié de solutions connues d'XHSTT avant qu'on mesure quoi
que ce soit dessus. **On ne vise pas le premier rang** : GOAL a gagné les tours 2 et 3 d'ITC 2011, et un MIP de
Gurobi tient 24 h sur certaines instances d'ITC 2019 sans trouver de solution. On vise une place honnête, mesurée.

## 7. La recherche, plus tard

Rien de tout cela n'est écrit avant que R0 et P1 soient mesurés.

- **Construire** : la recherche taboue et le recuit simulé, les deux références de la littérature. Les mouvements :
  déplacer un cours, échanger deux cours, et les **chaînes de Kempe** (échanger deux créneaux pour tout un groupe de
  cours en conflit). Le faisceau de la lib (`createBeam`) sur les choix de R0 est l'essai le moins cher.
- **Replanifier** : la même recherche locale, partie de l'emploi du temps en place, avec le dérangement dans le coût.
- **L'ISMCTS de la lib**, pour la durée inconnue d'une absence : décider aujourd'hui sans savoir si le professeur
  reviendra demain. Chaque itération tire une durée ; les mondes communs comparent deux remplacements sur les mêmes
  durées. C'est là que la lib sert vraiment ce projet.

## 8. Les jalons

| Jalon | Ce qu'il livre | Mesuré par |
|---|---|---|
| **J1** | les types (`src/types.js`), le générateur de collège par graine, l'évaluateur (dures et souples, pur, testé), R0-naïf et R0 ; les empreintes | R0 contre R0-naïf, par paires, sur S, M, L |
| **J2** | les semaines A et B en vrai, les barrettes, les demi-groupes ; la page (la grille d'une division, d'un professeur, d'une salle) | R0 sur les nouveaux collèges |
| **J3** | le tabou et le recuit ; le banc (`npm run bench`) | contre R0, par paires |
| **J4** | la lecture d'XHSTT, l'évaluateur rejoué contre HSEval sur des solutions publiées | l'écart de coût, nul attendu |
| **J5** | les absences : P0, P1, puis la recherche locale | contre P1, par paires |
| **J6** | l'ISMCTS sur les durées inconnues ; peut-être ITC 2019 | contre J5 |

Les questions au professionnel ont du sens à partir de J2, la page montrée.

## 9. Ce qu'on prend de la lib, et d'ailleurs

| Module | Pour quoi | Quand |
|---|---|---|
| `random` (`createRng`, `streamOf`) | les collèges, les scénarios et les tirages de la recherche, par graine | J1 |
| `measure` (`paired`, `wilson`, `sprt`) | les comparaisons par paires et l'arrêt des séries | J1 |
| `schedule` | **la forme seulement** : comme `holdOf`, l'évaluateur dit pourquoi un cours n'a pas d'option (le professeur, la division, la salle, la pause) | J1 |
| `beam` (`createBeam`) | un faisceau sur les choix de R0 | J3, à l'essai |
| `mcts` (`search`, mondes communs) | le replanning sous une durée d'absence inconnue | J6 |
| `web/theme.css`, `replay-keys.js` | la page, en sépia (le Khaki de Notepad++), et le lecteur d'une semaine de remplacements | J2, J5 |
| `climb` | rien : ses gènes sont des nombres continus, nos mouvements sont discrets | – |
| `events` | rien au départ : la semaine se décide créneau par créneau, sans simulation | – |

**Ce qui pourrait entrer dans la lib** : la recherche taboue ou le recuit, si un second projet en a besoin (les
protéines, peut-être) ; algorithmes.md les note « non, personne » à ce jour.

**D'ailleurs** : un petit lecteur XML, pur et testé, pour XHSTT et ITC 2019, sans dépendance (le même code dans la
page et sous Node).

## 10. La page

Au jalon J2, `npm run page` sur le port 4805, `web/theme.css` d'abord, en sépia.

- **La grille de la semaine**, pour une division, un professeur ou une salle, A et B côte à côte ; un cours non placé
  ou une contrainte violée en rouge, avec sa raison.
- **Les coûts**, par contrainte, de R0 et de la recherche, côte à côte.
- **Un remplacement** (J5) : la journée avant et après, ce qui a changé en couleur, et le lecteur pour suivre la
  semaine d'absences.

## 11. Ce qui est décidé, et ce qui reste à Sami

**Validé par Sami le 6/11** (les quatre décisions prises sans lui) :
- la répartition des services donnée, pas optimisée ;
- des créneaux d'une heure et deux semaines A et B ;
- R0 au degré de saturation, et P1 qui ne touche qu'au jour de l'absence ;
- `schedule` pris pour sa forme seulement.

Il y ajoute l'EPS en un bloc de 2 h par semaine, à vérifier : c'est le cas au cycle 4, pas en 6e (§ 2.4).

Encore proposé, en attendant sa réponse : un **collège** public fictif, pas un lycée (Q-S1 ; les choix d'options du
lycée en font un autre problème, celui d'ITC 2019).

Les questions, chacune avec sa recommandation : [`recherche/questions.md`](recherche/questions.md).

## 12. Ce qui est laissé de côté, et les risques

- **Le lycée** : les spécialités et les options choisies par chaque élève (le *student sectioning* d'ITC 2019).
- **La répartition des services** (qui enseigne à quelle classe) et la **dotation horaire** (la DHG) : décidées avant
  l'emploi du temps, hors du modèle.
- **La cantine** (plusieurs services, une capacité), **les cars scolaires** (l'heure de fin imposée dans un collège
  rural), **les installations sportives** partagées avec la commune au-delà d'une indisponibilité : à demander
  (Q-P10).
- **Les sorties et voyages scolaires**, qui libèrent les professeurs d'une classe partie : une ressource de
  remplacement, plus tard.
- **Les risques** : des poids souples inventés (le professionnel les corrigera, et les mesures avant et après iront
  dans le commit) ; un remplacement réel qui dépend des personnes plus que des créneaux (qui accepte, qui est fâché) ;
  et un banc public où l'on restera loin des meilleurs, ce qu'il faudra dire tel quel.
