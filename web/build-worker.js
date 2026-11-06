import { buildGreedy, buildNaive } from "../src/build/greedy.js";
import { createSchool } from "../src/school/generate.js";

/**
 * Builds a timetable away from the page, which stays responsive: R0 takes up to 7 s on a large collège. The page
 * draws the same collège from the same seed; only the placements travel back.
 */
self.onmessage = ({ data: { size, seed, rule } }) => {
  const school = createSchool({ size, seed });
  const start = performance.now();
  const built = rule === "naive" ? buildNaive(school) : buildGreedy(school, { seed });
  self.postMessage({ ...built.timetable, unplaced: built.unplaced, ms: performance.now() - start });
};
