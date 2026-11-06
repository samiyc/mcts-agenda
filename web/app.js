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
const state = { school: null, timetable: null, built: null, rule: "r0" };
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

function summary(evaluation, built) {
  const { school } = state;
  const left = built.unplaced.reduce((sum, { courses }) => sum + courses.length, 0);
  const plural = left > 1 ? "s" : "";
  const placed = left ? `${left} cours non placé${plural}` : "tous les cours placés";
  return `${school.courses.length} cours en ${school.links.length} barrettes, ${school.teachers.length} professeurs, ${school.rooms.length} salles. ${RULES[state.rule]} : ${placed}, infaisabilité ${evaluation.infeasibility}, coût ${evaluation.cost}, en ${(built.ms / 1000).toFixed(1)} s.`;
}

worker.onmessage = ({ data }) => {
  state.timetable = { slot: data.slot, room: data.room };
  const evaluation = evaluate(state.school, state.timetable);
  $("summary").textContent = summary(evaluation, data);
  $("costs").replaceChildren(...costTables(costRows(evaluation)));
  const left = unplacedRows(state.school, data.unplaced);
  $("unplaced-section").hidden = left.length === 0;
  $("unplaced").replaceChildren(...unplacedItems(left));
  $("build").disabled = false;
  drawWeek();
};

function build() {
  const size = /** @type {"S" | "M" | "L"} */ ($("size").value);
  const seed = Math.max(1, Math.floor(Number($("seed").value) || 1));
  state.rule = $("rule").value;
  state.school = createSchool({ size, seed });
  state.timetable = null;
  $("build").disabled = true;
  $("summary").textContent = `${RULES[state.rule]} construit l'emploi du temps du collège ${size}, graine ${seed}…`;
  chooseKind();
  worker.postMessage({ size, seed, rule: state.rule });
}

fill($("kind"), Object.entries(VIEWS).map(([value, name]) => ({ value, name })));
$("build").addEventListener("click", build);
$("kind").addEventListener("change", chooseKind);
$("which").addEventListener("change", drawWeek);
build();
