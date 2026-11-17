import { moveLink, optionsFor } from "../src/sandbox/moves.js";
import { roomChoices, setRoom } from "../src/view/settings.js";
import { pupilsOf, titleOf } from "../src/view/week.js";
import { slotName } from "../src/time.js";
import { el } from "./draw.js";

/**
 * Moving a course by hand (docs/modele.md § 14): a click on a course of the week opens the slots its barrette may go
 * to (`optionsFor`), the cheapest first, each with what it adds to the soft cost; choosing one moves it there and
 * locks it (`moveLink`). The page then shows the timetable moved, without building it again. A room can also be
 * imposed on the course (`setRoom`): it counts at the next build, its barrette let go if it was locked.
 */
const $ = (id) => /** @type {any} */ (document.getElementById(id));
const signed = (n) => (n > 0 ? `+${n}` : String(n));

/** The words for barrette `link`: its courses, its slot now. */
function headOf(school, timetable, link) {
  const ids = school.links[link];
  const what = ids.map((id) => `${titleOf(school, school.courses[id])} (${pupilsOf(school, school.courses[id])})`).join(", ");
  const at = timetable.slot[ids[0]];
  return `${what} : ${at >= 0 ? slotName(at) : "non placé"}${ids.length > 1 ? ", une barrette : ses cours bougent ensemble" : ""}.`;
}

/** The room to impose on course `id`, or none. */
function roomRow(ctx, id) {
  const choices = roomChoices(ctx.drawn, ctx.edits, id);
  const none = el("option", { value: "" }, ["aucune (au choix de la règle)"]);
  const select = el("select", { "aria-label": "la salle imposée" }, [none, ...choices.map((room) => el("option", { value: String(room.id) }, [room.name]))]);
  const chosen = choices.find((room) => room.chosen);
  select.value = chosen ? String(chosen.id) : "";
  select.addEventListener("change", () => {
    ctx.change(setRoom(ctx.edits, ctx.drawn, id, select.value === "" ? null : Number(select.value)), true);
    $("move-section").hidden = true;
  });
  return el("p", {}, [el("label", {}, ["Salle imposée à ce cours ", select])]);
}

/**
 * Opens the panel for course `id`.
 * @param {{ school: any, drawn: any, edits: any, timetable: any, move: (moved: { edits: any, timetable: any }) => void, change: (edits: any, stale: boolean) => void }} ctx
 * @param {number} id
 */
export function openMove(ctx, id) {
  const { school, timetable } = ctx;
  const link = school.courses[id].link;
  const options = optionsFor(school, timetable, link);
  const select = el("select", { id: "move-slot", "aria-label": "le nouveau créneau" }, options.map((o, i) => el("option", { value: String(i) }, [`${o.name} (coût ${signed(o.delta)})`])));
  const go = el("button", { type: "button" }, ["Déplacer et verrouiller"]);
  const close = el("button", { type: "button" }, ["Fermer"]);
  go.addEventListener("click", () => ctx.move(moveLink(ctx.edits, school, timetable, { link, ...options[Number(select.value)] })));
  close.addEventListener("click", () => ($("move-section").hidden = true));
  const none = el("p", {}, ["Aucun autre créneau possible sans casser une contrainte dure : déplacer d'abord un autre cours, ou changer une disponibilité."]);
  $("move").replaceChildren(el("p", {}, [headOf(school, timetable, link)]), ...(options.length ? [el("label", {}, ["Vers ", select]), " ", go] : [none]), " ", close, roomRow(ctx, id));
  $("move-section").hidden = false;
}
