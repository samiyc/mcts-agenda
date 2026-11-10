import { p0, p1 } from "../src/absence/rules.js";
import { drawWeek } from "../src/absence/scenario.js";
import { replanSearch } from "../src/absence/search.js";
import { buildGreedy } from "../src/build/greedy.js";
import { createSchool } from "../src/school/generate.js";
import { anneal } from "../src/search/anneal.js";
import { playWeek } from "../src/view/replan.js";

/**
 * Plays a week of absences away from the page (docs/modele.md § 10): the timetable in place (R0's, or the annealing's
 * from it), the week drawn as the measures draw it (the collège's seed × 1000 + the week's number), then the rule,
 * moment after moment. Only the placements, the absences and the moments travel back.
 */
const PLACE_TRIES = 700000;
const RULES = { p0: () => p0, p1: () => p1 };

/** The rule asked: P0, P1, or the search with its budget (« r200000 »). */
const ruleOf = (name, seed) => RULES[name]?.() ?? replanSearch({ tries: Number(name.slice(1)), seed });

self.onmessage = ({ data: { size, seed, place, week, rule } }) => {
  const school = createSchool({ size, seed });
  const built = buildGreedy(school, { seed }).timetable;
  const timetable = place === "anneal" ? anneal(school, built, { seed, tries: PLACE_TRIES }).timetable : built;
  const scenario = drawWeek(school, seed * 1000 + week);
  const start = performance.now();
  const { moments, score } = playWeek(school, timetable, scenario, ruleOf(rule, seed * 1000 + week));
  self.postMessage({ timetable, scenario, moments, score, ms: performance.now() - start });
};
