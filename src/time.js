/**
 * The week of the model (docs/modele.md § 2.1): one-hour slots from 8 h to 17 h, nine on Monday, Tuesday, Thursday
 * and Friday, four on Wednesday morning; 40 slots a week, on two weeks A and B. The afternoon of Wednesday does not
 * exist, so nothing can be placed there (D7).
 */
export const DAYS = Object.freeze([
  Object.freeze({ name: "lundi", first: 0, count: 9 }),
  Object.freeze({ name: "mardi", first: 9, count: 9 }),
  Object.freeze({ name: "mercredi", first: 18, count: 4 }),
  Object.freeze({ name: "jeudi", first: 22, count: 9 }),
  Object.freeze({ name: "vendredi", first: 31, count: 9 }),
]);
export const SLOTS = 40;
export const WEEKS = 2;
export const WEEK_NAMES = Object.freeze(["A", "B"]);
export const FIRST_HOUR = 8;
/** Slots of the morning: 8 h to 12 h. */
export const MORNING = 4;
/** The lunch window, 11 h to 14 h, by index in the day: two consecutive free slots there make the break (D5). */
export const LUNCH = Object.freeze([3, 4, 5]);
/** The first slot of « after 15 h » (S6). */
export const LATE = 7;

const DAY_OF = Uint8Array.from({ length: SLOTS }, (_, slot) =>
  DAYS.findIndex((day) => slot >= day.first && slot < day.first + day.count),
);
const WEEK_LISTS = Object.freeze({ AB: Object.freeze([0, 1]), A: Object.freeze([0]), B: Object.freeze([1]) });

export const dayOf = (slot) => DAY_OF[slot];
export const indexInDay = (slot) => slot - DAYS[DAY_OF[slot]].first;
export const hourOf = (slot) => FIRST_HOUR + indexInDay(slot);
/** 0 the morning, 1 the afternoon. */
export const halfOf = (slot) => (indexInDay(slot) < MORNING ? 0 : 1);
/** The weeks of a course: [0, 1] for "AB", [0] for "A", [1] for "B". */
export const weeksOf = (weeks) => WEEK_LISTS[weeks];
/** Whether a day has an afternoon, hence a lunch break to keep. */
export const hasLunch = (day) => DAYS[day].count > MORNING;

/** Whether a course of `length` slots starting at `slot` stays inside one half-day (D8). */
export function fits(slot, length) {
  const end = slot + length - 1;
  return end < SLOTS && dayOf(end) === dayOf(slot) && halfOf(end) === halfOf(slot);
}

/** « lundi 10 h » */
export const slotName = (slot) => `${DAYS[dayOf(slot)].name} ${hourOf(slot)} h`;
