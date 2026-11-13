import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { paired } from "mcts-commun/measure.js";
import { buildGreedy } from "../src/build/greedy.js";
import { p0, p1 } from "../src/absence/rules.js";
import { runWeek } from "../src/absence/run.js";
import { drawWeek, volunteersOf } from "../src/absence/scenario.js";
import { anneal } from "../src/search/anneal.js";
import { replanSearch } from "../src/absence/search.js";
import { createSchool } from "../src/school/generate.js";

/**
 * The replanning rules by pairs (docs/modele.md § 6.3): on each collège, the timetable R0 builds (the same for every
 * rule), then `--weeks` weeks of absences drawn from the collège's seed; each rule plays every week. A sample is a
 * collège's mean over its weeks (its weeks share a timetable, they are not independent). The rules: P0, P1, the
 * search at each budget of `--tries` (moves a moment), and the A/A witness, the first search with another seed.
 *
 *   node scripts/replan-compare.js --sizes M --n 30 --from 1001 --weeks 30 --tries 20000,200000 [--json tmp/replan.json]
 *
 * Variants: `--place anneal` puts in place the timetable of the annealing from R0's (2,8 million slots tried, about
 * 20 s, J3's budget) instead of R0's; `--hours H` gives every volunteer H hours every week instead of the drawn ones
 * (0: no replacement at all); `--soft W` weighs the soft cost in the search's value by W a point (0: left out).
 *
 * J6: `--hidden veille` learns the length of half the morning absences day after day, each further day the evening
 * before (`--hidden matin`: that morning; `--told-whole P`: a share P of the morning absences told whole, not half;
 * `run.js`, `scenario.js`); `--beliefs known,odds`
 * plays the search under each belief (`belief.js`) at each budget, `R 200000 odds` beside `R 200000` (known, J5's),
 * and pairs each belief with J5's search at the same budget.
 */
const { values } = parseArgs({
  options: {
    sizes: { type: "string", default: "S,M,L" },
    n: { type: "string", default: "30" },
    from: { type: "string", default: "1001" },
    weeks: { type: "string", default: "30" },
    tries: { type: "string", default: "20000,200000" },
    json: { type: "string" },
    place: { type: "string", default: "r0" },
    hours: { type: "string" },
    soft: { type: "string" },
    hidden: { type: "string" },
    "told-whole": { type: "string" },
    beliefs: { type: "string", default: "known" },
  },
});
const PLACE_TRIES = 2800000;
const KEYS = ["lost", "changes", "notices", "soft", "replaced", "mostReplaced", "over", "ms"];
/** The search's options beyond its budget and seed: the soft weight, when `--soft` gives one. */
const EXTRA = values.soft === undefined ? {} : { soft: Number(values.soft) };
const WITNESS_OFFSET = 500000;
const BELIEFS = /** @type {("known" | "worst" | "odds")[]} */ (values.beliefs.split(","));
/** A search's name: its budget, then its belief unless J5's. */
const nameOf = (tries, belief) => (belief === "known" ? `R ${tries}` : `R ${tries} ${belief}`);

function rulesOf(seed) {
  const budgets = values.tries.split(",").map(Number);
  const searches = budgets.flatMap((tries) => BELIEFS.map((belief) => [nameOf(tries, belief), () => replanSearch({ ...EXTRA, tries, seed, belief })]));
  return {
    P0: () => p0,
    P1: () => p1,
    ...Object.fromEntries(searches),
    témoin: () => replanSearch({ ...EXTRA, tries: budgets[0], seed: seed + WITNESS_OFFSET, belief: BELIEFS[0] }),
  };
}

/** The timetable in place: R0's, or the annealing's from it. */
function inPlace(school, seed) {
  const built = buildGreedy(school, { seed }).timetable;
  return values.place === "anneal" ? anneal(school, built, { seed, tries: PLACE_TRIES }).timetable : built;
}

/** Week `k` of a collège, its volunteers' hours replaced when `--hours` says so. */
function scenarioOf(school, volunteers, seed) {
  const told = values["told-whole"] === undefined ? {} : { toldWhole: Number(values["told-whole"]) };
  const scenario = { ...drawWeek(school, seed, told), hidden: /** @type {false | "veille" | "matin"} */ (values.hidden ?? false) };
  if (values.hours !== undefined) scenario.budget = Uint8Array.from(volunteers, (v) => v * Number(values.hours));
  return scenario;
}

/** A collège's means over its weeks, rule by rule. */
function runSchool(size, seed) {
  const school = createSchool({ size, seed });
  const timetable = inPlace(school, seed);
  const volunteers = volunteersOf(school);
  const sums = {};
  for (let k = 1; k <= Number(values.weeks); k += 1) {
    const scenario = scenarioOf(school, volunteers, seed * 1000 + k);
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
  const hours = values.hours === undefined ? "" : ", " + values.hours + " h par volontaire chaque semaine";
  const soft = values.soft === undefined ? "" : ", poids souple " + values.soft;
  const told = values["told-whole"] === undefined ? "" : ", dites " + values["told-whole"];
  const hidden = values.hidden ? `, durées apprises jour après jour (${values.hidden}${told})` : "";
  const variant = `emploi du temps de ${values.place === "anneal" ? "R0 puis le recuit" : "R0"}${hours}${soft}${hidden}`;
  const lines = [`## ${size} : ${rows.length} collèges, ${values.weeks} semaines chacun (moyennes par semaine) ; ${variant}`];
  for (const name of names) lines.push(`- ${name} : perdues ${fmt(mean(of(name, "lost")))} h, changées ${fmt(mean(of(name, "changes")))}, annonces ${fmt(mean(of(name, "notices")))}, souple ${fmt(mean(of(name, "soft")))}, remplacées ${fmt(mean(of(name, "replaced")))} h (au plus ${fmt(mean(of(name, "mostReplaced")))}), études en trop ${fmt(mean(of(name, "over")))}, ${fmt(mean(of(name, "ms")))} ms`);
  const searches = names.filter((name) => name.startsWith("R "));
  const beliefs = searches.filter((name) => name.split(" ").length > 2).map((name) => [name, name.split(" ").slice(0, 2).join(" ")]);
  const pairs = [["P1", "P0"], ...searches.map((name) => [name, "P1"]), ...beliefs.filter(([, b]) => names.includes(b)), [searches[0], "témoin"]];
  const gapOf = (a, b, key) => gap(paired(of(a, key), of(b, key)));
  for (const [a, b] of pairs) lines.push(`- ${a} − ${b} : perdues ${gapOf(a, b, "lost")} ; changées ${gapOf(a, b, "changes")} ; annonces ${gapOf(a, b, "notices")} ; souple ${gapOf(a, b, "soft")}`);
  console.log(`${lines.join("\n")}\n`);
}

const results = {};
for (const size of /** @type {("S" | "M" | "L")[]} */ (values.sizes.split(","))) {
  const seeds = Array.from({ length: Number(values.n) }, (_, i) => Number(values.from) + i);
  results[size] = seeds.map((seed) => ({ seed, ...runSchool(size, seed) }));
  report(size, results[size].map(({ seed: _, ...rules }) => rules));
}
if (values.json) writeFileSync(values.json, JSON.stringify(results));
