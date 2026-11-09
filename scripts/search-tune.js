import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { paired } from "mcts-commun/measure.js";
import { buildGreedy } from "../src/build/greedy.js";
import { evaluate } from "../src/evaluate.js";
import { createSchool } from "../src/school/generate.js";
import { ANNEAL, anneal } from "../src/search/anneal.js";
import { TABU, tabu } from "../src/search/tabu.js";

/**
 * The settings of a search, by pairs against its defaults (docs/mesures-j3.md): on each collège, R0, then the search
 * from R0's timetable with its defaults and with each variant, at the same budget of slots tried. Tuning goes on its
 * own seeds (2001 on), never the measure's (1001 on); a variant that wins is measured again on fresh seeds.
 *
 *   node scripts/search-tune.js --search anneal --variants "hot=3;swap=0.7,hot=3" --sizes M --n 30 --from 2001 --seconds 20
 */
const { values } = parseArgs({
  options: {
    search: { type: "string", default: "anneal" },
    variants: { type: "string", default: "" },
    sizes: { type: "string", default: "M" },
    n: { type: "string", default: "30" },
    from: { type: "string", default: "2001" },
    seconds: { type: "string", default: "20" },
    json: { type: "string" },
  },
});
/** Slots tried a millisecond, as in scripts/search-compare.js (H). */
const RATES = Object.freeze({ anneal: 140, tabu: 580 });
const SEARCHES = { anneal: { run: anneal, defaults: ANNEAL }, tabu: { run: tabu, defaults: TABU } };
const { run, defaults } = SEARCHES[values.search];
const tries = Math.round(Number(values.seconds) * 1000 * RATES[values.search]);

/** "hot=3,swap=0.7" → { hot: 3, swap: 0.7 }, each key a setting of the search. */
function optionsOf(text) {
  const options = Object.fromEntries(text.split(",").filter(Boolean).map((pair) => pair.split("=")).map(([key, value]) => [key, Number(value)]));
  for (const key of Object.keys(options)) if (!(key in defaults)) throw new Error(`réglage inconnu : ${key}`);
  return options;
}

const variants = { défaut: {}, ...Object.fromEntries(values.variants.split(";").filter(Boolean).map((text) => [text, optionsOf(text)])) };

function runOne(size, seed) {
  const school = createSchool({ size, seed });
  const start = buildGreedy(school, { seed }).timetable;
  const row = { seed, r0: evaluate(school, start).cost };
  for (const [name, options] of Object.entries(variants)) {
    const t = performance.now();
    const result = run(school, start, { ...options, seed, tries });
    row[name] = { cost: result.cost, infeasibility: result.infeasibility, ms: performance.now() - t };
  }
  return row;
}

const mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
const fmt = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(1));

const results = {};
for (const size of /** @type {("S" | "M" | "L")[]} */ (values.sizes.split(","))) {
  const seeds = Array.from({ length: Number(values.n) }, (_, i) => Number(values.from) + i);
  const rows = seeds.map((seed) => runOne(size, seed));
  results[size] = rows;
  console.log(`## ${size}, ${values.search}, ${tries} essais (${values.seconds} s), graines ${seeds[0]} à ${seeds.at(-1)} ; R0 ${fmt(mean(rows.map((r) => r.r0)))}`);
  for (const name of Object.keys(variants)) {
    const cost = rows.map((r) => r[name].cost);
    const gap = paired(cost, rows.map((r) => r.défaut.cost));
    console.log(`- ${name.padEnd(24)} coût ${fmt(mean(cost))}, ${fmt(mean(rows.map((r) => r[name].ms)) / 1000)} s ; − défaut : ${fmt(gap.mean)} (${fmt(gap.low)} à ${fmt(gap.high)})`);
  }
  console.log("");
}
if (values.json) writeFileSync(values.json, JSON.stringify(results));
