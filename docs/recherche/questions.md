# Les questions

Pour Sami, puis pour un professionnel du métier. Chacune porte une recommandation : sans réponse, c'est ce que le
modèle fera. Une réponse quitte cette liste et va, avec sa date, dans [`sources.md`](sources.md) ou dans le modèle.

## Pour Sami (posées le 6/11/2026)

| # | La question | La recommandation | Pourquoi |
|---|---|---|---|
| **Q-S1** | **Quel établissement ?** Un collège, un lycée, ou les deux ; et quelle taille d'abord ? | **Un collège public fictif**, en trois tailles (12, 16 et 24 divisions), le collège M de 16 divisions pour les premières mesures. | La grille du collège est fixée par arrêté et les élèves d'une division suivent tous le même tronc : le problème tient en une semaine. Le lycée ajoute les spécialités choisies par chaque élève, un autre problème (celui d'ITC 2019). |
| **Q-S3** | **Quel plus petit gain vaut qu'on l'adopte ?** | **Construire** : une heure non placée de moins par instance, ou à faisabilité égale −5 % du coût souple. **Replanifier** : une heure perdue de moins pour 20 heures d'absence (5 points). | C'est le `h1` de `sprt`, et la taille des séries : en dessous, un principal adjoint ne verrait pas la différence. |
| **Q-S4** | **Le score du replanning** : dans l'ordre (les heures perdues, puis le dérangement, puis le coût souple), ou une somme pondérée ? | **Dans l'ordre**, et le dérangement compté en cours changés (la mesure de Müller et al.) ; les personnes dérangées rapportées à côté. | Une heure perdue l'est pour 25 élèves : aucun confort ne la rachète. L'ordre évite d'inventer un taux de change entre une heure de cours et un changement de salle. |
| **Q-S5** | **Combien d'instances ?** | **30 collèges par taille et 30 semaines d'absences par collège**, des graines disjointes pour l'écrémage, la mesure et la reprise. | Assez pour un intervalle par paires utile ; `sprt` arrête plus tôt une série déjà tranchée. |
| **Q-S6** | **Le budget de temps** de la recherche. | **60 s** pour construire le collège M, **60 s** pour replanifier la veille, **10 s** le matin ; et le temps d'ITC 2011 (1 000 s) sur XHSTT. | La veille au soir laisse du temps ; à 7 h 45, le CPE veut une réponse tout de suite. Un budget fixe rend les comparaisons honnêtes. |
| **Q-S7** | **Qui interroger ?** Connais-tu un principal adjoint, un CPE ou un professeur de collège ? | **Un principal adjoint et un CPE**, 30 minutes chacun, avec les questions ci-dessous, en commençant par Q-P1, Q-P12 et Q-P13. Pas avant J2 : on leur montrera la page. | Le principal adjoint fait l'emploi du temps, le CPE vit les absences du matin. Ils diront « ça ne se fait pas comme ça » en regardant une grille. |

**Répondu le 6/11/2026** (Sami) : oui aux quatre décisions prises sans lui (`../modele.md`, § 11) : la répartition des
services donnée, pas optimisée ; des créneaux d'une heure et deux semaines A et B ; R0 au degré de saturation ; P1 qui
ne touche qu'au jour de l'absence ; `schedule` de la lib pris pour sa forme seulement. Il ajoute : « le sport est sur
2 h une fois par semaine, à vérifier ». Vérifié (`sources.md` § 2) : c'est le cas au cycle 4 (un bloc de 2 h et une
heure, un autre jour) ; en 6e, les 4 h se font en deux blocs de 2 h.

**Répondu le 17/11/2026** (Sami) : Q-S1, un collège pour le moment ; « à long terme, ce serait super de pouvoir faire
les deux ». Le lycée est noté comme objectif de long terme (`../modele.md`, § 11). Q-S2 à Q-S7 attendent encore.

## Pour un professionnel

