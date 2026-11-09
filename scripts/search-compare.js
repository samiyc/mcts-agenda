import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { paired } from "mcts-commun/measure.js";
import { buildGreedy } from "../src/build/greedy.js";
import { evaluate } from "../src/evaluate.js";
import { createSchool } from "../src/school/generate.js";
import { better } from "../src/search/best.js";
import { anneal } from "../src/search/anneal.js";
import { tabu } from "../src/search/tabu.js";

/**
 * The searches against R0, by pairs on the same collèges, at equal time (docs/modele.md § 6.3):
 * - **R0**, and **R0 répété**: R0 run again with other seeds for its ties, the best kept, for about the searches' time;
 *   the simple rule given the same budget;
 * - **le recuit** and **le tabou**, from R0's timetable;
 * - **le témoin A/A**: the annealing again with another seed, which shows the noise of the arena.
 * The budget is in slots tried, converted from `--seconds` by the rates of the bench (RATES, H), so that a run replays
 * from its seeds; the time each took is reported beside.
 *
 *   node scripts/search-compare.js --sizes M --n 30 --from 1001 --seconds 20 [--json tmp/search-M.json]
 */
const { values } = parseArgs({
  options: {
    sizes: { type: "string", default: "S,M,L" },
    n: { type: "string", default: "30" },
    from: { type: "string", default: "1001" },
    seconds: { type: "string", default: "20" },
    json: { type: "string" },
  },
});
/** Slots tried a millisecond (npm run bench, 9/11/2026, on this machine with the queue full): H. */
const RATES = Object.freeze({ anneal: 140, tabu: 580 });
/** R0's time a collège (the bench): how many times R0 runs in the searches' budget. */
const R0_SECONDS = Object.freeze({ S: 1.2, M: 2.5, L: 5.8 });
const WITNESS_OFFSET = 500000;
const RESTART_OFFSET = 1000;

function timed(fn) {
  const start = performance.now();
  const result = fn();
  return { result, ms: performance.now() - start };
}

const scoreOf = (school, timetable, ms) => ({ ...evaluate(school, timetable), ms });

/** R0 with `count` seeds for its ties, the best timetable kept. */
function repeated(school, seed, count) {
  let best = null;
  for (let k = 0; k < count; k += 1) {
    const { timetable } = buildGreedy(school, { seed: seed + k * RESTART_OFFSET });
    const score = evaluate(school, timetable);
    if (!best || better(score, best.score)) best = { score, timetable };
  }
  return best.timetable;
}

function runOne(size, seed, seconds) {
  const school = createSchool({ size, seed });
  const r0 = timed(() => buildGreedy(school, { seed }));
  const start = r0.result.timetable;
  const budget = { anneal: Math.round(seconds * 1000 * RATES.anneal), tabu: Math.round(seconds * 1000 * RATES.tabu) };
  const runs = {
    repeated: timed(() => repeated(school, seed, Math.max(1, Math.round(seconds / R0_SECONDS[size])))),
    anneal: timed(() => anneal(school, start, { seed, tries: budget.anneal }).timetable),
    tabu: timed(() => tabu(school, start, { seed, tries: budget.tabu }).timetable),
    witness: timed(() => anneal(school, start, { seed: seed + WITNESS_OFFSET, tries: budget.anneal }).timetable),
  };
  const row = { seed, r0: scoreOf(school, start, r0.ms) };
  for (const [name, run] of Object.entries(runs)) row[name] = scoreOf(school, run.result, run.ms);
  return row;
}

const mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
const fmt = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(1));
const gap = ({ mean: m, low, high }) => `${fmt(m)} (${fmt(low)} à ${fmt(high)})`;
const NAMES = { r0: "R0", repeated: "R0 répété", anneal: "recuit", tabu: "tabou", witness: "témoin" };
const PAIRS = [
  ["anneal", "r0"],
  ["tabu", "r0"],
  ["repeated", "r0"],
  ["anneal", "repeated"],
  ["anneal", "tabu"],
  ["anneal", "witness"],
];

function report(size, rows) {
  const of = (name, key) => rows.map((row) => row[name][key]);
  const lines = [`## ${size} : ${rows.length} collèges`];
  for (const name of Object.keys(NAMES)) {
    const soft = Object.keys(rows[0][name].soft).map((key) => `${key} ${fmt(mean(rows.map((row) => row[name].soft[key])))}`);
    lines.push(`- ${NAMES[name]} : infaisabilité ${fmt(mean(of(name, "infeasibility")))}, coût ${fmt(mean(of(name, "cost")))}, ${fmt(mean(of(name, "ms")) / 1000)} s ; ${soft.join(", ")}`);
  }
  for (const [a, b] of PAIRS) {
    lines.push(`- ${NAMES[a]} − ${NAMES[b]} : infaisabilité ${gap(paired(of(a, "infeasibility"), of(b, "infeasibility")))} ; coût ${gap(paired(of(a, "cost"), of(b, "cost")))}`);
  }
  console.log(`${lines.join("\n")}\n`);
}

const results = {};
for (const size of /** @type {("S" | "M" | "L")[]} */ (values.sizes.split(","))) {
  const seeds = Array.from({ length: Number(values.n) }, (_, i) => Number(values.from) + i);
  results[size] = seeds.map((seed) => runOne(size, seed, Number(values.seconds)));
  report(size, results[size]);
}
if (values.json) writeFileSync(values.json, JSON.stringify(results));
