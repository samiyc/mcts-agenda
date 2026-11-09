import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The costs the XHSTT site publishes for the solutions of an instance (its dataset page, saved under
 * data/xhstt/pages/<file>.html): rows `{ group, infeasibility, objective }`. A page without a « Feasibility value »
 * column lists feasible solutions only. Rows without an objective (a lower bound alone) are left out.
 */
/** The text of a cell: its tags dropped (each piece after a « < » keeps what follows its « > »), spaces folded. */
const cellText = (html) =>
  html
    .split("<")
    .map((piece, i) => (i === 0 ? piece : piece.slice(piece.indexOf(">") + 1)))
    .join(" ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/** The cells of each row of the solutions table, its header first. */
function rowsOf(html) {
  const header = html.indexOf("SolutionGroup");
  if (header < 0) return [];
  const start = html.lastIndexOf("<table", header);
  const table = html.slice(start, html.indexOf("</table>", start));
  return table.split(/<tr[^>]*>/).map((row) => [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => cellText(m[1])));
}

/** @returns {{ group: string, infeasibility: number, objective: number }[] | null} null when there is no page */
export function publishedOf(dir, file) {
  const path = join(dir, file.replace(/\.xml$/, ".html"));
  if (!existsSync(path)) return null;
  const [header = [], ...rows] = rowsOf(readFileSync(path, "utf8"));
  const objective = header.findIndex((h) => /objective/i.test(h));
  const feasibility = header.findIndex((h) => /feasibility/i.test(h));
  if (objective < 0) return [];
  return rows
    .filter((cells) => /^\d+/.test(cells[objective] ?? ""))
    .map((cells) => ({ group: cells[0], infeasibility: feasibility < 0 ? 0 : Number(cells[feasibility]), objective: parseInt(cells[objective], 10) }));
}
