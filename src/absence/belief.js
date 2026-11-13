import { DAYS } from "../time.js";
import { ABSENCES } from "./scenario.js";

/**
 * What the search believes of the days to come, teacher by teacher (J6, docs/modele.md § 7): the odds that he is away
 * on each day, as a table by teacher and day. A day known away counts 1. An absence whose length is not known yet
 * (`plan.ongoing`, `run.js`) makes the days after the last one known uncertain; the beliefs differ there only:
 * - **known**, J5's search as it was: he comes back tomorrow (0);
 * - **worst**: he stays as long as an absence may last (1 up to its third day);
 * - **odds**: the odds the scenario gives (`scenario.js`, lengths of 1 to 3 days alike): known away `k` days, he is
 *   away on its `n`-th day with odds (longest − n + 1) / (longest − k + 1). The search knows how lengths are drawn (H).
 */
export const BELIEFS = Object.freeze(["known", "worst", "odds"]);

/** The odds he is away the `n`-th day of an absence, known for `k` days so far. */
function oddsAt(belief, n, k) {
  if (belief === "known") return 0;
  if (belief === "worst") return n <= ABSENCES.longest ? 1 : 0;
  return Math.max(0, ABSENCES.longest - n + 1) / (ABSENCES.longest - k + 1);
}

/**
 * @param {import("./plan.js").Plan} plan
 * @param {"known" | "worst" | "odds"} belief
 */
export function oddsOf(plan, belief) {
  const odds = Float32Array.from(plan.absent);
  const { from, days } = plan.ongoing;
  for (let t = 0; t < from.length; t += 1) {
    if (from[t] < 0) continue;
    for (let day = from[t] + days[t]; day < DAYS.length; day += 1) odds[t * DAYS.length + day] = oddsAt(belief, day - from[t] + 1, days[t]);
  }
  return odds;
}
