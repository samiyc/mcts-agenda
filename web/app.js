import { evaluate } from "../src/evaluate.js";
import { createSchool } from "../src/school/generate.js";
import { costRows, unplacedRows } from "../src/view/costs.js";
import { VIEWS, choicesOf, weekOf } from "../src/view/week.js";
import { costTables, el, unplacedItems, weekTable } from "./draw.js";

/**
 * The page (docs/modele.md § 10): a collège drawn from its size and seed, its timetable built by R0 or R0-naïf in a
 * worker, and the week of one division, teacher or room, A and B side by side, with the costs and the courses left.
 */
/** The page's controls by id: inputs, selects and buttons alike. */
const $ = (id) => /** @type {any} */ (document.getElementById(id));
const RULES = { r0: "R0", naive: "R0-naïf" };
const SEARCHES = { anneal: "le recuit", tabu: "le tabou" };
const state = { school: null, timetable: null, rule: "r0", search: "", seconds: 5 };
const worker = new Worker(new URL("./build-worker.js", import.meta.url), { type: "module" });

const fill = (select, options) => select.replaceChildren(...options.map(({ value, name }) => el("option", { value }, [name])));

function drawWeek() {
  if (!state.timetable) return;
  const view = { kind: $("kind").value, id: Number($("which").value) };
  const week = weekOf(state.school, state.timetable, view);
  $("week-a").replaceChildren(weekTable(week[0]));
  $("week-b").replaceChildren(weekTable(week[1]));
}

function chooseKind() {
  fill($("which"), choicesOf(state.school, $("kind").value).map(({ id, name }) => ({ value: id, name })));
  drawWeek();
}

const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;

function placedText(left) {
  const plural = left > 1 ? "s" : "";
  return left ? `${left} cours non placé${plural}` : "tous les cours placés";
}

const countLeft = (unplaced) => unplaced.reduce((sum, { courses }) => sum + courses.length, 0);

function summary(built, before, unplaced, after) {
  const { school } = state;
  const head = `${school.courses.length} cours en ${school.links.length} barrettes, ${school.teachers.length} professeurs, ${school.rooms.length} salles.`;
  const rule = `${RULES[state.rule]} : ${placedText(countLeft(built.unplaced))}, infaisabilité ${before.infeasibility}, coût ${before.cost}, en ${seconds(built.ms)}.`;
  if (!after) return `${head} ${rule}`;
  return `${head} ${rule} Puis ${SEARCHES[state.search]} : ${placedText(countLeft(unplaced))}, infaisabilité ${after.evaluation.infeasibility}, coût ${after.evaluation.cost}, en ${seconds(after.ms)}.`;
}

/** The barrettes the rule left that the search did not place either. */
const stillLeft = (unplaced, timetable) => unplaced.filter(({ courses }) => timetable.slot[courses[0]] < 0);

worker.onmessage = ({ data: { built, searched } }) => {
  const before = evaluate(state.school, built);
  const after = searched && { evaluation: evaluate(state.school, searched), ms: searched.ms };
  const shown = searched ?? built;
  const unplaced = stillLeft(built.unplaced, shown);
  state.timetable = { slot: shown.slot, room: shown.room };
  $("summary").textContent = summary(built, before, unplaced, after);
  $("costs").replaceChildren(...costTables(costRows(after?.evaluation ?? before), after ? costRows(before) : null));
  const left = unplacedRows(state.school, unplaced);
  $("unplaced-section").hidden = left.length === 0;
  $("unplaced").replaceChildren(...unplacedItems(left));
  $("build").disabled = false;
  drawWeek();
};

function build() {
  const size = /** @type {"S" | "M" | "L"} */ ($("size").value);
  const seed = Math.max(1, Math.floor(Number($("seed").value) || 1));
  state.rule = $("rule").value;
  state.search = $("search").value;
  state.seconds = Number($("seconds").value);
  state.school = createSchool({ size, seed });
  state.timetable = null;
  $("build").disabled = true;
  const then = state.search ? `, puis ${SEARCHES[state.search]} le reprend pendant ${state.seconds} s` : "";
  $("summary").textContent = `${RULES[state.rule]} construit l'emploi du temps du collège ${size}, graine ${seed}${then}…`;
  chooseKind();
  worker.postMessage({ size, seed, rule: state.rule, search: state.search, seconds: state.seconds });
}

fill($("kind"), Object.entries(VIEWS).map(([value, name]) => ({ value, name })));
$("build").addEventListener("click", build);
$("kind").addEventListener("change", chooseKind);
$("which").addEventListener("change", drawWeek);
build();
