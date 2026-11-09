import { DAYS, SLOTS } from "../time.js";
import { changesOf, lengthOf, orphan, planOf, shareOf } from "./plan.js";

/**
 * A week of absences played out (docs/modele.md § 4): day after day, the evening before (« veille », 18 h) then the
 * morning (« matin », 7 h 30), the absences known by then are revealed, and the rule decides. A change decided the
 * evening before weighs half a change of the morning (Q-P16). Then the week is scored, in this order (Q-S4):
 * - **lost**: the hours of a division nobody taught (a session whose teacher is away: an étude), by share of division;
 * - **changes**: the sessions changed, weighted;
 * - **the replacements**: the hours each volunteer gave, the most of them for fairness.
 * Beside them, **over**: the études beyond the two the vie scolaire can watch at once (H), slot by slot.
 */
export const MOMENTS = Object.freeze(["veille", "matin"]);
const WEIGHTS = Object.freeze({ veille: 0.5, matin: 1 });
/** Études the vie scolaire can watch at once (H). */
export const STUDY_ROOMS = 2;

function reveal(plan, scenario, day, moment) {
  for (const a of scenario.absences) {
    if (a.from !== day || a.known !== moment) continue;
    for (let d = a.from; d <= a.to; d += 1) plan.absent[a.teacher * DAYS.length + d] = 1;
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
  return { lost, changes: changesOf(plan), replaced: given.reduce((a, b) => a + b, 0), mostReplaced: Math.max(0, ...given), over };
}

/**
 * @param {import("../types.js").School} school
 * @param {import("../types.js").Timetable} timetable the timetable in place
 * @param {ReturnType<typeof import("./scenario.js").drawWeek>} scenario
 * @param {(plan: import("./plan.js").Plan, ctx: { day: number, moment: string, weight: number, budget: Uint8Array }) => void} rule
 */
export function runWeek(school, timetable, scenario, rule) {
  const plan = planOf(school, timetable, scenario.week);
  for (let day = 0; day < DAYS.length; day += 1) {
    for (const moment of MOMENTS) {
      reveal(plan, scenario, day, moment);
      rule(plan, { day, moment, weight: WEIGHTS[moment], budget: scenario.budget });
    }
  }
  return { plan, score: scoreOf(plan) };
}
