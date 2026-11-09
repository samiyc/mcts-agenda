import { PerformanceObserver } from "node:perf_hooks";
import { parseArgs } from "node:util";
import { buildGreedy } from "../src/build/greedy.js";
import { evaluate } from "../src/evaluate.js";
import { createSchool } from "../src/school/generate.js";
import { anneal } from "../src/search/anneal.js";
import { tabu } from "../src/search/tabu.js";

/**
 * The bench of the searches (docs/modele.md § 7): on a few collèges of each size, R0, then the annealing and the tabu
 * search from R0's timetable. For each, the time, the slots tried a second, the garbage collections during the search
 * (a hot path that allocates shows here), and the cost against R0's.
 *
 *   npm run bench -- --sizes M --n 3 --anneal 1000000 --tabu 4000000
 *
 * A screen, not a measure: the paired measure is scripts/search-compare.js, through the queue.
 */
const { values } = parseArgs({
  options: {
    sizes: { type: "string", default: "S,M,L" },
    n: { type: "string", default: "2" },
    from: { type: "string", default: "1" },
    anneal: { type: "string", default: "300000" },
    tabu: { type: "string", default: "1200000" },
  },
});

let collections = 0;
new PerformanceObserver((list) => {
  collections += list.getEntries().length;
}).observe({ entryTypes: ["gc"] });

/** Runs `fn` and gives its result with its time and the collections it caused; the observer reports them late. */
async function timed(fn) {
  await new Promise((resolve) => setTimeout(resolve, 0));
  const gcBefore = collections;
  const start = performance.now();
  const result = fn();
  const ms = performance.now() - start;
  await new Promise((resolve) => setTimeout(resolve, 0));
  return { result, ms, gc: collections - gcBefore };
}

function line(name, { ms, gc }, cost, tries) {
  const rate = tries ? Math.round(tries / ms).toString().padStart(5) + " essais/ms" : "".padStart(15);
  return `  ${name.padEnd(8)} coût ${String(cost).padStart(4)}  ${(ms / 1000).toFixed(1).padStart(5)} s  ${rate}  ${gc} GC`;
}

const SEARCHES = [
  { name: "recuit", search: anneal, key: "anneal" },
  { name: "tabou", search: tabu, key: "tabu" },
];

for (const size of /** @type {("S" | "M" | "L")[]} */ (values.sizes.split(","))) {
  for (let i = 0; i < Number(values.n); i += 1) {
    const seed = Number(values.from) + i;
    const school = createSchool({ size, seed });
    const r0 = await timed(() => buildGreedy(school, { seed }));
    console.log(`${size}, graine ${seed} : ${school.links.length} barrettes`);
    console.log(line("R0", r0, evaluate(school, r0.result.timetable).cost, 0));
    for (const { name, search, key } of SEARCHES) {
      const run = await timed(() => search(school, r0.result.timetable, { seed, tries: Number(values[key]) }));
      console.log(line(name, run, run.result.cost, run.result.tries));
    }
  }
}
process.exit(0);
