import { DAYS } from "../src/time.js";

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

function entryNode(entry) {
  const title = entry.group ? `${entry.title}, ${entry.group}` : entry.title;
  return el("div", { class: `entry d-${entry.discipline}${entry.first ? "" : " cont"}` }, [
    el("strong", {}, [entry.first ? title : `${title} (suite)`]),
    el("small", {}, [entry.detail]),
  ]);
}

function cellNode(entries, day, index) {
  if (index >= DAYS[day].count) return el("td", { class: "closed" });
  const lunch = index === NOON ? " lunch" : "";
  return el("td", { class: `slot${lunch}` }, entries.map(entryNode));
}

/** One week of a view (`weekOf(...)[week]`) as a table. */
export function weekTable(cells) {
  const head = el("tr", {}, [el("th", {}, ["Heure"]), ...DAY_NAMES.map((name) => el("th", {}, [name]))]);
  const rows = Array.from({ length: HOURS }, (_, index) =>
    el("tr", {}, [
      el("th", { class: "hour" }, [`${8 + index} h`]),
      ...DAYS.map((day, d) => cellNode(cells[day.first + index] ?? [], d, index)),
    ]),
  );
  return el("table", { class: "week" }, [el("thead", {}, [head]), el("tbody", {}, rows)]);
}

const num = (value) => el("td", { class: "num" }, [String(value)]);

/** The hard and soft constraints, from `costRows`. */
export function costTables({ hard, soft }) {
  const hardRows = hard.map((row) => el("tr", { class: row.count ? "bad" : "" }, [el("td", {}, [row.key]), el("td", {}, [row.label]), num(row.count)]));
  const softRows = soft.map((row) =>
    el("tr", {}, [el("td", {}, [row.key]), el("td", {}, [row.label]), num(row.count), num(row.weight), num(row.cost)]),
  );
  const header = (names) => el("thead", {}, [el("tr", {}, names.map((name, i) => el("th", { class: i > 1 ? "num" : "" }, [name])))]);
  return [
    el("table", {}, [header(["", "Dure", "Nombre"]), el("tbody", {}, hardRows)]),
    el("table", {}, [header(["", "Souple", "Nombre", "Poids", "Coût"]), el("tbody", {}, softRows)]),
  ];
}

/** The courses left unplaced, from `unplacedRows`. */
export const unplacedItems = (rows) =>
  rows.map((row) => el("li", {}, [el("strong", {}, [`${row.title}, ${row.pupils}`]), ` (${row.teacher}) : ${row.why}.`]));
