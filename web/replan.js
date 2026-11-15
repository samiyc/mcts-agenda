import { applyEdits } from "../src/sandbox/edits.js";
import { createSchool } from "../src/school/generate.js";
import { STATUS_NAMES, absenceRows, busiestDivision, changeRows, dayOfMoment, momentName, planAt, sideOf } from "../src/view/replan.js";
import { VIEWS, choicesOf } from "../src/view/week.js";
import { drawHand } from "./absences.js";
import { el, weekTable } from "./draw.js";
import { loadEdits, saveEdits } from "./storage.js";

/**
 * The replacement page (docs/modele.md § 10): a week of absences played in a worker by P0, P1 or the search, then
 * replayed here moment by moment: the week of a division, a teacher or a room before and after, the changes, the
 * absences known so far. The timetable in place keeps the sandbox's settings (docs/modele.md § 14), and the week may be
 * the absences chosen by hand (`absences.js`).
 */
/** The page's controls by id. */
const $ = (id) => /** @type {any} */ (document.getElementById(id));
const LAST = 10;
const STEP_MS = 1400;
const state = { drawn: null, edits: null, school: null, timetable: null, scenario: null, moments: null, k: LAST, timer: 0 };
const worker = new Worker(new URL("./replan-worker.js", import.meta.url), { type: "module" });

const fill = (select, options) => select.replaceChildren(...options.map(({ value, name }) => el("option", { value }, [name])));
const hours = (h) => `${h.toFixed(1).replace(".", ",")} h`;

function scoreText(score) {
  const changed = String(score.changes).replace(".", ",");
  return `Heures perdues ${hours(score.lost)}, séances changées ${changed}, coût souple ${score.soft}, heures remplacées ${hours(score.replaced)}.`;
}

function drawAbsences() {
  const rows = absenceRows(state.school, state.scenario, state.k);
  const items = rows.map((row) => el("li", { class: row.revealed ? "" : "unknown" }, [el("strong", {}, [row.teacher]), ` absent ${row.days}, ${row.known}${row.revealed ? "" : " (pas encore)"}.`]));
  $("absences").replaceChildren(...(items.length ? items : [el("li", {}, ["Aucune absence cette semaine : essayer une autre semaine."])]));
}

function drawChanges(plan) {
  const rows = changeRows(state.school, plan);
  $("changes-title").textContent = `Ce qui a changé dans la semaine (${rows.length})`;
  $("changes").replaceChildren(...rows.map((row) => el("li", { class: `st-${row.status}` }, [el("em", { class: "tag" }, [STATUS_NAMES[row.status]]), ` ${row.when} · ${row.what} : ${row.became}.`])));
}

function draw() {
  if (!state.moments) return;
  const snapshot = state.moments[state.k];
  const plan = planAt(state.school, state.timetable, state.scenario.week, snapshot);
  const view = { kind: $("kind").value, id: Number($("which").value) };
  const today = dayOfMoment(state.k);
  $("moment").value = String(state.k);
  $("moment-name").textContent = `${state.k} / ${LAST} : ${momentName(state.k)}`;
  $("after-title").textContent = `Après : ${momentName(state.k)}`;
  $("before").replaceChildren(weekTable(sideOf(state.school, plan, view, "before"), today));
  $("after").replaceChildren(weekTable(sideOf(state.school, plan, view, "after"), today));
  $("score").textContent = scoreText(snapshot.score);
  drawAbsences();
  drawChanges(plan);
}

function chooseKind(id = 0) {
  fill($("which"), choicesOf(state.school, $("kind").value).map(({ id: value, name }) => ({ value, name })));
  $("which").value = String(id);
  draw();
}

function go(k) {
  state.k = Math.max(0, Math.min(LAST, k));
  draw();
}

function stop() {
  clearInterval(state.timer);
  state.timer = 0;
  $("play").textContent = "Lire";
}

function play() {
  if (state.timer) return stop();
  if (state.k === LAST) go(0);
  $("play").textContent = "Pause";
  state.timer = /** @type {any} */ (setInterval(() => (state.k >= LAST ? stop() : go(state.k + 1)), STEP_MS));
}

worker.onmessage = ({ data }) => {
  Object.assign(state, { timetable: data.timetable, scenario: data.scenario, moments: data.moments, k: LAST });
  const { absences, week } = data.scenario;
  $("summary").textContent = `Semaine ${week === 0 ? "A" : "B"}, ${absences.length} absence${absences.length > 1 ? "s" : ""}, jouée en ${(data.ms / 1000).toFixed(1)} s.`;
  $("run").disabled = false;
  $("kind").value = "division";
  chooseKind(busiestDivision(state.school, planAt(state.school, state.timetable, week, data.moments[LAST])));
};

const weekNumber = () => Math.max(1, Math.floor(Number($("week").value) || 1));

/** The settings now, kept, and the editor drawn again. */
function change(edits, fresh = false) {
  state.edits = edits;
  state.school = applyEdits(state.drawn, edits);
  saveEdits(edits);
  drawHand({ school: state.school, edits, fresh, drawSeed: state.drawn.seed * 1000 + weekNumber(), change });
}

/** The collège of the controls, with the settings kept for it; the editor shown when the absences are by hand. */
function prepare() {
  const size = /** @type {"S" | "M" | "L"} */ ($("size").value);
  const seed = Math.max(1, Math.floor(Number($("seed").value) || 1));
  const fresh = !state.drawn || state.drawn.size !== size || state.drawn.seed !== seed;
  if (fresh) state.drawn = createSchool({ size, seed });
  $("hand").hidden = $("source").value !== "hand";
  change(fresh ? loadEdits(state.drawn) : state.edits, fresh);
}

function run() {
  stop();
  prepare();
  const { size, seed } = state.drawn;
  state.moments = null;
  $("run").disabled = true;
  $("summary").textContent = "La semaine se joue…";
  worker.postMessage({ size, seed, place: $("place").value, week: weekNumber(), rule: $("rule").value, edits: state.edits, source: $("source").value });
}

fill($("kind"), Object.entries(VIEWS).map(([value, name]) => ({ value, name })));
$("run").addEventListener("click", run);
$("source").addEventListener("change", prepare);
$("size").addEventListener("change", prepare);
$("seed").addEventListener("change", prepare);
$("kind").addEventListener("change", () => chooseKind());
$("which").addEventListener("change", draw);
$("moment").addEventListener("input", () => go(Number($("moment").value)));
$("first").addEventListener("click", () => go(0));
$("back").addEventListener("click", () => go(state.k - 1));
$("next").addEventListener("click", () => go(state.k + 1));
$("last").addEventListener("click", () => go(LAST));
$("play").addEventListener("click", play);
run();
