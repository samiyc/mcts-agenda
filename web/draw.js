import { DAYS } from "../src/time.js";
import { STATUS_NAMES } from "../src/view/replan.js";

/**
 * The page's drawing: a week as a table (the days across, the hours down), the costs, the courses left unplaced.
 * What goes where is decided by src/view/; this module only builds the elements.
 */
const HOURS = Math.max(...DAYS.map((day) => day.count));
const NOON = 4;
const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

/** An element with its attributes and children (strings become text). */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
}

/** An entry's classes: its discipline, a block's second hour, what happened to it on the replacement page. */
const entryClass = (entry) => ["entry", "d-" + entry.discipline, entry.first ? "" : "cont", entry.status ? "st-" + entry.status : ""].filter(Boolean).join(" ");

function entryNode(entry) {
  const title = entry.group ? `${entry.title}, ${entry.group}` : entry.title;
  const tag = entry.status ? [el("em", { class: "tag" }, [STATUS_NAMES[entry.status]])] : [];
  return el("div", { class: entryClass(entry) }, [
    el("strong", {}, [entry.first ? title : `${title} (suite)`]),
    ...tag,
    el("small", {}, [entry.detail]),
  ]);
}

function cellNode(entries, day, index, today) {
  if (index >= DAYS[day].count) return el("td", { class: "closed" });
  const lunch = index === NOON ? " lunch" : "";
  return el("td", { class: `slot${lunch}${day === today ? " today" : ""}` }, entries.map(entryNode));
}

/** One week of a view (`weekOf(...)[week]`) as a table; `today`, a day to mark. */
export function weekTable(cells, today = -1) {
  const head = el("tr", {}, [el("th", {}, ["Heure"]), ...DAY_NAMES.map((name, d) => el("th", { class: d === today ? "today" : "" }, [name]))]);
  const rows = Array.from({ length: HOURS }, (_, index) =>
    el("tr", {}, [
      el("th", { class: "hour" }, [`${8 + index} h`]),
      ...DAYS.map((day, d) => cellNode(cells[day.first + index] ?? [], d, index, today)),
    ]),
  );
  return el("table", { class: "week" }, [el("thead", {}, [head]), el("tbody", {}, rows)]);
}

const num = (value) => el("td", { class: "num" }, [String(value)]);

const header = (names) => el("thead", {}, [el("tr", {}, names.map((name, i) => el("th", { class: i > 1 ? "num" : "" }, [name])))]);

/**
 * The hard and soft constraints, from `costRows`; with `before` (the rule's rows when a search ran), a column of
 * the rule's counts and costs beside.
 */
export function costTables({ hard, soft }, before = null) {
  const hardRows = hard.map((row, i) =>
    el("tr", { class: row.count ? "bad" : "" }, [el("td", {}, [row.key]), el("td", {}, [row.label]), ...(before ? [num(before.hard[i].count)] : []), num(row.count)]),
  );
  const softRows = soft.map((row, i) =>
    el("tr", {}, [el("td", {}, [row.key]), el("td", {}, [row.label]), num(row.count), num(row.weight), ...(before ? [num(before.soft[i].cost)] : []), num(row.cost)]),
  );
  const rule = before ? ["Règle"] : [];
  return [
    el("table", {}, [header(["", "Dure", ...rule, "Nombre"]), el("tbody", {}, hardRows)]),
    el("table", {}, [header(["", "Souple", "Nombre", "Poids", ...rule, "Coût"]), el("tbody", {}, softRows)]),
  ];
}

/** The courses left unplaced, from `unplacedRows`. */
export const unplacedItems = (rows) =>
  rows.map((row) => el("li", {}, [el("strong", {}, [`${row.title}, ${row.pupils}`]), ` (${row.teacher}) : ${row.why}.`]));
