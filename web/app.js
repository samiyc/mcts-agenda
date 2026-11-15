import { evaluate } from "../src/evaluate.js";
import { weightsOf } from "../src/rules/soft.js";
import { applyEdits, emptyEdits, readEdits } from "../src/sandbox/edits.js";
import { createSchool } from "../src/school/generate.js";
import { costRows, unplacedRows } from "../src/view/costs.js";
import { VIEWS, choicesOf, weekOf } from "../src/view/week.js";
import { costTables, el, unplacedItems, weekTable } from "./draw.js";
import { openMove } from "./move.js";
import { drawSettings, fillTeachers } from "./settings.js";
import { exportEdits, loadEdits, readFile, saveEdits } from "./storage.js";

/**
 * The page (docs/modele.md § 10): a collège drawn from its size and seed, its timetable built by R0 or R0-naïf in a
 * worker, and the week of one division, teacher or room, A and B side by side, with the costs and the courses left.
 * The sandbox (§ 14) changes it by hand: the weights, the teachers' half-days, the locks, a course moved; the settings
 * stay in the browser and go to a file.
 */
/** The page's controls by id: inputs, selects and buttons alike. */
const $ = (id) => /** @type {any} */ (document.getElementById(id));
const RULES = { r0: "R0", naive: "R0-naïf" };
const SEARCHES = { anneal: "le recuit", tabu: "le tabou" };
const state = { drawn: null, edits: null, school: null, timetable: null, rule: "r0", search: "", seconds: 5 };
const worker = new Worker(new URL("./build-worker.js", import.meta.url), { type: "module" });

const fill = (select, options) => select.replaceChildren(...options.map(({ value, name }) => el("option", { value }, [name])));
const viewOf = () => ({ kind: $("kind").value, id: Number($("which").value) });

/** The settings now, kept; `stale`: the timetable shown does not follow them until it is built again. */
function change(edits, stale) {
  state.edits = edits;
  state.school = applyEdits(state.drawn, edits);
  saveEdits(edits);
  if (stale) $("settings-note").textContent = "Réglages changés : « Construire » pour les appliquer.";
  drawAll();
}

function drawWeek() {
  if (!state.timetable) return;
  const week = weekOf(state.school, state.timetable, viewOf());
  $("week-a").replaceChildren(weekTable(week[0]));
  $("week-b").replaceChildren(weekTable(week[1]));
}

function drawAll() {
  drawWeek();
  drawSettings({ drawn: state.drawn, edits: state.edits, timetable: state.timetable, view: viewOf(), change });
}

function chooseKind() {
  fill($("which"), choicesOf(state.school, $("kind").value).map(({ id, name }) => ({ value: id, name })));
  drawAll();
}

const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;
const plural = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;
function placedText(left) {
  if (!left) return "tous les cours placés";
  return `${plural(left, "cours")} non placé${left > 1 ? "s" : ""}`;
}
const countLeft = (unplaced) => unplaced.reduce((sum, { courses }) => sum + courses.length, 0);

function summary(built, before, unplaced, after) {
  const { school } = state;
  const head = `${school.courses.length} cours en ${school.links.length} barrettes, ${school.teachers.length} professeurs, ${school.rooms.length} salles.`;
  const conflicts = built.unplaced.filter((u) => u.locked).length;
  const locks = conflicts ? ` ${plural(conflicts, "verrou")} en conflit : voir les cours non placés.` : "";
  const rule = `${RULES[state.rule]} : ${placedText(countLeft(built.unplaced))}, infaisabilité ${before.infeasibility}, coût ${before.cost}, en ${seconds(built.ms)}.${locks}`;
  if (!after) return `${head} ${rule}`;
  return `${head} ${rule} Puis ${SEARCHES[state.search]} : ${placedText(countLeft(unplaced))}, infaisabilité ${after.evaluation.infeasibility}, coût ${after.evaluation.cost}, en ${seconds(after.ms)}.`;
}

/** The barrettes the rule left that the search did not place either. */
const stillLeft = (unplaced, timetable) => unplaced.filter(({ courses }) => timetable.slot[courses[0]] < 0);

