import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { evaluateSolution } from "../src/xhstt/evaluate.js";
import { readInstance } from "../src/xhstt/instance.js";
import { readArchive } from "../src/xhstt/solution.js";
import { parseXml } from "../src/xhstt/xml.js";
import { publishedOf } from "./xhstt-pages.js";

/**
 * The XHSTT-2014 bench (docs/modele.md § 13): its 25 instances, read from the archive of all instances
 * (`data/xhstt/all`, docs/mesures-j4.md), where they carry the corrections made since 2014 and the solutions the site
 * publishes; with the best known solution of each, the least (infeasibility, objective) among the values of its page
 * and the solutions of its file, evaluated by ours.
 */
export const BENCH = Object.freeze(
  "AU-BG-98 AU-SA-96 AU-TE-99 BR-SA-00 BR-SM-00 BR-SN-00 DK-FG-12 DK-HG-12 DK-VG-09 UK-SP-06 FI-PB-98 FI-WP-06 FI-MP-06 GR-H1-97 GR-P3-10 GR-PA-08 IT-I4-96 KS-PR-11 NL-KP-03 NL-KP-05 NL-KP-09 ZA-LW-09 ZA-WD-09 ES-SS-08 US-WS-09".split(" "),
);

/** Is (a) better than (b), infeasibility first? */
export const lexLess = (a, b) => a.infeasibility < b.infeasibility || (a.infeasibility === b.infeasibility && a.objective < b.objective);

function bestKnown(file, pages, instance, solutions) {
  const rows = [...(publishedOf(pages, file) ?? [])];
  for (const solution of solutions) rows.push({ group: solution.group, ...evaluateSolution(instance, solution) });
  return rows.reduce((best, row) => (best === null || lexLess(row, best) ? { infeasibility: row.infeasibility, objective: row.objective, group: row.group } : best), null);
}

/**
 * The bench's instances whose id is in `only` (all when empty), in the bench's order.
 * @param {{ dir?: string, pages?: string, only?: string[] }} [options]
 */
export function loadBench(options = {}) {
  const { dir, pages, only } = { dir: "data/xhstt/all", pages: "data/xhstt/pages", only: [], ...options };
  const wanted = new Set(only.length ? only : BENCH);
  const found = new Map();
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".xml"))) {
    const text = readFileSync(join(dir, file), "utf8");
    const id = idOf(text);
    if (wanted.has(id)) found.set(id, entryOf(id, file, { text, pages }));
  }
  return BENCH.filter((id) => found.has(id)).map((id) => found.get(id));
}

function entryOf(id, file, { text, pages }) {
  const { instances, solutions } = readArchive(parseXml(text), readInstance);
  const instance = instances.get(id);
  return { id, file, instance, best: bestKnown(file, pages, instance, solutions) };
}

/** The id of the first instance of an archive's text. */
const idOf = (text) => /<Instance Id="([^"]*)"/.exec(text)?.[1] ?? "";
