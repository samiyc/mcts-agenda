# Les questions

Pour Sami, puis pour un professionnel du métier. Chacune porte une recommandation : sans réponse, c'est ce que le
modèle fera. Une réponse quitte cette liste et va, avec sa date, dans [`sources.md`](sources.md) ou dans le modèle.

## Pour Sami (posées le 6/11/2026)

| # | La question | La recommandation | Pourquoi |
|---|---|---|---|
| **Q-S1** | **Quel établissement ?** Un collège, un lycée, ou les deux ; et quelle taille d'abord ? | **Un collège public fictif**, en trois tailles (12, 16 et 24 divisions), le collège M de 16 divisions pour les premières mesures. | La grille du collège est fixée par arrêté et les élèves d'une division suivent tous le même tronc : le problème tient en une semaine. Le lycée ajoute les spécialités choisies par chaque élève, un autre problème (celui d'ITC 2019). |
| **Q-S2** | **Quel banc public ?** CLAUDE.md dit ITC 2019 ; ITC 2011 (XHSTT) porte sur les lycées et collèges. | **XHSTT-2014 d'abord** (J4), ITC 2019 seulement si le lycée vient. Corriger CLAUDE.md dans ce sens. | ITC 2019 est universitaire : sections au choix des étudiants, semaines différentes, trajets entre bâtiments. XHSTT a nos classes fixes et nos professeurs affectés, 25 instances, un évaluateur et les meilleures solutions publiées. |
| **Q-S3** | **Quel plus petit gain vaut qu'on l'adopte ?** | **Construire** : une heure non placée de moins par instance, ou à faisabilité égale −5 % du coût souple. **Replanifier** : une heure perdue de moins pour 20 heures d'absence (5 points). | C'est le `h1` de `sprt`, et la taille des séries : en dessous, un principal adjoint ne verrait pas la différence. |
| **Q-S4** | **Le score du replanning** : dans l'ordre (les heures perdues, puis le dérangement, puis le coût souple), ou une somme pondérée ? | **Dans l'ordre**, et le dérangement compté en cours changés (la mesure de Müller et al.) ; les personnes dérangées rapportées à côté. | Une heure perdue l'est pour 25 élèves : aucun confort ne la rachète. L'ordre évite d'inventer un taux de change entre une heure de cours et un changement de salle. |
| **Q-S5** | **Combien d'instances ?** | **30 collèges par taille et 30 semaines d'absences par collège**, des graines disjointes pour l'écrémage, la mesure et la reprise. | Assez pour un intervalle par paires utile ; `sprt` arrête plus tôt une série déjà tranchée. |
| **Q-S6** | **Le budget de temps** de la recherche. | **60 s** pour construire le collège M, **60 s** pour replanifier la veille, **10 s** le matin ; et le temps d'ITC 2011 (1 000 s) sur XHSTT. | La veille au soir laisse du temps ; à 7 h 45, le CPE veut une réponse tout de suite. Un budget fixe rend les comparaisons honnêtes. |
| **Q-S7** | **Qui interroger ?** Connais-tu un principal adjoint, un CPE ou un professeur de collège ? | **Un principal adjoint et un CPE**, 30 minutes chacun, avec les questions ci-dessous, en commençant par Q-P1, Q-P12 et Q-P13. Pas avant J2 : on leur montrera la page. | Le principal adjoint fait l'emploi du temps, le CPE vit les absences du matin. Ils diront « ça ne se fait pas comme ça » en regardant une grille. |

**Ce que j'ai décidé sans te le demander**, à défaire si tu n'es pas d'accord (`../modele.md`, § 11) : la répartition
des services donnée, pas optimisée ; des créneaux d'une heure et deux semaines A et B ; R0 au degré de saturation ; P1
qui ne touche qu'au jour de l'absence ; `schedule` de la lib pris pour sa forme seulement (il ordonne des jobs, il ne
place pas des cours).

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
| **Q-P4** | L'EPS se fait-elle en blocs de 2 h ? Les installations sont-elles partagées avec la commune ? Les TP de sciences sont-ils en blocs ? | PA, P | **L'EPS en deux blocs de 2 h** (en 6e) ou un bloc et une heure (cycle 4), le gymnase pris une demi-journée par semaine ; les TP en heures simples. | D4, D8 : les blocs sont les cours les plus durs à placer. |
| **Q-P5** | Les matières « lourdes » le matin, est-ce une règle qu'on tient ? Laquelle ? | PA, P | **Une préférence faible** (poids 1) : pas de français, de maths ni de LV1 après 15 h. | S6. |
| **Q-P6** | Les horaires : la durée d'une heure de cours (55 min ?), le début et la fin de journée, la pause méridienne en pratique, le nombre de services de cantine, le mercredi après-midi ? | PA, CPE | **Des créneaux d'une heure de 8 h à 17 h**, deux créneaux libres entre 11 h et 14 h pour chaque division, mercredi après-midi libre. | La forme de la semaine (§ 2.1). |
| **Q-P7** | Une division a-t-elle sa salle au collège ? Les changements de salle comptent-ils ? | PA | **Oui, une salle attitrée**, un changement hors salle spécialisée coûte 1. | S7. |
| **Q-P8** | Les demi-heures de la grille (4,5 h de français) : en semaines A et B, en 1 h 30, en semestres ? | PA | **En semaines A et B.** | Le modèle du temps. |
| **Q-P9** | Les barrettes : combien, pour quoi (LV2, groupes de besoins, soutien de 6e, latin) ? Les groupes de besoins changent-ils les heures, ou seulement les groupes ? | PA | **La LV2 par paires de divisions, le soutien de 6e sur toutes les 6e au même créneau** ; les groupes de besoins comme une barrette de français et une de maths par niveau, à volume égal. | J2 : les barrettes rigidifient la semaine. |
| **Q-P10** | Les cars scolaires imposent-ils l'heure de fin ? La cantine a-t-elle une capacité qui force des services ? | PA, CPE | **Ni l'un ni l'autre au départ** : fin à 17 h, cantine sans limite. | Ce qui reste hors du modèle (§ 12). |
| **Q-P11** | Le glossaire tient-il ? Les mots TRS, barrette, alignement, étude, trou sont-ils les vôtres ? | PA | **Celui de `glossaire.md`.** | Les mots de la page. |

### Remplacer un absent

| # | Question | Qui | La recommandation | Pèse sur |
|---|---|---|---|---|
| **Q-P12** | Qui décide du remplacement, et à quelle heure apprend-on une absence ? Un professeur qui n'a pas cours ce matin peut-il venir ? | CPE, PA | **La veille vers 18 h, ou le matin vers 7 h 30** ; le matin, seuls les professeurs déjà au collège ce jour-là, sauf un volontaire. | Ce que le replanning a le droit de toucher (§ 4). |
| **Q-P13** | Que fait-on d'un cours sans professeur, et dans quel ordre de préférence : un collègue, un échange de cours, une étude, libérer les élèves ? | CPE, PA | **Un collègue de la discipline, un collègue de l'équipe, un échange, une étude ; libérer seulement en fin de journée avec l'autorisation des familles.** | P1, et les mouvements de la recherche. |
| **Q-P14** | Combien de volontaires au remplacement dans un collège, pour combien d'heures dans l'année ? | PA | **20 % des professeurs**, 9 à 18 heures chacun dans l'année. | Les ressources du replanning. |
| **Q-P15** | Un professeur peut-il être désigné sans être volontaire ? Avec quel délai, et combien d'heures au plus par semaine ? | PA | **Prévenu 24 h avant, 5 heures supplémentaires par semaine au plus** (une lecture syndicale, à vérifier dans le décret de 2023). | Le matin même, seuls les volontaires. |
| **Q-P16** | Qu'est-ce qui dérange le plus : un cours déplacé, un professeur changé, une salle changée ? Pour les élèves, les professeurs, les familles ? Un changement annoncé la veille gêne-t-il moins qu'un changement du matin ? | CPE, P | **Compter les cours changés** ; un changement de la veille compte moitié moins qu'un changement du matin. | Le dérangement (§ 4). |
| **Q-P17** | Combien d'absences par semaine dans un collège de 16 divisions ? Quelle part est connue d'avance ? Combien de jours durent-elles ? | CPE, PA | **Un jour par mois par professeur**, deux sur trois connues d'avance, de 1 à 3 jours. | Les scénarios d'absences (§ 4, § 6.1). |
| **Q-P18** | Comment compte-t-on une heure perdue : une étude, un cours fait par un collègue d'une autre discipline ? | PA | **Perdue si personne ne fait cours** ; un collègue d'une autre discipline sauve l'heure, mais compte à part. | Le premier score du replanning. |