function drawCosts(now, before, unplaced) {
  const weights = weightsOf(state.school);
  $("costs").replaceChildren(...costTables(costRows(now, weights), before ? costRows(before, weights) : null));
  const left = unplacedRows(state.school, unplaced);
  $("unplaced-section").hidden = left.length === 0;
  $("unplaced").replaceChildren(...unplacedItems(left));
}

worker.onmessage = ({ data: { built, searched } }) => {
  const before = evaluate(state.school, built);
  const after = searched && { evaluation: evaluate(state.school, searched), ms: searched.ms };
  const shown = searched ?? built;
  const unplaced = stillLeft(built.unplaced, shown);
  state.timetable = { slot: shown.slot, room: shown.room };
  state.unplaced = unplaced;
  $("summary").textContent = summary(built, before, unplaced, after);
  drawCosts(after?.evaluation ?? before, after ? before : null, unplaced);
  $("build").disabled = false;
  drawAll();
};

/** Draws the collège of the controls, with the settings kept for it. */
function draw() {
  const size = /** @type {"S" | "M" | "L"} */ ($("size").value);
  const seed = Math.max(1, Math.floor(Number($("seed").value) || 1));
  if (!state.drawn || state.drawn.size !== size || state.drawn.seed !== seed) {
    state.drawn = createSchool({ size, seed });
    state.edits = loadEdits(state.drawn);
    fillTeachers(state.drawn);
  }
  state.school = applyEdits(state.drawn, state.edits);
}

function build() {
  draw();
  state.rule = $("rule").value;
  state.search = $("search").value;
  state.seconds = Number($("seconds").value);
  state.timetable = null;
  $("build").disabled = true;
  $("settings-note").textContent = "";
  $("move-section").hidden = true;
  const { size, seed } = state.drawn;
  const then = state.search ? `, puis ${SEARCHES[state.search]} le reprend pendant ${state.seconds} s` : "";
  $("summary").textContent = `${RULES[state.rule]} construit l'emploi du temps du collège ${size}, graine ${seed}${then}…`;
  chooseKind();
  worker.postMessage({ size, seed, rule: state.rule, search: state.search, seconds: state.seconds, edits: state.edits });
}

/** A course moved by hand: shown at once, costs again, locked there. */
function moved({ edits, timetable }) {
  state.timetable = timetable;
  change(edits, false);
  drawCosts(evaluate(state.school, timetable), null, stillLeft(state.unplaced ?? [], timetable));
  $("move-section").hidden = true;
}

function clickWeek(event) {
  const entry = event.target.closest("[data-course]");
  if (entry && state.timetable) openMove({ school: state.school, edits: state.edits, timetable: state.timetable, move: moved }, Number(entry.dataset.course));
}

async function importFile() {
  const file = $("import").files[0];
  if (!file) return;
  try {
    const value = await readFile(file);
    $("size").value = value.size;
    $("seed").value = String(value.seed);
    state.drawn = createSchool({ size: value.size, seed: value.seed });
    fillTeachers(state.drawn);
    state.edits = readEdits(value, state.drawn);
    saveEdits(state.edits);
    build();
  } catch (error) {
    $("settings-note").textContent = `Fichier refusé : ${error.message}.`;
  }
  $("import").value = "";
}

/** « Tout effacer » asks twice, without a dialog: the button says so, for a few seconds. */
function reset() {
  const button = $("reset");
  if (!button.dataset.armed) {
    button.dataset.armed = "1";
    button.textContent = "Cliquer encore pour tout effacer";
    setTimeout(() => {
      delete button.dataset.armed;
      button.textContent = "Tout effacer";
    }, 4000);
    return;
  }
  change(emptyEdits(state.drawn.size, state.drawn.seed), true);
}

fill($("kind"), Object.entries(VIEWS).map(([value, name]) => ({ value, name })));
$("build").addEventListener("click", build);
$("kind").addEventListener("change", chooseKind);
$("which").addEventListener("change", drawAll);
$("teacher").addEventListener("change", drawAll);
$("week-a").addEventListener("click", clickWeek);
$("week-b").addEventListener("click", clickWeek);
$("export").addEventListener("click", () => exportEdits(state.edits));
$("import").addEventListener("change", importFile);
$("reset").addEventListener("click", reset);
build();
