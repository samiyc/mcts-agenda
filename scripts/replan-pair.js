import { parseArgs } from "node:util";
import { paired } from "mcts-commun/measure.js";
import { fmt, gap, gather, mean } from "./replan-report.js";

/**
 * Two measures of `replan-compare.js` by pairs (J10): the same collèges and absences, two timetables in place (or two
 * settings). For each size and each rule in both, B − A collège by collège, with its interval at 95 %: the hours
 * lost, the sessions changed, the soft cost of the week; and, when the records keep them (`--cover`), the gap in the
 * timetables' own cost (S1 to S8) and in their hours without a free colleague (S9). Each side may be several slices.
 *
 *   node scripts/replan-pair.js --a tmp/j10-0-S-1001.json,tmp/j10-0-S-1016.json --b tmp/j10-3-S-1001.json,…
 */
const { values } = parseArgs({ options: { a: { type: "string" }, b: { type: "string" } } });
if (!values.a || !values.b) throw new Error("replan-pair : --a et --b, les fichiers --json de chaque côté");
const A = gather(values.a.split(","));
const B = gather(values.b.split(","));

/** The lines of one size: the records of both sides matched by seed. */
function pairLines(size) {
  const bySeed = new Map(A.bySize[size].map((record) => [record.seed, record]));
  const pairs = B.bySize[size].filter((record) => bySeed.has(record.seed)).map((b) => [bySeed.get(b.seed), b]);
  const of = (side, name, key) => pairs.map((pair) => pair[side][name][key]);
  const gapOf = (name, key) => gap(paired(of(1, name, key), of(0, name, key)));
  const names = Object.keys(pairs[0][0]).filter((name) => name !== "seed" && name !== "timetable" && name in pairs[0][1]);
  const lines = [`## ${size} : ${pairs.length} collèges appariés ; B − A (A : ${A.meta.variant} ; B : ${B.meta.variant})`];
  if (pairs[0][0].timetable && pairs[0][1].timetable) {
    lines.push(`- l'emploi du temps : coût ${fmt(mean(of(0, "timetable", "cost")))} → ${fmt(mean(of(1, "timetable", "cost")))}, écart ${gapOf("timetable", "cost")} ; S9 ${fmt(mean(of(0, "timetable", "S9")))} → ${fmt(mean(of(1, "timetable", "S9")))} h, écart ${gapOf("timetable", "S9")}`);
  }
  for (const name of names) lines.push(`- ${name} : perdues ${gapOf(name, "lost")} ; changées ${gapOf(name, "changes")} ; souple ${gapOf(name, "soft")}`);
  return `${lines.join("\n")}\n`;
}

for (const size of Object.keys(B.bySize)) if (A.bySize[size]) console.log(pairLines(size));
