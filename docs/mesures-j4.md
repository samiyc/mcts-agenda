# Les mesures de J4 : notre évaluateur XHSTT contre HSEval (9/11/2026)

Avant de mesurer quoi que ce soit sur le banc public, notre évaluateur doit redonner, au point près, les coûts
qu'HSEval publie pour des solutions connues ([`modele.md`](modele.md) § 6.4). J4 écrit le lecteur et l'évaluateur
XHSTT (`src/xhstt/`), d'après la spécification d'HSEval (version 2.8, mars 2023, lue en entière), puis les compare à
HSEval sur toutes les solutions publiées de l'archive de Twente.

## Les données

Elles ne sont pas dans git (`data/` est ignoré ; aucune licence connue). Pour les retrouver :

```text
mkdir -p data/xhstt/zips && cd data/xhstt/zips
curl -LO https://www.utwente.nl/en/eemcs/dmmp/hstt/archives/XHSTT-2014/XHSTT-2014.zip       # 575 Ko
curl -LO https://www.utwente.nl/en/eemcs/dmmp/hstt/archives/ALL_INSTANCES.zip               # 2,0 Mo
unzip XHSTT-2014.zip -d ../2014 && unzip ALL_INSTANCES.zip -d ../all
```

- `data/xhstt/2014/XHSTT-2014.xml` : les 25 instances du banc, sans solution. Notre lecteur les lit toutes en 0,5 s.
- `data/xhstt/all/` : 49 instances, chacune avec l'historique de ses meilleures solutions, **160 solutions** en tout ;
  18 portent un rapport d'HSEval (l'infaisabilité, l'objectif, et chaque coût par point et par contrainte).
- `data/xhstt/pages/` : la page de chaque instance sur le site de Twente
  (`https://www.utwente.nl/en/eemcs/dmmp/hstt/datasets/<pays>/<instance>/`), dont le tableau donne l'infaisabilité et
  l'objectif de chaque solution soumise. Les dossiers de pays ne suivent pas toujours le nom du fichier :
  `CzechRepublic/VillageSchool`, `UnitedKingdom/StPaul`, `Kosovo/Instance1`.

**La commande** : `npm run xhstt` (`scripts/xhstt-check.js`).

## Les chiffres

| Comparaison | Accord | Les écarts |
|---|---|---|
| Les 18 rapports, ligne par ligne (coût par point et par contrainte) | 15 au point près | 3 rapports antérieurs à une correction de leur instance ; la page actuelle donne nos valeurs |
| Les 160 solutions, contre les valeurs de leur page | 150, dont les 3 rapports qui diffèrent | 8 sur des pages sans tableau des solutions (3 instances Artificial, SpainSchool) ; 1 solution retirée de sa page ; 1 inexpliquée |

**Les trois rapports qui diffèrent**, tous datés d'avant une correction de l'instance :

| Instance, solution | Le rapport | Nous | La page aujourd'hui | La correction |
|---|---|---|---|---|
| AustraliaBGHS98, GOAL de février 2016 | 0 / 340 | 0 / 334 | 0 / 334 | 4/3/2016, les découpages des événements liés |
| AustraliaTES99, GOAL d'avril 2015 | 0 / 33 | 0 / 39 | — (la solution du 2/3/2016 donne 0 / 39 sur la page et chez nous) | 4/3/2016 |
| BrazilInstance7, Demirovic et Musliu | 0 / 1 038 | 0 / 57 | 0 / 57 | 1/4/2015, PreferTimes devenue dure |

**La solution inexpliquée** : BrazilInstance4, Haroldo (décembre 2011), 0 / 121 chez nous, 0 / 112 sur la page.
L'écart vaut 9, le poids d'une journée de trop d'un professeur (ClusterBusyTimes). Les trois autres solutions de la
même instance (2012 et 2013) concordent ; la page garde la valeur calculée à la soumission, peut-être avant la
simplification des fonctions de coût de 2014. Seul HSEval, en ligne, pourrait trancher.

**La solution retirée** : EnglandStPaul, Lectio@ITC2011, 386 000 d'infaisabilité chez nous ; elle n'est plus sur la
page, comme d'autres solutions d'ITC 2011 sur des instances corrigées depuis.

**Les seize types de contraintes** sont couverts : quinze par des solutions concordantes (OrderEvents seulement dans
NetherlandsKottenpark2008, dont les deux solutions concordent), et tous par une petite instance écrite à la main dans
les tests (`tests/fixtures/xhstt-small.xml`), où chaque type a un écart calculé d'après la spécification.

## Ce que la comparaison a corrigé

- **Un groupe est un ensemble.** Les instances grecques WesternGreeceUniversity nomment le cours d'un événement deux
  fois (`Course`, puis dans `EventGroups`). Compté deux fois, chaque événement doublait les écarts de SpreadEvents :
  170 à 243 chez nous contre 0 à 8 publiés. Une fois les doublons écartés, les 7 solutions concordent.
- **Les points en double, eux, comptent deux fois** : la spécification le dit d'un événement ou d'une ressource nommé
  deux fois dans `AppliesTo`. Le test le vérifie.

## Ce qu'on en tire

1. **Notre évaluateur est celui d'HSEval** sur ce qu'on a pu comparer : 150 solutions sur 152 qui ont une valeur
   publiée. Des deux autres, l'une n'est plus publiée ; l'autre, une solution de 2011, diffère de 9 points.
2. **On peut maintenant mesurer sur XHSTT-2014.** Le pas suivant est un solveur pour ces instances : elles demandent
   plus que nos collèges (découper les événements, affecter les ressources, seize types de contraintes), et notre
   recuit doit d'abord savoir faire ces mouvements.
