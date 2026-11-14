import { readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { paired } from "mcts-commun/measure.js";

/**
 * The report of the XHSTT bench (docs/modele.md § 13), from the JSON files of `xhstt-bench.js` whose names start with
 * `--prefix`. Three tables:
 * - by instance: the best known, the simple rule's mean, and each configuration's mean (infeasibility / objective)
 *   over its seeds;
 * - by configuration: the rank of ITC 2011 (on each instance and seed, the configurations ranked by infeasibility then
 *   objective, ties sharing their ranks; then the mean), the runs without infeasibility, the instances where every
 *   seed has none;
 * - each configuration against `--ref`, by pairs over the instances: the mean difference of their ranks, with its
 *   interval, and the instances where it is better, equal, worse (on the means, infeasibility first).
 *
 *   node scripts/xhstt-report.js --prefix tmp/xhstt-screen- [--ref hard=50]
 */
const { values } = parseArgs({ options: { prefix: { type: "string", default: "tmp/xhstt-screen-" }, ref: { type: "string" } } });

const dir = dirname(values.prefix);
const records = readdirSync(dir)
  .filter((name) => join(dir, name).replaceAll("\\", "/").startsWith(values.prefix.replaceAll("\\", "/")) && name.endsWith(".json"))
  .flatMap((name) => JSON.parse(readFileSync(join(dir, name), "utf8")));
const configs = [...new Set(records.map((r) => r.config))];
const ids = [...new Set(records.map((r) => r.id))];
const lexLess = (a, b) => a.infeasibility < b.infeasibility || (a.infeasibility === b.infeasibility && a.objective < b.objective);
const mean = (list) => list.reduce((s, x) => s + x, 0) / list.length;
const meanCost = (runs) => ({ infeasibility: mean(runs.map((r) => r.infeasibility)), objective: mean(runs.map((r) => r.objective)) });
const show = (c) => `${+c.infeasibility.toFixed(1)}/${+c.objective.toFixed(0)}`;
const runsOf = (id, config) => records.filter((r) => r.id === id && r.config === config);
const annealOf = (id, config) => meanCost(runsOf(id, config).map((r) => r.anneal));
const seedsOf = (id) => [...new Set(records.filter((r) => r.id === id).map((r) => r.seed))];
const bracket = (c) => "[" + c + "]";

/** Ranks of the configurations on one instance and seed, ties sharing the mean of their ranks. */
function ranksOn(id, seed) {
  const costs = configs.map((config) => records.find((r) => r.id === id && r.seed === seed && r.config === config)?.anneal);
  return costs.map((c) => {
    if (!c) return NaN;
    const below = costs.filter((o) => o && lexLess(o, c)).length;
    const same = costs.filter((o) => o && !lexLess(o, c) && !lexLess(c, o)).length;
    return below + (same + 1) / 2;
  });
}

/** Each configuration's mean rank on one instance (over its seeds). */
function meanRanks(id) {
  const ranks = seedsOf(id).map((seed) => ranksOn(id, seed));
  return configs.map((_, k) => mean(ranks.map((row) => row[k])));
}
const rankByInstance = new Map(ids.map((id) => [id, meanRanks(id)]));

console.log(`${records.length} courses, ${ids.length} instances, configurations : ${configs.map(bracket).join(" ")}\n`);
console.log(["instance", "meilleur connu", "règle", ...configs.map(bracket)].join(" | "));
for (const id of ids) {
  const any = records.find((r) => r.id === id);
  const rule = meanCost(records.filter((r) => r.id === id && r.config === configs[0]).map((r) => r.greedy));
  console.log([id, show(any.best), show(rule), ...configs.map((c) => show(annealOf(id, c)))].join(" | "));
}

console.log("\nconfiguration | rang moyen | courses sans infaisabilité | instances sans infaisabilité");
configs.forEach((config, k) => {
  const runs = records.filter((r) => r.config === config);
  const clean = ids.filter((id) => annealOf(id, config).infeasibility === 0).length;
  const rank = mean(ids.map((id) => rankByInstance.get(id)[k]));
  console.log(`[${config}] | ${rank.toFixed(2)} | ${runs.filter((r) => r.anneal.infeasibility === 0).length}/${runs.length} | ${clean}/${ids.length}`);
});

const ref = values.ref ?? configs[0];
const r = configs.indexOf(ref);
console.log(`\ncontre [${ref}], par instance (rang : négatif = mieux) | mieux / égal / moins bien`);
configs.forEach((config, k) => {
  if (k === r) return;
  const p = paired(ids.map((id) => rankByInstance.get(id)[k]), ids.map((id) => rankByInstance.get(id)[r]));
  const means = ids.map((id) => [annealOf(id, config), annealOf(id, ref)]);
  const better = means.filter(([a, b]) => lexLess(a, b)).length;
  const worse = means.filter(([a, b]) => lexLess(b, a)).length;
  console.log(`[${config}] | ${p.mean.toFixed(2)} (${p.low.toFixed(2)} à ${p.high.toFixed(2)}) | ${better} / ${ids.length - better - worse} / ${worse}`);
});
console.log(`\n(${basename(values.prefix)}*)`);
