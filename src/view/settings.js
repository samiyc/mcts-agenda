import { WEIGHTS } from "../rules/soft.js";
import { DAYS, MORNING, hasLunch } from "../time.js";
import { SOFT_LABELS } from "./costs.js";

/**
 * What the sandbox's panel shows and what a click changes (docs/modele.md § 14), decided here so that it is tested:
 * the soft weights beside their default, and a teacher's week by half-days, each free, avoided (« préfère pas »,
 * soft) or away (« indisponible », hard); a half-day the collège's draw already puts elsewhere (another
 * établissement) stays so. Settings in, new settings out.
 */
export const HALF_STATES = Object.freeze(["free", "avoid", "away"]);
export const HALF_NAMES = Object.freeze({ free: "libre", avoid: "préfère pas", away: "indisponible", elsewhere: "ailleurs (tiré)", closed: "" });
const HALF_DAY_NAMES = ["matin", "après-midi"];

/** The weights, each with its label, its value now and its default. */
export function weightRows(edits) {
  return Object.entries(WEIGHTS).map(([key, base]) => {
    const value = edits.weights[key] ?? base;
    return { key, label: SOFT_LABELS[key], value, base, changed: value !== base };
  });
}

/** Settings with weight `key` at `value`; its default again drops it. */
export function setWeight(edits, key, value) {
  const weights = { ...edits.weights };
  if (value === WEIGHTS[key] || !Number.isFinite(value) || value < 0) delete weights[key];
  else weights[key] = value;
  return { ...edits, weights };
}

/** The slots of a half-day: the morning's first four, or the afternoon's; none on Wednesday afternoon. */
export function halfSlots(day, half) {
  const { first, count } = DAYS[day];
  if (half === 1 && !hasLunch(day)) return [];
  const [from, to] = half === 0 ? [0, Math.min(MORNING, count)] : [MORNING, count];
  return Array.from({ length: to - from }, (_, i) => first + from + i);
}

function stateOf(drawn, edit, slots) {
  if (slots.length === 0) return "closed";
  if (slots.every((slot) => drawn.unavailable[slot])) return "elsewhere";
  if (edit && slots.every((slot) => edit.away.includes(slot))) return "away";
  return edit && slots.every((slot) => edit.avoid.includes(slot)) ? "avoid" : "free";
}

/**
 * A teacher's week by half-days, as the panel draws it.
 * @param {import("../types.js").School} drawn the collège as drawn, before the settings
 * @param {import("../types.js").Edits} edits
 * @param {number} teacher
 */
export function teacherWeek(drawn, edits, teacher) {
  const edit = edits.teachers[teacher];
  return DAYS.map((day, d) => ({
    day: d,
    name: day.name,
    halves: [0, 1].map((half) => {
      const state = stateOf(drawn.teachers[teacher], edit, halfSlots(d, half));
      return { half, state, label: HALF_NAMES[state], title: `${day.name} ${HALF_DAY_NAMES[half]}` };
    }),
  }));
}

/** Settings where the half-day goes to its next state: free, then avoided, then away, then free again. */
export function cycleHalf(drawn, edits, teacher, { day, half }) {
  const slots = halfSlots(day, half);
  const state = stateOf(drawn.teachers[teacher], edits.teachers[teacher], slots);
  if (state === "closed" || state === "elsewhere") return edits;
  const next = HALF_STATES[(HALF_STATES.indexOf(state) + 1) % HALF_STATES.length];
  const old = edits.teachers[teacher] ?? { away: [], avoid: [] };
  const without = (list) => list.filter((slot) => !slots.includes(slot));
  const edit = { away: without(old.away), avoid: without(old.avoid) };
  if (next !== "free") edit[next] = [...edit[next], ...slots].sort((a, b) => a - b);
  const teachers = { ...edits.teachers, [teacher]: edit };
  if (edit.away.length === 0 && edit.avoid.length === 0) delete teachers[teacher];
  return { ...edits, teachers };
}