**Qui :** **PA**, un principal adjoint (celui qui fait l'emploi du temps) ; **CPE**, un conseiller principal
d'éducation (les absences du matin) ; **P**, un professeur de collège. Aucune donnée nominative. Modèle fictif : on ne
fait l'emploi du temps de personne.

**La recommandation** de chaque ligne est la valeur que garde le modèle sans réponse. « Pèse sur » dit ce qui change.

### Construire l'emploi du temps (à poser d'abord)

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P1** | Qu'est-ce qui est vraiment interdit dans un emploi du temps, et qu'est-ce qui n'est que souhaitable ? Qu'est-ce qui le rend « mauvais » aux yeux des professeurs, des familles ? | PA, P | **Interdits** : D1 à D9 du modèle. **Le pire des souples** : les trous des élèves (poids 10), puis la journée trop longue en cycle 4 (10), puis les vœux (5). | Tout le coût souple. Si on ne pose qu'une question, celle-là. |
| **Q-P2** | Combien d'heures de trou par semaine sont acceptables pour un professeur ? Pour une division ? | PA, P | **Aucun trou pour une division**, 3 heures par semaine au plus pour un professeur (poids 10 et 3). | S1, S2. |
| **Q-P3** | Quels vœux les professeurs font-ils (une demi-journée libre, pas de 8 h, pas de dernière heure), et combien en tient-on ? | PA, P | **Une demi-journée libre** demandée par la moitié des professeurs, tenue si possible (poids 5). | S3, la difficulté des instances. |
| **Q-P4** | L'EPS : un bloc de 2 h et une heure au cycle 4, deux blocs de 2 h en 6e, est-ce bien votre usage (ou 2 × 1 h 30, ou un semestre à 4 h) ? Les installations sont-elles partagées avec la commune ? Les TP de sciences sont-ils en blocs ? Les demi-groupes : la SVT et la physique-chimie en alternance A/B, une moitié de la division dans chaque, est-ce courant ? | PA, P | **Comme le modèle** (§ 2.4, lu dans des documents d'académie), les séances à 24 h d'écart, le gymnase pris une demi-journée par semaine ; les TP en heures simples, la demi-heure impaire de SVT et de physique-chimie en demi-groupes alternés (§ 2.4). | D4, D8, S8 : les blocs sont les cours les plus durs à placer. |
| **Q-P5** | Les matières « lourdes » le matin, est-ce une règle qu'on tient ? Laquelle ? | PA, P | **Une préférence faible** (poids 1) : pas de français, de maths ni de LV1 après 15 h. | S6. |
| **Q-P6** | Les horaires : la durée d'une heure de cours (55 min ?), le début et la fin de journée, la pause méridienne en pratique, le nombre de services de cantine, le mercredi après-midi ? | PA, CPE | **Des créneaux d'une heure de 8 h à 17 h**, deux créneaux libres entre 11 h et 14 h pour chaque division, mercredi après-midi libre. | La forme de la semaine (§ 2.1). |
| **Q-P7** | Une division a-t-elle sa salle au collège ? Les changements de salle comptent-ils ? | PA | **Oui, une salle attitrée**, un changement hors salle spécialisée coûte 1. | S7. |
| **Q-P8** | Les demi-heures de la grille (4,5 h de français) : en semaines A et B, en 1 h 30, en semestres ? | PA | **En semaines A et B.** | Le modèle du temps. |
| **Q-P9** | Les barrettes : combien, pour quoi (LV2, groupes de besoins, soutien de 6e, latin) ? Les groupes de besoins changent-ils les heures, ou seulement les groupes ? | PA | **La LV2 et le soutien de 6e par paires de divisions** (deux groupes : espagnol et allemand, ou français et maths), la dernière division seule si leur nombre est impair ; les groupes de besoins comme une barrette de français et une de maths par niveau, à volume égal. Le soutien sur toutes les 6e à la fois demanderait plus de professeurs libres à la même heure que le collège fictif n'en a (`../modele.md` § 2.4). | J2 : les barrettes rigidifient la semaine. |
| **Q-P10** | Les cars scolaires imposent-ils l'heure de fin ? La cantine a-t-elle une capacité qui force des services ? | PA, CPE | **Ni l'un ni l'autre au départ** : fin à 17 h, cantine sans limite. | Ce qui reste hors du modèle (§ 12). |
| **Q-P11** | Le glossaire tient-il ? Les mots TRS, barrette, alignement, étude, trou sont-ils les vôtres ? | PA | **Celui de `glossaire.md`.** | Les mots de la page. |

