import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { paired } from "mcts-commun/measure.js";
import { buildGreedy, buildNaive } from "../src/build/greedy.js";
import { evaluate } from "../src/evaluate.js";
import { createSchool } from "../src/school/generate.js";

/**
 * R0 against R0-naïf, by pairs on the same collèges (docs/modele.md § 6.3), and the A/A witness: R0 against itself
 * with another seed for its ties, which shows the noise of the arena. The seeds start at 1001, apart from the tests'.
 *
 *   node scripts/compare.js --sizes S,M,L --n 30 --from 1001 [--json tmp/compare.json]
 *
 * Infeasibility counts the hard violations (D1 to D9); the cost, the weighted soft constraints. A gap is A − B:
 * below zero, A costs less.
 */
const { values } = parseArgs({
  options: {
    sizes: { type: "string", default: "S,M,L" },
    n: { type: "string", default: "30" },
    from: { type: "string", default: "1001" },
    json: { type: "string" },
  },
});
const WITNESS_OFFSET = 500000;

function timed(build) {
  const start = performance.now();
  const built = build();
  return { ...built, ms: performance.now() - start };
}

function runOne(size, seed) {
  const school = createSchool({ size, seed });
  const runs = {
    naive: timed(() => buildNaive(school)),
    r0: timed(() => buildGreedy(school, { seed })),
    witness: timed(() => buildGreedy(school, { seed: seed + WITNESS_OFFSET })),
  };
  return Object.fromEntries(
    Object.entries(runs).map(([name, run]) => {
      const { infeasibility, cost, soft } = evaluate(school, run.timetable);
      return [name, { infeasibility, cost, soft, unplaced: run.unplaced.reduce((sum, left) => sum + left.courses.length, 0), ms: run.ms }];
    }),
  );
}

const mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
const fmt = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(1));
const gap = ({ mean: m, low, high }) => `${fmt(m)} (${fmt(low)} à ${fmt(high)})`;

function report(size, rows) {
  const of = (name, key) => rows.map((row) => row[name][key]);
  const bySoft = Object.keys(rows[0].r0.soft).map((key) => key + " " + fmt(mean(rows.map((row) => row.r0.soft[key]))));
  const lines = [
    `## ${size} : ${rows.length} collèges`,
    `- R0-naïf : ${fmt(mean(of("naive", "infeasibility")))} cases non placées, ${fmt(mean(of("naive", "unplaced")))} cours, coût ${fmt(mean(of("naive", "cost")))}, ${fmt(mean(of("naive", "ms")))} ms`,
    `- R0 : ${fmt(mean(of("r0", "infeasibility")))} cases non placées, ${fmt(mean(of("r0", "unplaced")))} cours, coût ${fmt(mean(of("r0", "cost")))}, ${fmt(mean(of("r0", "ms")))} ms`,
    `- R0 − R0-naïf, infaisabilité : ${gap(paired(of("r0", "infeasibility"), of("naive", "infeasibility")))}`,
    `- A/A, R0 − R0 (autre graine), infaisabilité : ${gap(paired(of("r0", "infeasibility"), of("witness", "infeasibility")))} ; coût : ${gap(paired(of("r0", "cost"), of("witness", "cost")))}`,
    `- le coût de R0 par contrainte (moyenne, avant poids) : ${bySoft.join(", ")}`,
  ];
  console.log(`${lines.join("\n")}\n`);
}

const results = {};
for (const size of values.sizes.split(",")) {
  const seeds = Array.from({ length: Number(values.n) }, (_, i) => Number(values.from) + i);
  const rows = seeds.map((seed) => runOne(size, seed));
  results[size] = rows;
  report(size, rows);
}
if (values.json) writeFileSync(values.json, JSON.stringify(results));
