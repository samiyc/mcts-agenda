import { DAYS, SLOTS } from "../time.js";
import { changesOf, lengthOf, orphan, planOf, shareOf } from "./plan.js";
import { softOf } from "./soft.js";

/**
 * A week of absences played out (docs/modele.md § 4): day after day, the evening before (« veille », 18 h) then the
 * morning (« matin », 7 h 30), the absences known by then are revealed, and the rule decides. A change decided the
 * evening before weighs half a change of the morning (Q-P16). Then the week is scored, in this order (Q-S4):
 * - **lost**: the hours of a division nobody taught (a session whose teacher is away: an étude), by share of division;
 * - **changes**: the sessions changed, weighted;
 * - **soft**: the soft cost of the week as it now stands (`soft.js`), an étude left where its course was;
 * - **the replacements**: the hours each volunteer gave, the most of them for fairness.
 * Beside them, **over**: the études beyond the two the vie scolaire can watch at once (H), slot by slot; and
 * **notices**: the changes announced moment after moment, weighted the same, so that a session moved twice, or moved
 * then put back, counts twice (J6).
 *
 * `scenario.hidden` (J6): an absence learned day after day (`told: "daily"`, `scenario.js`) reveals its first day that
 * morning, then each further day the evening before it (`"veille"`, the teacher calls by 18 h, H) or only that
 * morning (`"matin"`, a variant); that it is over, at the same moment of the day after its last. Without it (J5),
 * every absence comes with its length.
 */
export const MOMENTS = Object.freeze(["veille", "matin"]);
const WEIGHTS = Object.freeze({ veille: 0.5, matin: 1 });
/** Études the vie scolaire can watch at once (H). */
export const STUDY_ROOMS = 2;

const setAbsent = (plan, teacher, day) => (plan.absent[teacher * DAYS.length + day] = 1);

/** An absence learned day after day, the further days at `news`: its first day, a further day, or its end. */
function revealDaily(plan, a, { day, moment, news }) {
  const { from, days } = plan.ongoing;
  if (day === a.from && moment === a.known) {
    setAbsent(plan, a.teacher, day);
    from[a.teacher] = day;
    days[a.teacher] = 1;
  } else if (moment === news && day > a.from && day <= a.to) {
    setAbsent(plan, a.teacher, day);
    days[a.teacher] = day - a.from + 1;
  } else if (moment === news && day === a.to + 1) from[a.teacher] = -1;
}

function reveal(plan, scenario, day, moment) {
  for (const a of scenario.absences) {
    if (scenario.hidden && a.told === "daily") revealDaily(plan, a, { day, moment, news: scenario.hidden });
    else if (a.from === day && a.known === moment) for (let d = a.from; d <= a.to; d += 1) setAbsent(plan, a.teacher, d);
  }
}

/** @param {import("./plan.js").Plan} plan */
export function scoreOf(plan) {
  const studies = new Uint8Array(SLOTS);
  let lost = 0;
  for (let s = 0; s < plan.course.length; s += 1) {
    if (!orphan(plan, s)) continue;
    lost += lengthOf(plan, s) * shareOf(plan, s);
    for (let k = 0; k < lengthOf(plan, s); k += 1) studies[plan.slot[s] + k] += 1;
  }
  const over = studies.reduce((sum, n) => sum + Math.max(0, n - STUDY_ROOMS), 0);
  const given = Array.from(plan.replacements);
  return { lost, changes: changesOf(plan), notices: plan.notices, soft: softOf(plan), replaced: given.reduce((a, b) => a + b, 0), mostReplaced: Math.max(0, ...given), over };
}

/** Adds to `plan.notices` the sessions a moment of weight `weight` changed since `seen`, then updates `seen`. */
function notice(plan, seen, weight) {
  for (let s = 0; s < plan.course.length; s += 1) {
    if (plan.slot[s] === seen.slot[s] && plan.teacher[s] === seen.teacher[s] && plan.room[s] === seen.room[s]) continue;
    plan.notices += weight;
    seen.slot[s] = plan.slot[s];
    seen.teacher[s] = plan.teacher[s];
    seen.room[s] = plan.room[s];
  }
}

/**
 * @param {import("../types.js").School} school
 * @param {import("../types.js").Timetable} timetable the timetable in place
 * @param {ReturnType<typeof import("./scenario.js").drawWeek> & { hidden?: false | "veille" | "matin" }} scenario
 *   `hidden`: lengths learned day after day, each further day at that moment (J6)
 * @param {(plan: import("./plan.js").Plan, ctx: { day: number, moment: string, weight: number, budget: Uint8Array }) => void} rule
 */
export function runWeek(school, timetable, scenario, rule) {
  const plan = planOf(school, timetable, scenario.week);
  const seen = { slot: plan.slot.slice(), teacher: plan.teacher.slice(), room: plan.room.slice() };
  for (let day = 0; day < DAYS.length; day += 1) {
    for (const moment of MOMENTS) {
      reveal(plan, scenario, day, moment);
      rule(plan, { day, moment, weight: WEIGHTS[moment], budget: scenario.budget });
      notice(plan, seen, WEIGHTS[moment]);
    }
  }
  return { plan, score: scoreOf(plan) };
}