### Remplacer un absent

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P12** | Qui décide du remplacement, et à quelle heure apprend-on une absence ? Un professeur qui n'a pas cours ce matin peut-il venir ? | CPE, PA | **La veille vers 18 h, ou le matin vers 7 h 30** ; le matin, seuls les professeurs déjà au collège ce jour-là, sauf un volontaire. | Ce que le replanning a le droit de toucher (§ 4). |
| **Q-P13** | Que fait-on d'un cours sans professeur, et dans quel ordre de préférence : un collègue, un échange de cours, une étude, libérer les élèves ? | CPE, PA | **Un collègue de la discipline, un collègue de l'équipe, un échange, une étude ; libérer seulement en fin de journée avec l'autorisation des familles.** | P1, et les mouvements de la recherche. |
| **Q-P14** | Combien de volontaires au remplacement dans un collège, pour combien d'heures dans l'année ? | PA | **20 % des professeurs**, 9 à 18 heures chacun dans l'année. | Les ressources du replanning. |
| **Q-P15** | Un professeur peut-il être désigné sans être volontaire ? Avec quel délai, et combien d'heures au plus par semaine ? | PA | **Prévenu 24 h avant, 5 heures supplémentaires par semaine au plus** (une lecture syndicale, à vérifier dans le décret de 2023). | Le matin même, seuls les volontaires. |
| **Q-P16** | Qu'est-ce qui dérange le plus : un cours déplacé, un professeur changé, une salle changée ? Pour les élèves, les professeurs, les familles ? Un changement annoncé la veille gêne-t-il moins qu'un changement du matin ? Combien de cours changés, ou de minutes de cours perdues, vaut une journée mieux faite (un trou de moins, une journée moins longue) ? | CPE, P | **Compter les cours changés** ; un changement de la veille compte moitié moins qu'un changement du matin ; cent points de coût souple valent un cours changé (`mesures-j5.md` : la recherche change environ une séance par heure sauvée, 11,5 par semaine pour 10 h sauvées dans un grand collège ; à dix points pour un cours changé, elle perd 0,15 à 0,4 h de plus par semaine). | Le dérangement (§ 4). |
| **Q-P17** | Combien d'absences par semaine dans un collège de 16 divisions ? Quelle part est connue d'avance ? Combien de jours durent-elles ? Quand un professeur est malade le matin, quand sait-on jusqu'à quand : le jour même (l'arrêt), ou jour après jour ? | CPE, PA | **Un jour par mois par professeur**, deux sur trois connues d'avance, de 1 à 3 jours ; une maladie sur deux avec sa durée, l'autre apprise jour après jour, la veille au soir (J6). | Les scénarios d'absences (§ 4, § 6.1). |
| **Q-P18** | Comment compte-t-on une heure perdue : une étude, un cours fait par un collègue d'une autre discipline ? | PA | **Perdue si personne ne fait cours** ; un collègue d'une autre discipline sauve l'heure, mais compte à part. | Le premier score du replanning. |

## Ce que la recherche du 16/11 a réglé, et ce qui reste à demander

Les sources sont dans [`sources.md`](sources.md) § 9. **Réglé** : la réponse publique suffit, la question tombe.
**En partie** : le cadre est connu, l'usage d'un collège reste à dire. **Ouvert** : rien de public.

