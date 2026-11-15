import { moveLink, optionsFor } from "../src/sandbox/moves.js";
import { pupilsOf, titleOf } from "../src/view/week.js";
import { slotName } from "../src/time.js";
import { el } from "./draw.js";

/**
 * Moving a course by hand (docs/modele.md § 14): a click on a course of the week opens the slots its barrette may go
 * to (`optionsFor`), the cheapest first, each with what it adds to the soft cost; choosing one moves it there and
 * locks it (`moveLink`). The page then shows the timetable moved, without building it again.
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

/**
 * Opens the panel for course `id`.
 * @param {{ school: any, edits: any, timetable: any, move: (moved: { edits: any, timetable: any }) => void }} ctx
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
  $("move").replaceChildren(el("p", {}, [headOf(school, timetable, link)]), ...(options.length ? [el("label", {}, ["Vers ", select]), " ", go] : [none]), " ", close);
  $("move-section").hidden = false;
}
