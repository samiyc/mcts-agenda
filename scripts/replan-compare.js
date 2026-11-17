import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { progress } from "mcts-commun/trace.js";
import { buildGreedy } from "../src/build/greedy.js";
import { p0, p1 } from "../src/absence/rules.js";
import { runWeek } from "../src/absence/run.js";
import { drawWeek, volunteersOf } from "../src/absence/scenario.js";
import { anneal } from "../src/search/anneal.js";
import { replanSearch } from "../src/absence/search.js";
import { evaluate } from "../src/evaluate.js";
import { WEIGHTS } from "../src/rules/soft.js";
import { createSchool } from "../src/school/generate.js";
import { reportOf } from "./replan-report.js";

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
 *
 * J10: `--cover W` builds the timetable in place with S9, the cover, weighed W (`src/rules/cover.js`); each collège's
 * record then keeps that timetable's own costs (`timetable`: S1 to S8, and S9's hours), for `replan-pair.js`.
 *
 * In the queue (mcts-commun's docs/backlog.md): it says where it is (`progress`, a week at a time) and writes `--json`
 * after each collège. A long measure is cut into slices of 30 min at most (`--n 5 --from 1001`, `--from 1006`…, one
 * job each), then `replan-report.js` reports the slices' files as one.
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
    cover: { type: "string" },
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
/** The collège drawn, with S9 weighed as `--cover` says. */
function schoolOf(size, seed) {
  const drawn = createSchool({ size, seed });
  return values.cover === undefined ? drawn : { ...drawn, weights: { ...WEIGHTS, S9: Number(values.cover) } };
}

/** The costs of the timetable in place, at the default weights (S9 not in `cost`), and S9's hours. */
function judged(school, timetable) {
  const { infeasibility, cost, soft } = evaluate({ ...school, weights: WEIGHTS }, timetable);
  return { infeasibility, cost, S9: soft.S9 };
}

function runSchool(size, seed, tick) {
  const school = schoolOf(size, seed);
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
    tick();
  }
  const means = Object.fromEntries(Object.entries(sums).map(([name, sum]) => [name, Object.fromEntries(KEYS.map((key) => [key, sum[key] / Number(values.weeks)]))]));
  return { ...means, timetable: judged(school, timetable) };
}

const hours = values.hours === undefined ? "" : ", " + values.hours + " h par volontaire chaque semaine";
const soft = values.soft === undefined ? "" : ", poids souple " + values.soft;
const told = values["told-whole"] === undefined ? "" : ", dites " + values["told-whole"];
const hidden = values.hidden ? `, durées apprises jour après jour (${values.hidden}${told})` : "";
const cover = values.cover === undefined ? "" : `, S9 au poids ${values.cover}`;
const meta = { weeks: Number(values.weeks), variant: `emploi du temps de ${values.place === "anneal" ? "R0 puis le recuit" : "R0"}${cover}${hours}${soft}${hidden}` };
const sizes = /** @type {("S" | "M" | "L")[]} */ (values.sizes.split(","));
const seeds = Array.from({ length: Number(values.n) }, (_, i) => Number(values.from) + i);
const total = sizes.length * seeds.length * meta.weeks;
let done = 0;
function tick() {
  done += 1;
  progress("replan", done, total, { unit: "semaine" });
}
/** @type {Record<string, any>} */
const results = { ...meta };
for (const size of sizes) {
  results[size] = [];
  for (const seed of seeds) {
    results[size].push({ seed, ...runSchool(size, seed, tick) });
    if (values.json) writeFileSync(values.json, JSON.stringify(results));
  }
  console.log(reportOf(size, results[size], meta));
}
