import { buildGreedy, buildNaive } from "../src/build/greedy.js";
import { applyEdits } from "../src/sandbox/edits.js";
import { createSchool } from "../src/school/generate.js";
import { anneal } from "../src/search/anneal.js";
import { tabu } from "../src/search/tabu.js";

/**
 * Builds a timetable away from the page, which stays responsive: R0 takes up to 6 s on a large collège, a search as
 * long as it is given. The page draws the same collège from the same seed; only the placements travel back: the
 * rule's timetable, then the search's from it when one is asked. The sandbox's settings come along (docs/modele.md § 14):
 * the collège is built with them on.
 */
const SEARCHES = { anneal, tabu };
/** Slots tried a millisecond (the bench, H): the budget of a search from its seconds. */
const RATES = { anneal: 140, tabu: 580 };

self.onmessage = ({ data: { size, seed, rule, search, seconds, edits } }) => {
  const drawn = createSchool({ size, seed });
  const school = edits ? applyEdits(drawn, edits) : drawn;
  const start = performance.now();
  const built = rule === "naive" ? buildNaive(school) : buildGreedy(school, { seed });
  const ms = performance.now() - start;
  if (!SEARCHES[search]) {
    self.postMessage({ built: { ...built.timetable, unplaced: built.unplaced, ms } });
    return;
  }
  const from = performance.now();
  const found = SEARCHES[search](school, built.timetable, { seed, tries: Math.round(seconds * 1000 * RATES[search]) });
  self.postMessage({ built: { ...built.timetable, unplaced: built.unplaced, ms }, searched: { ...found.timetable, ms: performance.now() - from } });
};
