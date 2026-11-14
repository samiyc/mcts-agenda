# Le modèle d'Agenda : le cadrage (6/11/2026)

Les emplois du temps d'un collège : placer chaque heure de cours de chaque classe dans la semaine, avec son professeur
et une salle, sous des contraintes dures et souples. Puis, quand un professeur manque, la veille ou le matin même,
refaire le moins possible pour perdre le moins d'heures. Ce document fixe ce qu'on va construire et comment on saura
que ça marche. Le modèle est dans `src/` depuis J1, les barrettes et les demi-groupes depuis J2, la recherche locale
depuis J3.

Les chiffres viennent de [`recherche/sources.md`](recherche/sources.md) (les sources, et jusqu'où chacune a été lue).
Une valeur marquée **H** est une hypothèse, avec sa question dans [`recherche/questions.md`](recherche/questions.md) :
`Q-Sn` pour Sami, `Q-Pn` pour un professionnel. Les mots du métier sont dans
[`recherche/glossaire.md`](recherche/glossaire.md).

## 1. Ce que la recherche a déjà changé

1. **Le banc public le plus proche d'un collège n'est pas ITC 2019.** ITC 2019 est un problème d'**université** : des
   cours découpés en sections que chaque étudiant choisit, des semaines différentes d'un cours à l'autre, des créneaux
   de 5 minutes et des temps de trajet entre bâtiments. La compétition de **2011** (ITC 2011, le format XHSTT) portait,
   elle, sur les **lycées et collèges** : des classes fixes, des professeurs déjà affectés, une semaine type. C'est
   notre problème. Ses 25 instances de référence viennent de 12 pays, aucune de France. XHSTT-2014 est le banc
   (validé par Sami le 13/11, Q-S2) ; ITC 2019 seulement si le lycée vient.
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

| Taille | Divisions | Élèves (environ) | Professeurs (graine 1) | Cours (barrettes) | Salles ordinaires | Salles spécialisées (graine 1) |
|---|---|---|---|---|---|---|
| S | 12 (3 par niveau) | 330 | 25 | 364 (308) | 13 | 9 |
| M | 16 (4 par niveau) | 440 | 29 | 472 (404) | 17 | 10 |
| L | 24 (6 par niveau) | 660 | 44 | 708 (606) | 25 | 16 |

Les effectifs sont tirés de 24 à 30 élèves par division (**H**). Le nombre de professeurs suit des heures à couvrir
(§ 2.3). Les salles spécialisées sont les laboratoires de SVT et de physique-chimie, la technologie, les arts
plastiques, la musique et le gymnase (un « gymnase » est un espace qui reçoit une division) ; leur nombre suit les
heures de la semaine la plus chargée, la salle occupée la moitié de la semaine au plus (**H**). Le collège M de la
graine 1 a 3 gymnases, 2 laboratoires de chaque sorte et une salle de chacune des autres. Pas de salle informatique au
départ : aucune discipline de la grille ne la demande.

### 2.1 La semaine

- **Deux semaines, A et B**, pour les demi-heures de la grille (4,5 h de français : 4 h chaque semaine, plus 1 h en
  semaine A seulement, ou l'inverse). Un cours a ses semaines : `AB` (presque tous), `A` ou `B`. C'est le même geste
  que les semaines en bits d'ITC 2019, réduit à deux.
- **Les créneaux** d'une heure, de 8 h à 17 h, soit 9 par jour, le lundi, le mardi, le jeudi et le vendredi, et 4 le
  mercredi matin : 40 créneaux par semaine, 80 sur A et B (**H**, Q-P6). Le mercredi après-midi est libre (**H**).
- **La pause méridienne** : chaque division a au moins deux créneaux libres consécutifs entre 11 h et 14 h, soit
  2 h, plus que les 1 h 30 du texte. Avec des créneaux d'une heure, 1 h 30 se lit ainsi (**H**, Q-P6). Conséquence
  vue en écrivant J1 : **le créneau de midi est toujours libre** pour toutes les divisions (deux créneaux libres de
  suite parmi 11 h, 12 h et 13 h le contiennent forcément) ; la journée a donc 8 créneaux utiles, 4 le mercredi.
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

Les heures à couvrir dans le collège M : 16 divisions × 26 h, soit 416 heures-classe par semaine. La LV2 et le soutien
se font en barrette sur deux divisions, en deux groupes, ce qui garde le même nombre de groupes que de divisions ; les
demi-groupes de sciences ajoutent une heure de professeur par division (§ 2.4). 432 h sur des services de 15 à 18 h
font environ 25 professeurs pleins ; la graine 1 en a 29, avec les services partiels (**H**).

### 2.4 Les cours

Un **cours** est l'unité qu'on place : des élèves (une division entière, la moitié d'une division, ou un groupe pris
sur deux divisions), une discipline, un professeur, une durée (1 ou 2 créneaux), ses semaines (`AB`, `A`, `B`) et
le type de salle qu'il demande. On lui choisit un créneau de départ et une salle. Une **barrette** lie des cours qui
partent au même créneau (D9) ; un cours seul est une barrette d'un cours. Le collège M a 472 cours en 404 barrettes
(§ 2). Le code : `src/school/courses.js`.

- **L'EPS en blocs de 2 heures** (Sami, 6/11 : « plutôt deux fois 2 h, à ajuster plus tard si besoin ») : **deux blocs
  de 2 h** à tous les niveaux. En 6e (4 h), les deux chaque semaine ; au cycle 4 (3 h), l'un chaque semaine, l'autre
  une semaine sur deux, A ou B. Les textes d'académie lus donnent plutôt 2 h et 1 h au cycle 4 (`sources.md` § 2) ;
  c'est le choix de Sami qui compte. Les deux séances d'une division sont espacées d'au moins 24 h (S8). Un bloc ne
  traverse pas la pause méridienne.
- **Les barrettes de LV2 et de soutien, par paires de divisions** (**H**, Q-P9). Les divisions d'un niveau vont deux
  par deux, dans l'ordre ; la dernière reste seule quand leur nombre est impair (le collège S en a 3 par niveau). Une
  paire a deux groupes au même créneau, chacun fait d'une moitié de chaque division : en LV2 (cycle 4) un groupe
  d'espagnol et un d'allemand ; en soutien (6e) un groupe de français, pris par le professeur de français de la
  première division, et un de maths, pris par le professeur de maths de la seconde. Une division seule a les deux
  groupes pour elle, et le second prend une autre salle ordinaire.
  Le cadrage disait le soutien « sur toutes les 6e au même créneau ». Cela demande autant de professeurs libres à la
  même heure que de groupes. Le collège L en voudrait 6, et ses 6e n'ont que 4 professeurs de français et de maths.
- **Les demi-groupes, sur les semaines A et B pour de vrai** (**H**, Q-P4) : la demi-heure impaire de SVT et celle de
  physique-chimie (1,5 h chacune à tous les niveaux) deviennent une heure en demi-groupe. En semaine A, la première
  moitié de la division fait de la SVT pendant que la seconde fait de la physique-chimie ; en semaine B, c'est
  l'inverse. Ces quatre cours forment une barrette. Chaque élève garde ses 1,5 h, et chaque professeur donne 2 h par
  division au lieu de 1,5. La technologie garde son heure d'une semaine sur deux en classe entière.
- **Le jour d'une division se lit moitié par moitié** : la pause, les 6 h de la 6e, les trous, une discipline deux
  fois, la journée longue (D5, D6, S1, S4, S5) se comptent pour chaque moitié, et le jour compte la pire. Sans
  demi-groupe, les deux moitiés sont identiques et rien ne change par rapport à J1.

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
| D9 | les cours d'une barrette au même créneau (compté : ceux qui ne partent pas avec le premier placé) | l'usage, **H** |

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
  durent 1 à 3 jours, et leur durée n'est pas toujours connue quand on décide. À J5, elle l'est dès que l'absence
  l'est. **À J6** (**H**, Q-P17) : une absence prévue vient avec sa durée (une formation a ses dates) ; une maladie
  sur deux aussi (l'arrêt dit jusqu'à quand), l'autre s'apprend jour après jour, chaque jour de plus la veille au
  soir (le professeur appelle avant 18 h), et la fin la veille du jour où il revient. Variantes : le jour de plus
  appris le matin seulement, toutes les maladies apprises jour après jour. Le code : `src/absence/scenario.js`,
  `run.js`.
- **Les volontaires** (**H**, Q-P14) : un professeur sur cinq. Le Pacte paie le remplacement court jusqu'à 18 heures
  par an, une demi-heure par semaine : chaque semaine, un volontaire sur quatre peut donner 2 heures, les autres
  rien. P1 remplace alors 10 à 30 % des heures perdues, l'ordre des taux publiés : 13 % en 2024-2025, 13 à 19 % en
  collège (`recherche/sources.md` § 4). Avec 5 heures par semaine pour chaque volontaire, P1 en remplaçait 85 %.
- **La veille au soir** (vers 18 h, **H**) : on peut toucher toute la journée du lendemain, et prévenir un collègue.
- **Le matin même** (vers 7 h 30, **H**) : seuls les cours qui n'ont pas commencé bougent, et seuls les professeurs
  déjà au collège ce jour-là peuvent remplacer, sauf un volontaire qui accepte de venir (**H**, Q-P12).

**Ce qu'on peut faire d'un cours sans professeur** (Q-P13) :

1. **Le remplacer** par un collègue libre à ce créneau : de la même discipline d'abord, sinon de l'équipe de la
   classe. C'est une heure supplémentaire pour lui. Le décret de 2023 demande d'abord des volontaires (le Pacte).
2. **Échanger** : avancer dans le trou le cours d'un professeur présent pour la même division, si son professeur et
   une salle sont libres. L'heure perdue glisse vers la fin de journée, ou disparaît si l'absent rattrape plus tard.
   **Rattraper** : déplacer le cours perdu à un autre créneau de la semaine où son professeur est revenu, ses élèves
   et une salle libres, la pause et les 6 h de la 6e tenues. C'est le seul échange qui sauve l'heure.
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
  discipline, libre, qui a fait le moins d'heures de remplacement cette semaine ; sinon un volontaire de l'équipe de la
  classe ; sinon une étude. P1 ne touche qu'au jour de l'absence. Le code : `src/absence/rules.js`.
- **L'échange retiré de P1** (J5) : avancer un autre cours dans le trou ne sauve aucune heure, il déplace le trou et
  ajoute un changement ; sous notre score, P1 ne le choisirait jamais. Le rattrapage, qui sauve l'heure, touche
  d'autres jours que celui de l'absence : c'est un mouvement de la recherche.
- **Le matin**, seuls les volontaires déjà au collège ce jour-là remplacent (**H**, la lecture stricte de Q-P12).

Une recherche de replanning doit battre **P1**, pas seulement P0. Le coût souple (le 3e critère du score) est
compté depuis le 10/11 (`src/absence/soft.js`) : la recherche ajoute à sa valeur 0,01 fois le coût souple de la
semaine, cent points valant un cours changé (**H**, Q-P16) ; il retire la moitié de ce que les rattrapages coûtaient
aux journées, sans perdre d'heures ([`mesures-j5.md`](mesures-j5.md)).

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
codingame). Le nôtre doit redonner, au point près, le coût publié de solutions connues d'XHSTT (fait à J4 : 150
solutions sur 152, [`mesures-j4.md`](mesures-j4.md)) avant qu'on mesure quoi
que ce soit dessus. **On ne vise pas le premier rang** : GOAL a gagné les tours 2 et 3 d'ITC 2011, et un MIP de
Gurobi tient 24 h sur certaines instances d'ITC 2019 sans trouver de solution. On vise une place honnête, mesurée.

