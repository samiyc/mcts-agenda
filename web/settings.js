import { lockDivision, lockedCount, unlockDivision } from "../src/sandbox/locks.js";
import { cycleHalf, setWeight, teacherWeek, weightRows } from "../src/view/settings.js";
import { choicesOf, namesOf } from "../src/view/week.js";
import { el } from "./draw.js";

/**
 * The sandbox's panel (docs/modele.md § 14): the soft weights, a teacher's half-days, the locks of the division shown.
 * What each control changes is decided in src/view/settings.js and src/sandbox/; this module draws, and hands the new
 * settings to `ctx.change(edits, stale)` (`stale`: the timetable must be built again for them to count).
 */
const $ = (id) => /** @type {any} */ (document.getElementById(id));

function weightRow(row, ctx) {
  const input = el("input", { type: "number", min: "0", step: "1", value: String(row.value), "aria-label": `poids de ${row.key}` });
  input.addEventListener("change", () => ctx.change(setWeight(ctx.edits, row.key, Number(input.value)), true));
  return el("tr", { class: row.changed ? "changed" : "" }, [el("td", {}, [row.key]), el("td", {}, [row.label]), el("td", {}, [input]), el("td", { class: "num" }, [String(row.base)])]);
}

function drawWeights(ctx) {
  const head = el("thead", {}, [el("tr", {}, ["", "Souple", "Poids", "Par défaut"].map((name) => el("th", {}, [name])))]);
  $("weights").replaceChildren(el("table", {}, [head, el("tbody", {}, weightRows(ctx.edits).map((row) => weightRow(row, ctx)))]));
}

function halfButton(ctx, teacher, day, half) {
  const button = el("button", { type: "button", class: `half h-${half.state}`, title: half.title }, [half.label || "—"]);
  if (half.state === "closed" || half.state === "elsewhere") button.setAttribute("disabled", "");
  button.addEventListener("click", () => ctx.change(cycleHalf(ctx.drawn, ctx.edits, teacher, { day: day.day, half: half.half }), true));
  return button;
}

function drawTeacher(ctx) {
  const teacher = Number($("teacher").value);
  const week = teacherWeek(ctx.drawn, ctx.edits, teacher);
  const rows = ["matin", "après-midi"].map((name, half) =>
    el("tr", {}, [el("th", {}, [name]), ...week.map((day) => el("td", {}, [halfButton(ctx, teacher, day, day.halves[half])]))]),
  );
  const head = el("thead", {}, [el("tr", {}, [el("th", {}, [""]), ...week.map((day) => el("th", {}, [day.name]))])]);
  $("teacher-week").replaceChildren(el("table", { class: "halves" }, [head, el("tbody", {}, rows)]));
}

function lockButton(name, action) {
  const button = el("button", { type: "button" }, [name]);
  button.addEventListener("click", action);
  return button;
}

/** The locks of the division shown, or how many courses are locked in all. */
function drawLocks(ctx) {
  const total = Object.keys(ctx.edits.locks).length;
  const all = el("p", {}, [`${total} cours verrouillé${total > 1 ? "s" : ""} en tout dans ce collège.`]);
  if (ctx.view.kind !== "division" || !ctx.timetable) {
    $("locks").replaceChildren(all, el("p", { class: "hint" }, ["Choisir « Une division » dans « Voir » pour verrouiller sa semaine."]));
    return;
  }
  const d = ctx.view.id;
  const { locked, of } = lockedCount(ctx.edits, ctx.drawn, d);
  const name = namesOf(ctx.drawn).division[d];
  $("locks").replaceChildren(
    all,
    el("p", {}, [`${name} : ${locked} cours verrouillés sur ${of}.`]),
    lockButton(`Verrouiller la semaine de ${name}`, () => ctx.change(lockDivision(ctx.edits, ctx.drawn, ctx.timetable, d), false)),
    " ",
    lockButton("Déverrouiller", () => ctx.change(unlockDivision(ctx.edits, ctx.drawn, d), false)),
  );
}

/** Fills the teachers' list once a collège is drawn. */
export function fillTeachers(drawn) {
  const keep = $("teacher").value;
  $("teacher").replaceChildren(...choicesOf(drawn, "teacher").map(({ id, name }) => el("option", { value: String(id) }, [name])));
  if (keep && Number(keep) < drawn.teachers.length) $("teacher").value = keep;
}

/**
 * Draws the panel.
 * @param {{ drawn: any, edits: any, timetable: any, view: { kind: string, id: number }, change: (edits: any, stale: boolean) => void }} ctx
 */
export function drawSettings(ctx) {
  drawWeights(ctx);
  drawTeacher(ctx);
  drawLocks(ctx);
}
