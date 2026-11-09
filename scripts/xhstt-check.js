import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { evaluateSolution } from "../src/xhstt/evaluate.js";
import { readInstance } from "../src/xhstt/instance.js";
import { readArchive } from "../src/xhstt/solution.js";
import { parseXml } from "../src/xhstt/xml.js";
import { publishedOf } from "./xhstt-pages.js";

/**
 * Our XHSTT evaluator against HSEval (docs/modele.md § 6.4), on every solution of the archives of a folder:
 * - a solution that carries HSEval's report: its two totals and each cost by point and constraint, line by line;
 * - every solution: its two totals against the values the site publishes for the instance (its dataset page). The
 *   groups are named differently on the pages and in the files, so a solution agrees when its (infeasibility,
 *   objective) is among the instance's published rows.
 * A report older than a correction of its instance can disagree with the page; the page is HSEval today.
 *
 *   node scripts/xhstt-check.js [--dir data/xhstt/all] [--pages data/xhstt/pages] [--detail 5]
 *
 * The archives and the pages are not in git (data/, docs/mesures-j4.md says how to fetch them).
 */
const { values } = parseArgs({
  options: {
    dir: { type: "string", default: "data/xhstt/all" },
    pages: { type: "string", default: "data/xhstt/pages" },
    detail: { type: "string", default: "5" },
  },
});

/** The lines where the report and our evaluation differ: `[key, theirs, ours]`. */
function differences(report, ours) {
  const keys = new Set([...report.costs.keys(), ...ours.costs.keys()]);
  return [...keys].map((key) => [key, report.costs.get(key) ?? 0, ours.costs.get(key) ?? 0]).filter(([, a, b]) => a !== b);
}

const tally = { reports: 0, reportsExact: 0, solutions: 0, published: 0, withoutPage: 0 };

function checkReport(label, report, ours) {
  tally.reports += 1;
  const lines = differences(report, ours);
  if (lines.length === 0) tally.reportsExact += 1;
  else {
    console.log(`  rapport ≠ ${label} : HSEval ${report.infeasibility} / ${report.objective}, nous ${ours.infeasibility} / ${ours.objective}`);
    for (const [key, theirs, mine] of lines.slice(0, Number(values.detail))) console.log(`     ${key} : HSEval ${theirs}, nous ${mine}`);
  }
}

function checkPublished(label, rows, ours) {
  tally.solutions += 1;
  if (!rows) {
    tally.withoutPage += 1;
    return;
  }
  if (rows.some((row) => row.infeasibility === ours.infeasibility && row.objective === ours.objective)) tally.published += 1;
  else {
    const published = rows.map((r) => r.infeasibility + " / " + r.objective).join(", ");
    console.log(`  page ≠ ${label} : nous ${ours.infeasibility} / ${ours.objective} ; la page : ${published}`);
  }
}

for (const file of readdirSync(values.dir).filter((name) => name.endsWith(".xml")).sort()) {
  const { instances, solutions } = readArchive(parseXml(readFileSync(join(values.dir, file), "utf8")), readInstance);
  const rows = publishedOf(values.pages, file);
  for (const solution of solutions) {
    const ours = evaluateSolution(instances.get(solution.instance), solution);
    const label = `${file.replace(".xml", "")} · ${solution.group}`;
    if (solution.report) checkReport(label, solution.report, ours);
    checkPublished(label, rows, ours);
  }
}
console.log(`\nRapports d'HSEval : ${tally.reportsExact} sur ${tally.reports} redonnés au point près.`);
console.log(`Valeurs des pages : ${tally.published} solutions sur ${tally.solutions} retrouvées (${tally.withoutPage} sans page).`);