## 7. La recherche

**Construire** (J3, `src/search/`) : une recherche locale qui part de l'emploi du temps de R0.

- **Les mouvements** : déplacer une barrette vers un autre créneau, ou échanger les créneaux de deux barrettes qui
  partagent une division ou un professeur. Une barrette ne va que là où `tryLink` l'accepte : aucun mouvement ne
  casse une contrainte dure. Une barrette laissée par R0 est réessayée en route ; la placer passe avant tout coût.
- **Le prix d'un mouvement** se lit sur les seuls jours qu'il touche (`linkDelta`, celui de R0) ; la somme des prix
  égale le coût de l'évaluateur, au point près (`tests/search.test.js`).
- **Le recuit simulé** : un mouvement tiré à chaque pas, un échange une fois sur deux ; un mouvement qui coûte `d` de
  plus passe avec la probabilité exp(−d / T), T tombant de 3 à 0,3 (réglé, [`mesures-j3.md`](mesures-j3.md)).
- **Le tabou**, comme Di Gaspero et Schaerf : à chaque pas, 20 barrettes tirées, chacune essayée sur tous les
  créneaux et dans 4 échanges ; le meilleur mouvement est fait, même s'il coûte. Une barrette ne revient pas au créneau
  qu'elle quitte avant 60 à 120 pas, sauf pour battre le meilleur emploi du temps vu (réglé, même source).
