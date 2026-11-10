import { orphan, planOf } from "../absence/plan.js";
import { MOMENTS, runWeek, scoreOf } from "../absence/run.js";
import { DAYS, SLOTS, slotName } from "../time.js";
import { namesOf, pupilsOf, titleOf } from "./week.js";

/**
 * What the replacement page shows (docs/modele.md § 10): a week of absences played by a rule, moment after moment;
 * the week of a division or a teacher before (the timetable in place) and after (the plan at that moment), each
 * session marked by what happened to it; the list of the changes; the absences, known or not yet.
 *
 * Moment 0 is the timetable in place; moment k (1 to 10) is after the rule's decision at the k-th moment of the week:
 * the evening before Monday, Monday morning, the evening before Tuesday...
 */
export const STATUS_NAMES = Object.freeze({ lost: "étude", replaced: "remplacé", moved: "déplacé", room: "autre salle", was: "changé" });

/** « la veille du mardi, 18 h », « mardi matin, 7 h 30 »; moment 0, the timetable in place. */
export function momentName(k) {
  if (k === 0) return "l'emploi du temps en place";
  const day = DAYS[Math.floor((k - 1) / 2)].name;
  return MOMENTS[(k - 1) % 2] === "veille" ? `la veille du ${day}, 18 h` : `${day} matin, 7 h 30`;
}

/** The day a moment decides about: the day of the evening before, or of the morning. */
export const dayOfMoment = (k) => (k === 0 ? -1 : Math.floor((k - 1) / 2));

/** What a plan is at a moment, to replay it on the page. */
const snapshotOf = (plan) => ({
  slot: plan.slot.slice(),
  teacher: plan.teacher.slice(),
  room: plan.room.slice(),
  changed: plan.changed.slice(),
  absent: plan.absent.slice(),
  score: scoreOf(plan),
});

/**
 * Plays a week with `rule`, keeping the plan after each moment: `moments[0]` is the timetable in place, then one a
 * moment, ten in all.
 * @param {import("../types.js").School} school
 * @param {import("../types.js").Timetable} timetable
 * @param {ReturnType<typeof import("../absence/scenario.js").drawWeek>} scenario
 * @param {(plan: any, ctx: any) => void} rule
 */
export function playWeek(school, timetable, scenario, rule) {
  const moments = [snapshotOf(planOf(school, timetable, scenario.week))];
  const watched = (plan, ctx) => {
    rule(plan, ctx);
    moments.push(snapshotOf(plan));
  };
  const { score } = runWeek(school, timetable, scenario, watched);
  return { moments, score };
}

/** The plan of the week at a moment: the timetable in place, its sessions set as the moment left them. */
export function planAt(school, timetable, week, snapshot) {
  const plan = planOf(school, timetable, week);
  for (const key of ["slot", "teacher", "room", "changed", "absent"]) plan[key].set(snapshot[key]);
  return plan;
}

/** What happened to session `s`: an étude, a replacement, a move, another room, or nothing (""). */
export function statusOf(plan, s) {
  if (orphan(plan, s)) return "lost";
  if (plan.teacher[s] !== plan.origin.teacher[s]) return "replaced";
  if (plan.slot[s] !== plan.origin.slot[s]) return "moved";
  return plan.room[s] !== plan.origin.room[s] ? "room" : "";
}

/** Where session `s` stands on one side: before (the timetable in place) or after (the plan). */
function placeOf(plan, s, side) {
  const from = side === "before" ? plan.origin : plan;
  return { slot: from.slot[s], teacher: from.teacher[s], room: from.room[s] };
}

function shows(course, place, { kind, id }) {
  if (kind === "division") return course.divisions.includes(id);
  return kind === "teacher" ? place.teacher === id : place.room === id;
}

function detailOf(school, course, place, kind) {
  const names = namesOf(school);
  const teacher = names.teacher[place.teacher];
  const room = names.room[place.room];
  const parts = { division: [teacher, room], teacher: [pupilsOf(school, course), room], room: [pupilsOf(school, course), teacher] }[kind];
  return parts.join(" · ");
}

