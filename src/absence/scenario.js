import { streamOf } from "mcts-commun/random.js";
import { DAYS, WEEKS } from "../time.js";

/**
 * A week of absences, drawn from a seed (docs/modele.md § 4). Every figure is a hypothesis (H, Q-P17):
 * - each teacher misses 9 % of his hours (J9, 16/11/2026): an absence starts on a given day with probability 1/18.
 *   The collèges lose 7.8 % of their hours to short absences not replaced (DEPP, 2024-2025) and replace 13 to 19 % of
 *   them: about 9 % of the hours are missed (our arithmetic, docs/recherche/questions.md, Q-P17). Before J9, 1/40, a
 *   day a month, 4.3 % of the hours;
 * - it lasts 1, 2 or 3 days alike, cut at Friday;
 * - two in three are known the evening before their first day (« veille »), with their length (a training, an
 *   outing); one in three the same morning (« matin »), an illness: half of these come with their length (a sick note
 *   with its end, `told: "whole"`), the other half are learned day after day (`told: "daily"`), each further day the
 *   evening before it, the day after the last one too (J6, docs/modele.md § 4).
 * The `told` flags are drawn on a stream of their own, after the rest: the absences are J5's, seed for seed;
 * `toldWhole` changes the share of morning absences that come with their length (a variant, J6).
 * Which week of the timetable it is, A or B, is drawn too. The volunteers for replacements are drawn once a collège
 * (Q-P14: one teacher in five). A volunteer gives 18 hours a year (the Pacte's replacement share), half an hour a
 * week over 36 weeks: here, each week, one volunteer in four can give up to 2 hours, the others none (H). The
 * replacement rate this gives P1 matches the published ones: 13 % of the hours of short absences in 2024-2025, 13 to
 * 19 % in collèges (the ministry's yearly review, as relayed by the unions; docs/recherche/sources.md).
 */
export const ABSENCES = Object.freeze({ startRate: 1 / 18, longest: 3, knownBefore: 2 / 3, toldWhole: 0.5, volunteers: 0.2, available: 0.25, hours: 2 });

/**
 * @param {import("../types.js").School} school
 * @param {number} seed
 * @param {{ toldWhole?: number }} [options]
 * @returns {{ seed: number, week: number, budget: Uint8Array, absences: { teacher: number, from: number, to: number, known: "veille" | "matin", told: "whole" | "daily" }[] }}
 */
export function drawWeek(school, seed, { toldWhole = ABSENCES.toldWhole } = {}) {
  const rng = streamOf(seed, 11);
  const week = rng.int(WEEKS);
  const volunteers = volunteersOf(school);
  const budget = Uint8Array.from(volunteers, (v) => (v && rng.next() < ABSENCES.available ? ABSENCES.hours : 0));
  const absences = school.teachers.flatMap((teacher) => absencesOf(teacher.id, rng));
  const told = streamOf(seed, 13);
  for (const a of absences) if (a.known === "matin" && told.next() >= toldWhole) a.told = "daily";
  return { seed, week, budget, absences };
}

/** A teacher's absences of the week, day after day. */
function absencesOf(teacher, rng) {
  const absences = [];
  let day = 0;
  while (day < DAYS.length) {
    if (rng.next() >= ABSENCES.startRate) {
      day += 1;
      continue;
    }
    const to = Math.min(DAYS.length - 1, day + rng.int(ABSENCES.longest));
    const known = /** @type {"veille" | "matin"} */ (rng.next() < ABSENCES.knownBefore ? "veille" : "matin");
    absences.push({ teacher, from: day, to, known, told: /** @type {"whole" | "daily"} */ ("whole") });
    day = to + 1;
  }
  return absences;
}

/**
 * The teachers who accept replacements, a fifth of them (Q-P14), drawn from the collège's seed: flags by teacher.
 * @param {import("../types.js").School} school
 */
export function volunteersOf(school) {
  const rng = streamOf(school.seed, 12);
  return Uint8Array.from(school.teachers, () => (rng.next() < ABSENCES.volunteers ? 1 : 0));
}