- **Le budget** se compte en créneaux essayés, pour qu'une recherche se rejoue de sa graine ; le banc
  (`npm run bench`) le convertit en temps : environ 140 essais par milliseconde pour le recuit, 580 pour le tabou,
  dont un essai coûte moins (une barrette levée sert pour tous ses créneaux).
- **Le témoin à temps égal** : **R0 répété**, R0 relancé avec d'autres graines d'égalités pendant le même temps, le
  meilleur gardé. C'est la règle simple avec le budget de la recherche.

Pas encore essayés : les **chaînes de Kempe** (échanger deux créneaux pour tout un groupe de cours en conflit) et le
faisceau de la lib (`createBeam`) sur les choix de R0.

**Replanifier** (J5) : la même recherche locale, partie de l'emploi du temps en place, avec le dérangement dans le
coût.

**Sous une durée inconnue** (J6) : décider aujourd'hui sans savoir si le professeur reviendra demain. D'abord les
règles simples, trois **croyances** de la même recherche (`src/absence/belief.js`) : une heure perdue compte par la
probabilité que son professeur manque ce jour-là ; **known**, celle de J5, le croit revenu le lendemain ; **worst**,
absent jusqu'au troisième jour ; **odds**, la probabilité que donne le scénario (une absence de 1 à 3 jours au hasard,
déjà là depuis `k` jours : 2/3 qu'elle dure un jour de plus après le premier, 1/2 après le deuxième). Sous worst et
odds, la recherche peut aussi remplacer d'avance un cours dont le professeur manquera peut-être. **L'ISMCTS de la lib**
ne vient qu'ensuite, et seulement s'il reste à gagner entre ces règles et la recherche qui connaît les durées. Mesuré
le 14/11 ([`mesures-j6.md`](mesures-j6.md)) : ne pas savoir coûte 0,03 à 0,05 h par semaine (0,2 h au pire cas), odds
le rattrape en heures au prix de séances déplacées d'avance ; l'ISMCTS n'est pas construit.

