import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { paired } from "mcts-commun/measure.js";
import { buildGreedy } from "../src/build/greedy.js";
import { p0, p1 } from "../src/absence/rules.js";
import { runWeek } from "../src/absence/run.js";
import { drawWeek } from "../src/absence/scenario.js";
import { replanSearch } from "../src/absence/search.js";
import { createSchool } from "../src/school/generate.js";

/**
 * The replanning rules by pairs (docs/modele.md § 6.3): on each collège, the timetable R0 builds (the same for every
 * rule), then `--weeks` weeks of absences drawn from the collège's seed; each rule plays every week. A sample is a
 * collège's mean over its weeks (its weeks share a timetable, they are not independent). The rules: P0, P1, the
 * search at each budget of `--tries` (moves a moment), and the A/A witness, the first search with another seed.
 *
 *   node scripts/replan-compare.js --sizes M --n 30 --from 1001 --weeks 30 --tries 20000,200000 [--json tmp/replan.json]
 */
const { values } = parseArgs({
  options: {
    sizes: { type: "string", default: "S,M,L" },
    n: { type: "string", default: "30" },
    from: { type: "string", default: "1001" },
    weeks: { type: "string", default: "30" },
    tries: { type: "string", default: "20000,200000" },
    json: { type: "string" },
  },
});
const KEYS = ["lost", "changes", "replaced", "mostReplaced", "over", "ms"];
const WITNESS_OFFSET = 500000;

function rulesOf(seed) {
  const budgets = values.tries.split(",").map(Number);
  return {
    P0: () => p0,
    P1: () => p1,
    ...Object.fromEntries(budgets.map((tries) => [`R ${tries}`, () => replanSearch({ tries, seed })])),
    témoin: () => replanSearch({ tries: budgets[0], seed: seed + WITNESS_OFFSET }),
  };
}

/** A collège's means over its weeks, rule by rule. */
function runSchool(size, seed) {
  const school = createSchool({ size, seed });
  const { timetable } = buildGreedy(school, { seed });
  const sums = {};
  for (let k = 1; k <= Number(values.weeks); k += 1) {
    const scenario = drawWeek(school, seed * 1000 + k);
    for (const [name, make] of Object.entries(rulesOf(seed * 1000 + k))) {
      const start = performance.now();
      const { score } = runWeek(school, timetable, scenario, make());
      const sum = (sums[name] ??= Object.fromEntries(KEYS.map((key) => [key, 0])));
      for (const key of KEYS) sum[key] += key === "ms" ? performance.now() - start : score[key];
    }
  }
  return Object.fromEntries(Object.entries(sums).map(([name, sum]) => [name, Object.fromEntries(KEYS.map((key) => [key, sum[key] / Number(values.weeks)]))]));
}

const mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
const fmt = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(2));
const gap = ({ mean: m, low, high }) => `${fmt(m)} (${fmt(low)} à ${fmt(high)})`;

function report(size, rows) {
  const of = (name, key) => rows.map((row) => row[name][key]);
  const names = Object.keys(rows[0]);
  const lines = [`## ${size} : ${rows.length} collèges, ${values.weeks} semaines chacun (moyennes par semaine)`];
  for (const name of names) lines.push(`- ${name} : perdues ${fmt(mean(of(name, "lost")))} h, changées ${fmt(mean(of(name, "changes")))}, remplacées ${fmt(mean(of(name, "replaced")))} h (au plus ${fmt(mean(of(name, "mostReplaced")))}), études en trop ${fmt(mean(of(name, "over")))}, ${fmt(mean(of(name, "ms")))} ms`);
  const searches = names.filter((name) => name.startsWith("R "));
  const pairs = [["P1", "P0"], ...searches.map((name) => [name, "P1"]), [searches[0], "témoin"]];
  for (const [a, b] of pairs) lines.push(`- ${a} − ${b} : perdues ${gap(paired(of(a, "lost"), of(b, "lost")))} ; changées ${gap(paired(of(a, "changes"), of(b, "changes")))}`);
  console.log(`${lines.join("\n")}\n`);
}

const results = {};
for (const size of /** @type {("S" | "M" | "L")[]} */ (values.sizes.split(","))) {
  const seeds = Array.from({ length: Number(values.n) }, (_, i) => Number(values.from) + i);
  results[size] = seeds.map((seed) => ({ seed, ...runSchool(size, seed) }));
  report(size, results[size].map(({ seed: _, ...rules }) => rules));
}
if (values.json) writeFileSync(values.json, JSON.stringify(results));
