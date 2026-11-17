import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { paired } from "mcts-commun/measure.js";

/**
 * The report of `replan-compare.js`: the means rule by rule, then the gaps by pairs. Run alone, it gathers the
 * `--json` files of several slices of one measure (the same sizes and rules, other collèges) and reports them as one:
 *
 *   node scripts/replan-report.js tmp/replan-S-1001.json tmp/replan-S-1006.json …
 */

const mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
const fmt = (x) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(2));
const gap = ({ mean: m, low, high }) => `${fmt(m)} (${fmt(low)} à ${fmt(high)})`;
export const SIZES = ["S", "M", "L"];

/** The pairs to report: P1 against P0, each search against P1, each belief against J5's search, the witness. */
function pairsOf(names) {
  const searches = names.filter((name) => name.startsWith("R "));
  const beliefs = searches.filter((name) => name.split(" ").length > 2).map((name) => [name, name.split(" ").slice(0, 2).join(" ")]);
  return [["P1", "P0"], ...searches.map((name) => [name, "P1"]), ...beliefs.filter(([, b]) => names.includes(b)), [searches[0], "témoin"]];
}

/**
 * The report of one size, as text.
 * @param {string} size
 * @param {{ seed: number, [rule: string]: any }[]} records one a collège
 * @param {{ weeks: number | string, variant: string }} meta
 */
export function reportOf(size, records, { weeks, variant }) {
  const rows = records.map(({ seed: _, ...rules }) => rules);
  const of = (name, key) => rows.map((row) => row[name][key]);
  const names = Object.keys(rows[0]);
  const lines = [`## ${size} : ${rows.length} collèges, ${weeks} semaines chacun (moyennes par semaine) ; ${variant}`];
  for (const name of names) lines.push(`- ${name} : perdues ${fmt(mean(of(name, "lost")))} h, changées ${fmt(mean(of(name, "changes")))}, annonces ${fmt(mean(of(name, "notices")))}, souple ${fmt(mean(of(name, "soft")))}, remplacées ${fmt(mean(of(name, "replaced")))} h (au plus ${fmt(mean(of(name, "mostReplaced")))}), études en trop ${fmt(mean(of(name, "over")))}, ${fmt(mean(of(name, "ms")))} ms`);
  const gapOf = (a, b, key) => gap(paired(of(a, key), of(b, key)));
  for (const [a, b] of pairsOf(names)) lines.push(`- ${a} − ${b} : perdues ${gapOf(a, b, "lost")} ; changées ${gapOf(a, b, "changes")} ; annonces ${gapOf(a, b, "notices")} ; souple ${gapOf(a, b, "soft")}`);
  return `${lines.join("\n")}\n`;
}

/** Several slices' files as one: their collèges by size, in seed order; the meta of the first. */
export function gather(files) {
  const all = files.map((file) => JSON.parse(readFileSync(file, "utf8")));
  const meta = { weeks: all[0].weeks ?? "?", variant: all[0].variant ?? "?" };
  const bySize = {};
  for (const size of SIZES) {
    const records = all.flatMap((one) => one[size] ?? []);
    if (records.length) bySize[size] = records.sort((a, b) => a.seed - b.seed);
  }
  return { meta, bySize };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { positionals } = parseArgs({ allowPositionals: true });
  if (!positionals.length) throw new Error("replan-report : donner les fichiers --json des tranches");
  const { meta, bySize } = gather(positionals);
  for (const [size, records] of Object.entries(bySize)) console.log(reportOf(size, records, meta));
}
