# Le prompt de recherche métier

À coller dans une session de recherche, Claude ou autre, quand Sami veut compléter [`sources.md`](sources.md). La
recherche du 6/11/2026 a trouvé les grilles horaires, le cadre du remplacement, les bancs ITC 2011 et ITC 2019 : ce
prompt vise ce qu'elle n'a pas trouvé, ou seulement en résumé, dans l'ordre où cela pèse sur le modèle.

**Une précaution** : le site du ministère (education.gouv.fr) et Légifrance ont refusé l'outil de lecture le 6/11. Une
session qui a un navigateur les lira mieux ; sinon, les PDF des syndicats et des académies reprennent souvent les
textes, et `pdftotext -layout` (dans Git Bash) les extrait.

```text
Je construis un modèle d'emploi du temps d'un collège public français fictif : placer chaque cours (une division, une
discipline, un professeur déjà affecté, une durée) dans une semaine A/B, avec une salle, sous des contraintes dures et
souples ; puis replanifier quand un professeur est absent, connu la veille ou le matin même, en perdant le moins
d'heures et en changeant le moins de choses. J'ai déjà : les grilles horaires (arrêtés du 16/06/2017 et du 7/04/2023),
le décret 2014-940 sur les services, le décret 2023-732 sur le remplacement de courte durée (en résumé seulement), les
rapports de la Cour des comptes de 2021 et de décembre 2025 (en résumé), ITC 2011 (XHSTT) et ITC 2019. Ne refais pas
ce travail.

Cherche des sources publiées, en priorité des textes officiels, des rapports d'inspection (IGÉSR), des études et des
articles de recherche opérationnelle ; en français et en anglais.

Par ordre de priorité :

1. Les absences des professeurs du second degré en chiffres : combien de jours d'absence par professeur et par an, la
   part des absences de 1 jour, 2-3 jours, 4-15 jours ; la part connue d'avance (formation, réunion, sortie, examen) et
   la part apprise le matin même ; le jour de la semaine. Mots-clés : absences enseignants second degré durée,
   absences institutionnelles, DEPP, IGÉSR, Cour des comptes 2021 et 2025 (le rapport lui-même, pas la presse).
2. Le texte du décret n° 2023-732 du 8 août 2023 et de ses arrêtés : qui peut être désigné sans être volontaire, le
   délai de prévenance, le plafond d'heures par semaine et par an, l'ordre de priorité entre les collègues, ce qui
   compte comme une heure remplacée. Et ce que le Pacte est devenu en 2025 et 2026.
3. Ce qui se fait en pratique d'un cours sans professeur dans un collège : une étude, un échange de cours, un collègue,
   la sortie anticipée des élèves (avec quelle autorisation, à quelle heure) ; ce que proposent EDT (Index Éducation),
   Pronote, UnDeuxTemps ou aSc ; des guides de chefs d'établissement ou d'académies sur le protocole de remplacement.
4. La recherche opérationnelle du remplacement : « teacher substitution problem », « substitute teacher assignment »,
   « timetable repair », « disruption management » pour les écoles ; les modèles, les objectifs (heures perdues,
   changements, équité), les jeux de données.
5. Comment se fait un emploi du temps de collège en France : qui le fait, combien de temps, avec quel outil ; ce qui
   est dur et ce qui est souple en pratique ; les vœux des professeurs, combien sont tenus ; les trous des
   professeurs et des élèves jugés acceptables ; la place des barrettes (LV2, groupes de besoins, soutien de 6e) et des
   semaines A/B ; la pause méridienne et les services de cantine ; les cars scolaires.
6. La grille horaire du collège en vigueur à la rentrée 2026, et ce que le décret et l'arrêté du 4 avril 2025 sur les
   groupes de besoins changent aux volumes et à l'organisation.
7. Les bancs : les meilleurs résultats publiés sur XHSTT-2014 depuis 2014 (GOAL, KHE de Jeff Kingston, les
   hyper-heuristiques) et le classement final d'ITC 2019, avec leurs méthodes ; un jeu de données d'un collège ou d'un
   lycée français, s'il en existe un public.

Vérifie aussi, si tu peux lire les textes :
- la règle de la pause méridienne d'1 h 30 et le plafond de 6 h par jour en 6e (décret de 2016, BO n° 30 du
  25/08/2016) ;
- les 9 % d'heures perdues en 2023-2024 et les 20 % d'heures remplacées pour les absences de moins de 15 jours.

Les règles :
- Chaque chiffre a sa source : auteurs ou institution, année, titre, lien. Dis si tu as lu le texte, ou seulement un
  résumé, un article de presse ou un extrait.
- Un syndicat ou un éditeur de logiciel peut donner une pratique ou une lecture, pas un chiffre de référence : dis-le.
- Si deux sources se contredisent, garde les deux et explique l'écart (le champ, l'année, le public ou le privé).
- Si tu ne trouves rien, dis-le : n'invente pas et n'extrapole pas sans le dire. C'est utile de savoir qu'un chiffre
  n'est pas publié : il ira à un principal adjoint.

Le format : pour chaque sujet, un tableau chiffre, valeur, champ (collège, lycée, public, année), source, ce qui a été
lu. Puis ce qui reste introuvable.
```

**Après la recherche.** Chaque chiffre va dans [`sources.md`](sources.md) avec son niveau de lecture. Une réponse
sourcée retire sa question de [`questions.md`](questions.md) et change une hypothèse du modèle : un changement de
modèle, donc une empreinte mise à jour, avec les mesures avant et après dans le commit.
