import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { createRng } from "mcts-commun/random.js";
import { progress } from "mcts-commun/trace.js";
import { anneal } from "../src/xhstt/anneal.js";
import { evaluateSolution } from "../src/xhstt/evaluate.js";
import { greedy } from "../src/xhstt/greedy.js";
import { layoutOf } from "../src/xhstt/layout.js";
import { createState } from "../src/xhstt/state.js";
import { loadBench } from "./xhstt-bench-data.js";

/**
 * The XHSTT-2014 bench (docs/modele.md § 13): on each instance and seed, the simple rule (`greedy.js`), then the
 * annealing from it (`anneal.js`) under each configuration; each result checked against the evaluator, which HSEval
 * vouches for (J4). One line a run; `--json` keeps them all, for `xhstt-report.js`.
 *
 *   node scripts/xhstt-bench.js [--only AU-BG-98,KS-PR-11] [--seeds 1,2,3] [--tries 3000000]
 *        [--configs "hard=1;hard=5,kempe=0"] [--json tmp/xhstt.json]
 *
 * A configuration overrides the annealing's settings (`XANNEAL`): `key=value` pairs joined by commas, configurations
 * by semicolons; "" is the defaults. `--tries` can be a number, or `rate:F` for F seconds at each instance's speed
 * measured by a first short run (the budget then differs by instance, but not by seed or configuration).
 *
 * In the queue: `progress` says which run it is at (`bench`) and how far the annealing is (`recuit`, every 2^20 moves).
 */
const { values } = parseArgs({
  options: {
    only: { type: "string", default: "" },
    seeds: { type: "string", default: "1" },
    tries: { type: "string", default: "3000000" },
    configs: { type: "string", default: "" },
    json: { type: "string" },
  },
});
const PILOT = 300000;

const configOf = (text) => Object.fromEntries(text.split(",").filter(Boolean).map((kv) => [kv.split("=")[0], Number(kv.split("=")[1])]));
const CONFIGS = values.configs.split(";").map((name) => ({ name, options: configOf(name) }));

function check(instance, state) {
  const full = evaluateSolution(instance, { events: state.layout.pieces.filter((p) => p.duration > 0) });
  if (full.infeasibility !== state.infeasibility || full.objective !== state.objective) {
    throw new Error(`${instance.id} : la recherche dit ${state.infeasibility}/${state.objective}, l'évaluateur ${full.infeasibility}/${full.objective}`);
  }
}

/** The simple rule, then the annealing under `options`: both results. */
function runOnce(instance, seed, { options, tries }) {
  const started = performance.now();
  const state = createState(instance, layoutOf(instance));
  const greedyTries = greedy(state, createRng(seed));
  const ruled = { infeasibility: state.infeasibility, objective: state.objective, tries: greedyTries, ms: performance.now() - started };
  const tick = (done, of) => progress("recuit", done, of, { unit: "essai" });
  const result = anneal(state, { ...options, seed, tries, tick });
  check(instance, result.state);
  const ms = performance.now() - started - ruled.ms;
  return { greedy: ruled, anneal: { infeasibility: result.state.infeasibility, objective: result.state.objective, tries, ms, scale: result.scale } };
}

/** The budget on `instance`: a number of tries, or so many seconds at its speed. */
function budgetOf(instance) {
  if (!values.tries.startsWith("rate:")) return Number(values.tries);
  const { anneal: pilot } = runOnce(instance, 1, { options: CONFIGS[0].options, tries: PILOT });
  return Math.round((PILOT / pilot.ms) * 1000 * Number(values.tries.slice(5)));
}

const records = [];
const seeds = values.seeds.split(",").map(Number);

function runConfig({ id, instance, best }, seed, { config, tries }) {
  const run = runOnce(instance, seed, { options: config.options, tries });
  records.push({ id, seed, config: config.name, best, ...run });
  const g = run.greedy;
  const a = run.anneal;
  console.log(`${id} s${seed} [${config.name}] règle ${g.infeasibility}/${g.objective} · recuit ${a.infeasibility}/${a.objective} (${(a.ms / 1000).toFixed(0)} s, ${tries} essais) · meilleur connu ${best.infeasibility}/${best.objective}`);
  if (values.json) writeFileSync(values.json, JSON.stringify(records, null, 1));
}

const entries = loadBench({ only: values.only.split(",").filter(Boolean) });
const total = entries.length * seeds.length * CONFIGS.length;
let runs = 0;
for (const entry of entries) {
  const tries = budgetOf(entry.instance);
  for (const seed of seeds) {
    for (const config of CONFIGS) {
      runConfig(entry, seed, { config, tries });
      runs += 1;
      progress("bench", runs, total, { unit: "course" });
    }
  }
}