## 8. Les jalons

| Jalon | Ce qu'il livre | Mesuré par |
|---|---|---|
| **J1** (fait le 6/11) | les types (`src/types.js`), le générateur de collège par graine, l'évaluateur (dures et souples, pur, testé), R0-naïf et R0 ; les empreintes | R0 contre R0-naïf, par paires, sur S, M, L : [`mesures-j1.md`](mesures-j1.md) |
| **J2** (fait le 6/11) | les semaines A et B en vrai, les barrettes, les demi-groupes ; la page (la grille d'une division, d'un professeur, d'une salle) | R0 sur les nouveaux collèges : [`mesures-j2.md`](mesures-j2.md) |
| **J3** (fait le 9/11) | le recuit et le tabou depuis R0 ; le banc (`npm run bench`) ; la page lance la recherche | contre R0 et R0 répété, par paires, à temps égal : [`mesures-j3.md`](mesures-j3.md) |
| **J4** (fait le 9/11) | la lecture d'XHSTT (`src/xhstt/`), l'évaluateur rejoué contre HSEval sur des solutions publiées | 150 solutions sur 152 au coût publié : [`mesures-j4.md`](mesures-j4.md) |
| **J5** (fait le 10/11) | les absences : P0, P1, puis la recherche locale (`src/absence/`) ; la page des remplacements | contre P1, par paires : [`mesures-j5.md`](mesures-j5.md) ; le coût souple compté |
| **J6** (mesuré le 14/11) | les durées apprises jour après jour (`hidden`) ; trois croyances de la recherche ; les annonces comptées ; pas d'ISMCTS : il n'y a presque rien à gagner | contre J5 (la croyance known) et contre les durées connues, par paires : [`mesures-j6.md`](mesures-j6.md) |
| **J7** (en cours, 14/11) | le banc XHSTT-2014 : un solveur pour ses instances (`src/xhstt/`, § 13), la règle simple puis le recuit | contre la règle simple par paires, et contre le meilleur connu de chaque instance, au budget d'ITC 2011 |

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

**D'ailleurs** (fait à J4, `src/xhstt/xml.js`) : un petit lecteur XML, pur et testé, pour XHSTT et ITC 2019, sans
dépendance (le même code dans la page et sous Node).

## 10. La page

Depuis J2, `npm run page` sur le port 4805 (http://127.0.0.1:4805/web/), `web/theme.css` d'abord, en sépia. Ce qu'elle
montre se décide dans `src/view/`, testé ; R0 construit dans un worker.

- **La grille de la semaine**, pour une division, un professeur ou une salle, A et B côte à côte ; les cours non
  placés en rouge, avec leurs raisons (fait). Une contrainte violée marquée dans sa case : avec la recherche.
- **Les coûts**, par contrainte (faits pour R0 et R0-naïf) ; depuis J3, le recuit ou le tabou après la règle, pendant
  2 à 60 s, les coûts de la règle à côté (fait).
- **Un remplacement** (J5, `web/remplacement.html`, fait) : la semaine avant et après, ce qui a changé en couleur, et
  le lecteur pour suivre la semaine d'absences, moment par moment.

## 11. Ce qui est décidé, et ce qui reste à Sami

**Validé par Sami le 6/11** (les quatre décisions prises sans lui) :
- la répartition des services donnée, pas optimisée ;
- des créneaux d'une heure et deux semaines A et B ;
- R0 au degré de saturation, et P1 qui ne touche qu'au jour de l'absence ;
- `schedule` pris pour sa forme seulement.

Il y ajoute l'EPS en deux blocs de 2 h, « à ajuster plus tard si besoin » (§ 2.4).

**Validé par Sami le 13/11** (relayé par la session de mcts-commun) : XHSTT-2014 comme banc public, à la place
d'ITC 2019, qui est universitaire (Q-S2).

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

## 13. Le banc XHSTT (J7)

Le banc public validé par Sami le 13/11 : les 25 instances d'XHSTT-2014, lues dans l'archive de toutes les instances
(`data/xhstt/all`), qui porte les corrections faites depuis 2014 et les solutions publiées. Le meilleur connu de chaque
instance est la plus petite (infaisabilité, objectif) parmi les valeurs de sa page et les solutions de son fichier,
évaluées par le nôtre (J4). Ces instances demandent plus que nos collèges : découper les événements, affecter des
salles (et, en Australie, des professeurs), seize types de contraintes. Le solveur est donc à part (`src/xhstt/`), et
son coût est celui de l'évaluateur, recalculé point par point.

- **La disposition** (`layout.js`) : des **unités**, les événements qu'une LinkEvents requise lie (même durée), coupés
  pareil et placés ensemble ; pour chaque unité, une réserve de **créneaux** (un par morceau possible) ; les
  **domaines**, où un morceau d'une durée peut commencer (dans un jour, là où les PreferTimes requises le permettent
  et où ses ressources fixées ne sont pas indisponibles d'une AvoidUnavailableTimes requise, ou nulle part) ; les **tâches**, une salle ou un professeur à affecter, ses candidats tirés des PreferResources
  requises ; une AvoidSplitAssignments requise fait une seule tâche de tous les morceaux d'un cours.
- **Le premier découpage** (`split.js`) : la partition la moins chère pour les SplitEvents et DistributeSplitEvents,
  et pour les PreferTimes requises (AU-SA-96 interdit les morceaux longs par là, sans SplitEvents) ; puis le moins de
  morceaux. Un événement sans SplitEvents part entier et peut se couper librement, comme le dit le format.
- **« Nulle part » est une option** : ne pas placer un morceau, ou ne pas affecter de salle, coûte son AssignTime ou
  son AssignResource. C'est parfois le moins cher : les meilleures solutions de DK-HG-12 laissent des salles vides
  plutôt que de violer deux listes de salles requises disjointes, à 1 000 chacune.
- **La règle simple** (`greedy.js`) : les morceaux un par un, les plus contraints d'abord, chacun au moins cher ; puis
  les tâches.
- **Le recuit** (`anneal.js`, `draws.js`) : déplacer un morceau, en échanger deux qui partagent une ressource, une
  **chaîne de Kempe** (`kempe.js`), couper un morceau en deux ou en recoller deux qui se suivent (`reshape.js`),
  changer une affectation. Le coût est infaisabilité × `hard` × l'échelle + objectif, l'échelle étant la hausse moyenne
  de l'objectif d'un mouvement tiré ; le meilleur gardé l'est infaisabilité d'abord.
- **Ce qui le vérifie** : le coût tenu à jour égale celui de l'évaluateur après chaque mouvement, fait ou défait
  (`tests/xhstt-solve.test.js`, deux petites instances écrites à la main), et à la fin de chaque course du banc
  (`scripts/xhstt-bench.js`, qui s'arrête sinon).

**La mesure** : d'abord un écrémage des réglages sur les 25 instances à budget court (il rejette, ne promeut pas),
puis le budget d'ITC 2011 (1 000 s par instance, 10 graines), contre la règle simple par paires et contre le meilleur
connu. **On ne vise pas le premier rang** : on dit où l'on est.

**Pour les instances dures** (KS-PR-11, AU-BG-98, UK-SP-06 ; [`mesures-j7.md`](mesures-j7.md) § 3), des options du
recuit, nulles par défaut :

- `feasible` : une première part du budget sur l'infaisabilité seule, la température comptée en violations (de
  `fhot` à `fcold`) quelle que soit l'échelle de l'objectif ; le recuit reprend du meilleur plan de cette phase ;
- `slide` : toutes les séances d'une ressource une heure plus tôt ou plus tard, chacune dans son jour
  (`block.js`). À KS-PR-11, une classe occupée à une première heure doit l'être à cinq au moins : y mettre une
  séance seule coûte plus qu'elle ne rapporte, et le recuit restait à 274 violations quelles que soient la graine et
  la durée ; décaler toute la semaine d'un coup franchit la marche ;
- `block` : un morceau échange sa plage avec ce qu'une de ses ressources fait ailleurs (un double contre deux
  simples d'une classe pleine) ; `alike` : l'échange cherche un morceau de même durée ; `free` : une tâche va
  à un candidat libre à ses heures.

L'écrémage est fait ([`mesures-j7.md`](mesures-j7.md) § 1) : il écarte un poids requis trop bas (`hard=1`) et le
retrait des chaînes de Kempe ou des coupes ; la mesure à 1 000 s compare le défaut (`hard=50`) à `hard=10`.
