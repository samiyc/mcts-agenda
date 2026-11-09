import { streamOf } from "mcts-commun/random.js";
import { DAYS, WEEKS } from "../time.js";

/**
 * A week of absences, drawn from a seed (docs/modele.md § 4). Every figure is a hypothesis (H, Q-P17):
 * - each teacher misses a day a month on average: an absence starts on a given day with probability 1/40 (twenty
 *   school days a month, two days an absence on average);
 * - it lasts 1, 2 or 3 days alike, cut at Friday; its length is known as soon as the absence is (J6 drops this);
 * - two in three are known the evening before their first day (« veille »), one in three the same morning (« matin »).
 * Which week of the timetable it is, A or B, is drawn too. The volunteers for replacements are drawn once a collège
 * (Q-P14: one teacher in five). A volunteer gives 18 hours a year (the Pacte's replacement share), half an hour a
 * week over 36 weeks: here, each week, one volunteer in four can give up to 2 hours, the others none (H). The
 * replacement rate this gives P1 matches the published ones: 13 % of the hours of short absences in 2024-2025, 13 to
 * 19 % in collèges (the ministry's yearly review, as relayed by the unions; docs/recherche/sources.md).
 */
export const ABSENCES = Object.freeze({ startRate: 1 / 40, longest: 3, knownBefore: 2 / 3, volunteers: 0.2, available: 0.25, hours: 2 });

/**
 * @param {import("../types.js").School} school
 * @param {number} seed
 * @returns {{ seed: number, week: number, budget: Uint8Array, absences: { teacher: number, from: number, to: number, known: "veille" | "matin" }[] }}
 */
export function drawWeek(school, seed) {
  const rng = streamOf(seed, 11);
  const week = rng.int(WEEKS);
  const volunteers = volunteersOf(school);
  const budget = Uint8Array.from(volunteers, (v) => (v && rng.next() < ABSENCES.available ? ABSENCES.hours : 0));
  const absences = [];
  for (const teacher of school.teachers) {
    let day = 0;
    while (day < DAYS.length) {
      if (rng.next() >= ABSENCES.startRate) {
        day += 1;
        continue;
      }
      const to = Math.min(DAYS.length - 1, day + rng.int(ABSENCES.longest));
      absences.push({ teacher: teacher.id, from: day, to, known: /** @type {"veille" | "matin"} */ (rng.next() < ABSENCES.knownBefore ? "veille" : "matin") });
      day = to + 1;
    }
  }
  return { seed, week, budget, absences };
}

/**
 * The teachers who accept replacements, a fifth of them (Q-P14), drawn from the collège's seed: flags by teacher.
 * @param {import("../types.js").School} school
 */
export function volunteersOf(school) {
  const rng = streamOf(school.seed, 12);
  return Uint8Array.from(school.teachers, () => (rng.next() < ABSENCES.volunteers ? 1 : 0));
}
