# Le glossaire

Les mots de l'emploi du temps scolaire et de sa recherche, et ce qui leur répond dans le modèle. La dernière colonne
donne le nom prévu dans le code (en anglais), ou « — » si le mot attend un jalon ou reste hors du modèle.

**D'où ils viennent.** Les termes des programmes viennent des arrêtés lus (`sources.md` § 1). Ceux de l'établissement
(TRS, barrette, alignement, étude) viennent de l'usage, sans définition officielle lue : ils attendent la relecture
d'un principal adjoint (Q-P11). Ceux de la recherche viennent des articles de `sources.md` § 6 et § 7 ; le nom anglais
entre parenthèses aide à les lire.

## L'établissement et ses moyens

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **Division** | une classe au sens administratif : un groupe d'élèves d'un niveau qui suit le tronc commun ensemble (« la 5e B ») | `Division` |
| **Niveau** | 6e, 5e, 4e, 3e ; la 6e est la fin du cycle 3, les trois autres font le cycle 4 | `level` |
| **Groupe** | une partie d'une division, ou des élèves de plusieurs divisions, pour un enseignement : la LV2, un demi-groupe de TP, un groupe de besoins | `Course.divisions` et `Course.halves` : une moitié de division, ou une moitié de chacune des deux divisions d'une paire |
| **DHG** (dotation horaire globale) | les heures que le rectorat donne au collège pour l'année : celles de la grille, plus la marge | — : en amont du modèle |
| **La marge** | 3 heures par semaine et par division, en plus de la grille, pour les groupes, la co-intervention et les options | — ; les demi-groupes de sciences en prennent 1 h par division (`../modele.md` § 2.4) |
| **TRS** (tableau de répartition des services) | qui enseigne quoi à quelle division, arrêté avant l'emploi du temps | l'entrée du modèle : chaque cours a son professeur |
| **VS** (ventilation de service) | le service d'un professeur, ligne par ligne, signé à la rentrée | — |
| **Salle attitrée** | la salle d'une division au collège, où elle a ses cours ordinaires | `homeRoom`, et `Course.home` pour un cours (S7) |
| **Salle spécialisée** | un laboratoire, la salle de technologie, d'arts plastiques, de musique, l'informatique, le gymnase | `Room.kind` |
| **Vie scolaire** | le service du CPE et des assistants d'éducation : les absences, les études, la surveillance | la capacité d'étude (§ 4) |
| **CPE** (conseiller principal d'éducation) | le responsable de la vie scolaire ; il voit les absences du matin le premier | — : un interlocuteur |
| **Principal adjoint** | dans un collège, celui qui fait le plus souvent l'emploi du temps | — : un interlocuteur |
| **AED** (assistant d'éducation) | un surveillant ; il tient les études | — |

## Le temps

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **Créneau**, **heure** | une case de la semaine : un jour, une heure de début ; d'une heure dans le modèle | `Slot` |
| **Demi-journée** | le matin ou l'après-midi ; un bloc n'en sort pas | `half` |
| **Semaine A, semaine B** | deux semaines qui alternent, pour placer les demi-heures de la grille | `weeks: "AB" \| "A" \| "B"` |
| **Pause méridienne** | le temps du déjeuner, au moins 1 h 30 pour chaque collégien | D5 |
| **Amplitude** | de la première à la dernière heure de la journée d'un élève ou d'un professeur | — |
| **Trou**, heure creuse | une heure libre entre deux cours d'une même journée ; pour un élève, une heure d'étude | S1, S2 |
| **Bloc** | un cours de 2 heures d'un seul tenant (l'EPS, un TP) | `Course.length = 2` |
| **Semestrialisé** | un enseignement fait à 2 h par semaine sur un semestre au lieu d'1 h toute l'année (les arts) | — |

## Les enseignements

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **Grille horaire** | les heures par discipline et par niveau, fixées par arrêté | `GRID` |
| **Enseignements complémentaires** | l'accompagnement personnalisé (AP) et les enseignements pratiques interdisciplinaires (EPI), pris dans les 26 h | portés par les disciplines |
| **Soutien ou approfondissement** | en 6e depuis 2023, 1 h de français ou de maths en groupes recomposés chaque trimestre, entre les classes | une barrette par paire de 6e : un groupe de français, un de maths |
| **Groupes de besoins** | en 6e et 5e, le français et les maths en groupes formés selon le niveau des élèves (décret de 2025) | une barrette (J2), Q-P9 |
| **Barrette**, alignement | plusieurs cours de divisions différentes placés au même créneau, pour que leurs élèves se répartissent en groupes (la LV2 de deux classes en allemand et espagnol) | `School.links`, `Course.link`, D9 |
| **LV1, LV2** | la première et la deuxième langue vivante | des disciplines |
| **Vie de classe** | au moins 10 heures dans l'année, avec le professeur principal | — : hors du modèle au départ |
| **Accompagnement aux devoirs** | en 6e, son volume fixé par le chef d'établissement | — |

## Les professeurs

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **ORS** (obligations réglementaires de service) | le service hebdomadaire : 18 h pour un certifié, 15 h pour un agrégé | `Teacher.service` |
| **HSA** (heure supplémentaire année) | une heure au-delà du service, toutes les semaines de l'année ; une est imposable | `Teacher.extra` |
| **HSE** (heure supplémentaire effective) | une heure faite une fois, comme un remplacement | compté au replanning |
| **Complément de service** | un professeur qui finit son service dans un autre établissement | une indisponibilité (D4) |
| **BMP** (bloc de moyens provisoire) | des heures qui ne font pas un poste, confiées à un contractuel ou en complément | — |
| **Vœux** | ce qu'un professeur demande pour son emploi du temps : une demi-journée libre, pas de 8 h | `Wish` (S3) |
| **Équipe pédagogique** | les professeurs d'une division | le second choix de P1 |
| **Bivalence** | un professeur qui enseigne deux disciplines ; la Cour des comptes la recommande dès 2026 | — : plus tard |

## Les absences

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **RCD** (remplacement de courte durée) | le remplacement d'une absence de moins de 15 jours, organisé dans l'établissement (décret de 2023) | le replanning (J5) |
| **Pacte enseignant** | depuis 2023, des missions payées en plus du service, dont le remplacement (une mission de 9 h) | `Teacher.volunteer` |
| **Protocole**, plan annuel | les règles du remplacement dans l'établissement, arrêtées par le chef d'établissement | les règles de P1 |
| **Étude**, permanence | une classe sans cours, surveillée par la vie scolaire | une heure perdue |
| **Échange**, permutation | avancer ou reculer le cours d'un professeur présent pour combler le trou de l'absent | un mouvement du replanning |
| **Absence institutionnelle** | une absence due au service lui-même : une formation, une réunion, un jury, une sortie | l'absence connue d'avance |
| **Heure perdue** | une heure de cours de la grille qu'aucun professeur n'a faite | le premier score (§ 4) |

## La recherche

| Terme | Ce que c'est | Dans le modèle |
|---|---|---|
| **Contrainte dure** (*hard*, *Required* dans XHSTT) | à respecter absolument ; sa violation rend la solution infaisable | `D1` à `D9`, `infeasibility` |
| **Contrainte souple** (*soft*) | une préférence ; sa violation coûte son poids | `S1` à `S8`, `cost` |
| **Infaisabilité** (*infeasibility value*) | la somme des violations dures, comparée en premier | `infeasibility` |
| **Coût** (*objective value*) | la somme pondérée des violations souples | `cost` |
| **Événement** (*event*, XHSTT) | une heure ou un bloc de cours, avec ses ressources | `Course` |
| **Ressource** (*resource*, XHSTT) | un professeur, une salle, une classe ou un élève | — : nos trois types séparés |
| **Classe, sous-partie, configuration** (*class, subpart, config*, ITC 2019) | les sections d'un cours d'université ; une « classe » d'ITC 2019 est une section, pas une division | — : à la lecture d'ITC 2019 |
| **Contrainte de distribution** (ITC 2019) | une contrainte entre plusieurs classes : même début, pas de chevauchement, au plus D jours… | — |
| **Glouton**, degré de saturation (DSatur) | placer d'abord le cours qui a le moins d'options | R0 |
| **Recherche taboue** (*tabu search*) | une descente qui s'interdit de défaire ses derniers mouvements pour ne pas tourner en rond | J3 |
| **Recuit simulé** (*simulated annealing*) | une descente qui accepte parfois pire, de moins en moins à mesure que la « température » baisse | J3 |
| **Chaîne de Kempe** | échanger deux créneaux pour tout un groupe de cours liés par leurs conflits, sans en créer de nouveaux | un mouvement de J3 |
| **Perturbation minimale** (*minimal perturbation problem*) | refaire une solution après un changement en modifiant le moins de choses possible | le dérangement (§ 4) |