| # | État | Ce qu'on sait maintenant | Ce qu'il reste à demander |
|---|---|---|---|
| Q-P1 | en partie | les trous des élèves passent avant ceux des professeurs (APMEP) ; les vœux sont souples, l'indisponibilité dure, dans les logiciels | le pire des souples aux yeux d'un principal adjoint |
| Q-P2 | ouvert | aucun seuil public ; les logiciels offrent des plafonds par professeur (heures par jour, amplitude) | combien de trous pour un professeur |
| Q-P3 | en partie | les logiciels traitent les vœux comme des préférences, et conseillent d'en limiter le nombre | quels vœux, combien tenus |
| Q-P4 | en partie | 24 h entre deux séances d'EPS d'un élève ; **6 h par jour au plus pour un professeur d'EPS** (une contrainte que le modèle n'a pas) ; des installations souvent hors du collège | les blocs, les TP, les demi-groupes : l'usage du collège |
| Q-P5 | en partie | la chronobiologie (Testu) décrit deux temps forts dans la journée, et une vigilance qui remonte l'après-midi : S6 (pas de matière lourde après 15 h) n'a pas d'appui clair | la règle tenue, s'il y en a une |
| Q-P6 | en partie | la durée d'une heure n'a pas de règle nationale (55 min souvent, 45 ailleurs) ; la pause méridienne d'au moins 1 h 30 | les horaires du collège |
| Q-P7, Q-P8, Q-P11 | ouvert | rien de public | inchangé |
| Q-P9 | en partie | les groupes de besoins deviennent à la rentrée 2026 un « accompagnement pédagogique renforcé », avec une heure de soutien ou d'approfondissement en 6e : le modèle a déjà cette heure | comment le collège les aligne |
| Q-P10 | ouvert | les transports et la demi-pension sont « à prendre en compte », sans règle | inchangé |
| Q-P12 | en partie | **les délais de prévenance ne sont pas nationaux** : le plan RCD de chaque établissement les fixe ; les volontaires du Pacte déclarent leurs créneaux de remplacement (un semainier) | à quelle heure on apprend une absence, et les délais de leur plan |
| Q-P13 | en partie | d'abord un enseignant, de la discipline ou de la classe ; puis échanges de service et permutations de cours ; puis les AED (devoirs surveillés, numérique) : l'ordre de P1, plus les permutations | si l'on libère des élèves, et quand |
| Q-P14 | réglé | 42 % des professeurs de collège dans le Pacte en 2024-2025, le RCD un tiers des parts, une demi-part de 9 h : **les 20 % de volontaires du modèle, à 9 à 18 h, tiennent** | — |
| Q-P15 | en partie | désigné à défaut de volontaire, prévenu 24 h avant, 5 h par semaine et 60 par an au plus (textes syndicaux d'avant 2023, à vérifier) ; un professeur dont la classe est en sortie peut prendre d'autres classes dans son service | si la désignation se fait vraiment |
| Q-P16 | ouvert | la recherche compte la perturbation en cours changés, comme le modèle ; rien sur la veille contre le matin | **la question à garder en premier** |
| Q-P17 | en partie | au collège, 7,8 % des heures perdues par absence non remplacée (DEPP, 2024-2025), dont 40 % pour formation, examens et commissions ; les absences institutionnelles font 36 % des absences courtes. Notre calcul (H) : si 13 à 19 % des absences courtes sont remplacées, les professeurs manquent environ 9 % de leurs heures, **près du double** des 5 % du modèle (un jour par mois, 4,3 % des heures en fait). **Décidé le 16/11** : le modèle passe à 9 % (J9) | le nombre d'absences d'une semaine type, pour trancher |
| Q-P18 | ouvert | le ministère compte les heures remplacées sur les heures d'absence ; s'il compte une heure surveillée par un AED, rien ne le dit | inchangé |

**Ce qui change dans le modèle, sans attendre** (décidé avec Sami le 16/11, J9) : le taux d'absence, à presque doubler, et le
plafond de 6 h par jour des professeurs d'EPS. **Les questions à garder** pour les amis de Sami, dans l'ordre :
Q-P16, Q-P1, Q-P2, Q-P12, Q-P13, Q-P17, puis Q-P3 à Q-P7 si le temps le permet.