/** An entry of the week, as `weekOf` makes it. */
const entryOf = (school, course, place, kind) => ({
  course: course.id,
  discipline: course.discipline,
  title: titleOf(school, course),
  group: kind === "division" && course.halves !== 3 ? `groupe ${course.halves}` : "",
  detail: detailOf(school, course, place, kind),
  status: "",
});

/**
 * One side of the week of a division, teacher or room, slot by slot, as `weekOf` gives it, each entry with its
 * `status`: after, what happened to the session; before, "was" when something will have.
 * @param {import("../types.js").School} school
 * @param {ReturnType<typeof planOf>} plan
 * @param {{ kind: "division" | "teacher" | "room", id: number }} view
 * @param {"before" | "after"} side
 */
export function sideOf(school, plan, view, side) {
  const cells = Array.from({ length: SLOTS }, () => []);
  for (let s = 0; s < plan.course.length; s += 1) {
    const course = school.courses[plan.course[s]];
    const place = placeOf(plan, s, side);
    if (!shows(course, place, view)) continue;
    const status = statusOf(plan, s);
    const entry = entryOf(school, course, place, view.kind);
    entry.status = side === "after" ? status : status && "was";
    for (let k = 0; k < course.length; k += 1) cells[place.slot + k].push({ ...entry, first: k === 0 });
  }
  return cells;
}

/** What a changed session became, in words. */
function becameOf(school, plan, s) {
  const names = namesOf(school);
  if (orphan(plan, s)) return "étude, son professeur est absent";
  const parts = [];
  if (plan.slot[s] !== plan.origin.slot[s]) parts.push(`déplacé au ${slotName(plan.slot[s])}`);
  if (plan.teacher[s] !== plan.origin.teacher[s]) parts.push(`remplacé par ${names.teacher[plan.teacher[s]]}`);
  if (plan.room[s] !== plan.origin.room[s]) parts.push(`en ${names.room[plan.room[s]]}`);
  return parts.join(", ");
}

/** The sessions that changed or are lost, in the order of the timetable in place: `{ status, when, what, became }`. */
export function changeRows(school, plan) {
  const rows = [];
  for (let s = 0; s < plan.course.length; s += 1) {
    const status = statusOf(plan, s);
    if (!status) continue;
    const course = school.courses[plan.course[s]];
    const what = `${titleOf(school, course)}, ${pupilsOf(school, course)} (${namesOf(school).teacher[plan.origin.teacher[s]]})`;
    rows.push({ status, slot: plan.origin.slot[s], when: slotName(plan.origin.slot[s]), what, became: becameOf(school, plan, s) });
  }
  return rows.sort((a, b) => a.slot - b.slot);
}

/** The moment an absence is known: the evening before its first day, or that morning. */
export const knownAt = (absence) => absence.from * MOMENTS.length + MOMENTS.indexOf(absence.known) + 1;

/** The absences of the week at moment `k`: who, which days, when known, and whether known yet. */
export function absenceRows(school, scenario, k) {
  const names = namesOf(school);
  return scenario.absences.map((a) => ({
    teacher: names.teacher[a.teacher],
    days: a.from === a.to ? `le ${DAYS[a.from].name}` : `du ${DAYS[a.from].name} au ${DAYS[a.to].name}`,
    known: `connue ${momentName(knownAt(a))}`,
    revealed: knownAt(a) <= k,
  }));
}

/** The division the plan changes most, to show first; the first division when none changes. */
export function busiestDivision(school, plan) {
  const counts = new Array(school.divisions.length).fill(0);
  for (let s = 0; s < plan.course.length; s += 1) if (statusOf(plan, s)) for (const d of school.courses[plan.course[s]].divisions) counts[d] += 1;
  return counts.indexOf(Math.max(...counts));
}
