import { KNOWN_NAMES, TOLD_NAMES, absenceLines, addAbsence, removeAbsence, setVolunteer, volunteerRows, withDrawn } from "../src/view/absences.js";
import { choicesOf } from "../src/view/week.js";
import { DAYS } from "../src/time.js";
import { el } from "./draw.js";

/**
 * The absences chosen by hand (docs/modele.md § 14): the list, a form to add one, a drawn week to start from, the
 * week A or B, the volunteers. What each control changes is decided in src/view/absences.js; this module draws, and
 * hands the new settings to `ctx.change(edits)`.
 */
const $ = (id) => /** @type {any} */ (document.getElementById(id));
const select = (id, options) => el("select", { id }, options.map(({ value, name }) => el("option", { value: String(value) }, [name])));
const days = DAYS.map((day, value) => ({ value, name: day.name }));
const entriesOf = (names) => Object.entries(names).map(([value, name]) => ({ value, name }));
/** The latest context: the form, drawn once, adds to the settings as they are now. */
let current = null;

function drawList(ctx) {
  const lines = absenceLines(ctx.school, ctx.edits);
  const items = lines.map((text, i) => {
    const button = el("button", { type: "button" }, ["Retirer"]);
    button.addEventListener("click", () => ctx.change(removeAbsence(ctx.edits, i)));
    return el("li", {}, [text, " ", button]);
  });
  $("hand-list").replaceChildren(...(items.length ? items : [el("li", {}, ["Aucune absence : en ajouter une, ou partir d'une semaine tirée."])]));
}

function drawForm(ctx) {
  const add = el("button", { type: "button" }, ["Ajouter"]);
  const fields = [
    el("label", {}, ["Professeur", select("hand-teacher", choicesOf(ctx.school, "teacher").map(({ id, name }) => ({ value: id, name })))]),
    el("label", {}, ["du", select("hand-from", days)]),
    el("label", {}, ["au", select("hand-to", days)]),
    el("label", {}, ["", select("hand-known", entriesOf(KNOWN_NAMES))]),
    el("label", {}, ["", select("hand-told", entriesOf(TOLD_NAMES))]),
  ];
  $("hand-form").replaceChildren(...fields, add);
  add.addEventListener("click", () => {
    const absence = { teacher: Number($("hand-teacher").value), from: Number($("hand-from").value), to: Number($("hand-to").value), known: $("hand-known").value, told: $("hand-told").value };
    const { edits, error } = addAbsence(current.edits, absence);
    $("hand-note").textContent = error ? `Refusée : ${error}.` : "";
    if (!error) current.change(edits);
  });
}

function drawVolunteers(ctx) {
  const rows = volunteerRows(ctx.school, ctx.edits).map((row) => {
    const input = el("input", { type: "number", min: "0", max: "4", step: "1", value: String(row.hours), "aria-label": `heures de ${row.name}` });
    input.addEventListener("change", () => ctx.change(setVolunteer(ctx.edits, ctx.school, row.teacher, Number(input.value))));
    return el("tr", { class: row.hours ? "changed" : "" }, [el("td", {}, [row.name]), el("td", {}, [input])]);
  });
  $("volunteers").replaceChildren(el("table", {}, [el("tbody", {}, rows)]));
}

/**
 * Draws the editor; the form only once a collège, so that what is being typed stays.
 * @param {{ school: any, edits: any, fresh: boolean, drawSeed: number, change: (edits: any) => void }} ctx
 */
export function drawHand(ctx) {
  current = ctx;
  drawList(ctx);
  if (ctx.fresh) drawForm(ctx);
  $("hand-week").value = String(ctx.edits.week);
  $("hand-week").onchange = () => ctx.change({ ...ctx.edits, week: Number($("hand-week").value) });
  $("hand-draw").onclick = () => ctx.change(withDrawn(ctx.edits, ctx.school, ctx.drawSeed));
  drawVolunteers(ctx);
}
