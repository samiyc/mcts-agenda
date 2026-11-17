import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runWeek } from "../src/absence/run.js";
import { drawWeek } from "../src/absence/scenario.js";
import { replanSearch } from "../src/absence/search.js";
import { buildGreedy } from "../src/build/greedy.js";
import { evaluate } from "../src/evaluate.js";
import { WEIGHTS } from "../src/rules/soft.js";
import { createSchool } from "../src/school/generate.js";
import { anneal } from "../src/search/anneal.js";
import { SLOTS, WEEKS, weeksOf } from "../src/time.js";

/**
 * S9, the cover (docs/modele.md § 3.2, J10): the hours of a discipline at a slot when every colleague of it who is
 * there is in class. It weighs 0 unless set; set, the search lowers it, and its running cost stays the evaluator's.
 */
const school = createSchool({ size: "S", seed: 3 });
const { timetable } = buildGreedy(school, { seed: 3 });
const covered = (w) => ({ ...school, weights: { ...WEIGHTS, S9: w } });

/** Who teaches when in `found`: "teacher-week-slot" keys. */
function takingOf(found) {
  const taking = new Set();
  for (const c of school.courses.filter((course) => found.slot[course.id] >= 0)) {
    for (const week of weeksOf(c.weeks)) for (let k = 0; k < c.length; k += 1) taking.add(`${c.teacher}-${week}-${found.slot[c.id] + k}`);
  }
  return taking;
}

/** S9 counted the plain way: by discipline, week and slot, who is there and who teaches. */
function plainCover(found) {
  const taking = takingOf(found);
  const cells = [];
  for (const d of new Set(school.teachers.map((t) => t.discipline))) {
    for (let week = 0; week < WEEKS; week += 1) for (let slot = 0; slot < SLOTS; slot += 1) cells.push({ d, week, slot });
  }
  return cells.reduce((hours, { d, week, slot }) => {
    const there = school.teachers.filter((t) => t.discipline === d && !t.unavailable[slot]);
    const busy = there.filter((t) => taking.has(`${t.id}-${week}-${slot}`)).length;
    return hours + (busy > 0 && busy === there.length ? busy : 0);
  }, 0);
}

describe("the cover (S9)", () => {
  it("counts the hours without a free colleague of the discipline, and costs nothing at its default weight", () => {
    const { soft, cost } = evaluate(school, timetable);
    assert.equal(soft.S9, plainCover(timetable));
    assert.ok(soft.S9 > 0);
    const others = Object.entries(soft).reduce((sum, [key, n]) => sum + (key === "S9" ? 0 : WEIGHTS[key] * n), 0);
    assert.equal(cost, others);
  });

  it("is lowered by the annealing once weighed, its running cost the evaluator's", () => {
    const plain = anneal(covered(0), timetable, { seed: 3, tries: 60000 });
    const weighed = anneal(covered(3), timetable, { seed: 3, tries: 60000 });
    assert.equal(weighed.cost, evaluate(covered(3), weighed.timetable).cost);
    assert.ok(evaluate(school, weighed.timetable).soft.S9 < evaluate(school, plain.timetable).soft.S9);
  });

  it("leaves the replanning alone: a week costs the same whatever its weight", () => {
    const scenario = drawWeek(school, 3007);
    const score = (w) => runWeek(covered(w), timetable, scenario, replanSearch({ tries: 4000, seed: 3 })).score;
    assert.deepEqual(score(3), score(0));
  });
});
