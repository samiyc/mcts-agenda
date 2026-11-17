import { dayCapOf } from "../rules/day.js";
import { DAY_MAX } from "../sandbox/edits.js";
import { unlockLinks } from "../sandbox/locks.js";
import { WEIGHTS } from "../rules/soft.js";
import { DAYS, MORNING, hasLunch } from "../time.js";
import { SOFT_LABELS } from "./costs.js";

/**
 * What the sandbox's panel shows and what a click changes (docs/modele.md § 14), decided here so that it is tested:
 * the soft weights beside their default, and a teacher's week by half-days, each free, avoided (« préfère pas »,
 * soft) or away (« indisponible », hard); a half-day the collège's draw already puts elsewhere (another
 * établissement) stays so. Since 17/11: a teacher's most hours a day (D10), a division's half-days kept from lessons
 * (D11), the room imposed on a course (D3). Settings in, new settings out.
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
  const edit = { ...old, away: without(old.away), avoid: without(old.avoid) };
  if (next !== "free") edit[next] = [...edit[next], ...slots].sort((a, b) => a - b);
  return withTeacher(edits, teacher, edit);
}

/** Settings with `edit` for `teacher`, dropped when it sets nothing. */
function withTeacher(edits, teacher, edit) {
  const teachers = { ...edits.teachers, [teacher]: edit };
  if (edit.away.length === 0 && edit.avoid.length === 0 && edit.dayMax === undefined) delete teachers[teacher];
  return { ...edits, teachers };
}

/** A teacher's most hours a day: the one set, and the model's own (six in EPS, else none). */
export function dayMaxOf(drawn, edits, teacher) {
  const base = dayCapOf(drawn.teachers[teacher]);
  return { value: edits.teachers[teacher]?.dayMax ?? null, base: base > DAY_MAX.high ? null : base };
}

/** Settings with `teacher`'s most hours a day at `value`; empty, out of 1 to 8, or not a whole number drops it. */
export function setDayMax(edits, teacher, value) {
  const old = edits.teachers[teacher] ?? { away: [], avoid: [] };
  const edit = { away: old.away, avoid: old.avoid };
  const ok = Number.isInteger(value) && value >= DAY_MAX.low && value <= DAY_MAX.high;
  return withTeacher(edits, teacher, ok ? { ...edit, dayMax: value } : edit);
}

const DIVISION_NAMES = Object.freeze({ free: "libre", kept: "pas de cours", closed: "" });

function keptState(slots, away) {
  if (slots.length === 0) return "closed";
  return slots.every((slot) => away.includes(slot)) ? "kept" : "free";
}

/** A division's week by half-days: free or kept from lessons (« pas de cours »); none on Wednesday afternoon. */
export function divisionWeek(edits, division) {
  const away = edits.divisions[division]?.away ?? [];
  return DAYS.map((day, d) => ({
    day: d,
    name: day.name,
    halves: [0, 1].map((half) => {
      const state = keptState(halfSlots(d, half), away);
      return { half, state, label: DIVISION_NAMES[state], title: `${day.name} ${HALF_DAY_NAMES[half]}` };
    }),
  }));
}

/** Settings where a division's half-day goes from free to kept from lessons, and back. */
export function cycleDivisionHalf(edits, division, { day, half }) {
  const slots = halfSlots(day, half);
  if (slots.length === 0) return edits;
  const old = edits.divisions[division]?.away ?? [];
  const kept = slots.every((slot) => old.includes(slot));
  const away = kept ? old.filter((slot) => !slots.includes(slot)) : [...new Set([...old, ...slots])].sort((a, b) => a - b);
  const divisions = { ...edits.divisions, [division]: { away } };
  if (away.length === 0) delete divisions[division];
  return { ...edits, divisions };
}

/**
 * The rooms course `id` may be given, of its kind, the one imposed marked.
 * @param {import("../types.js").School} drawn
 * @param {import("../types.js").Edits} edits
 * @param {number} id
 */
export function roomChoices(drawn, edits, id) {
  const { kind } = drawn.courses[id];
  return drawn.rooms.filter((room) => room.kind === kind).map((room) => ({ id: room.id, name: room.name, chosen: edits.rooms[id] === room.id }));
}

/** Settings with `room` imposed on course `id` (null: none); its barrette, if locked, is let go, to be placed again. */
export function setRoom(edits, drawn, id, room) {
  const rooms = { ...edits.rooms };
  if (room === null) delete rooms[id];
  else rooms[id] = room;
  const freed = edits.locks[id] ? unlockLinks(edits, drawn, [drawn.courses[id].link]) : edits;
  return { ...freed, rooms };
}
