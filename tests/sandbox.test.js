import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runWeek } from "../src/absence/run.js";
import { p1 } from "../src/absence/rules.js";
import { planOf } from "../src/absence/plan.js";
import { softOf } from "../src/absence/soft.js";
import { buildGreedy } from "../src/build/greedy.js";
import { evaluate } from "../src/evaluate.js";
import { applyEdits, emptyEdits, readEdits, scenarioOf } from "../src/sandbox/edits.js";
import { createSchool } from "../src/school/generate.js";
import { anneal } from "../src/search/anneal.js";
import { tabu } from "../src/search/tabu.js";
import { weeksOf } from "../src/time.js";

/** The sandbox (docs/modele.md § 14): settings by hand on a drawn collège, which leave the model alone when empty. */
const school = createSchool({ size: "S", seed: 2 });
const { timetable } = buildGreedy(school, { seed: 2 });
const roundTrip = (edits) => readEdits(JSON.parse(JSON.stringify(edits)), school);
/** A barrette of several courses, and a lone course. */
const barrette = school.links.find((ids) => ids.length > 1);
const lone = school.links.find((ids) => ids.length === 1)[0];
const lockOf = (ids) => Object.fromEntries(ids.map((id) => [id, { slot: timetable.slot[id], room: timetable.room[id] }]));

describe("the sandbox's settings", () => {
  it("come back from JSON as they went, and empty ones change nothing", () => {
    const edits = { ...emptyEdits("S", 2), weights: { S2: 6 }, teachers: { 3: { away: [9, 10], avoid: [31] } }, locks: lockOf(barrette) };
    edits.absences = [{ teacher: 1, from: 1, to: 2, known: "veille", told: "whole" }];
    assert.deepEqual(roundTrip(edits), edits);
    const same = applyEdits(school, emptyEdits("S", 2));
    assert.deepEqual(same.teachers, school.teachers);
    assert.deepEqual(same.courses, school.courses);
  });

  it("refuse what does not fit the collège, in words", () => {
    const bad = (change) => assert.throws(() => readEdits({ ...emptyEdits("S", 2), ...change }, school), Error);
    bad({ seed: 3 });
    bad({ version: 9 });
    bad({ weights: { S9: 1 } });
    bad({ weights: { S1: -1 } });
    bad({ teachers: { 999: { away: [], avoid: [] } } });
    bad({ teachers: { 0: { away: [40], avoid: [] } } });
    bad({ locks: lockOf(barrette.slice(0, 1)) });
    bad({ absences: [{ teacher: 0, from: 3, to: 1, known: "veille" }] });
    assert.throws(() => readEdits({ ...emptyEdits("S", 2), seed: 3 }, school), /graine 3/);
  });

  it("put the slots away and avoided on a copy of the teacher, the drawn collège left as it was", () => {
    const before = school.teachers[3].unavailable.slice();
    const edited = applyEdits(school, { ...emptyEdits("S", 2), teachers: { 3: { away: [9, 10], avoid: [31] } } });
    assert.deepEqual([edited.teachers[3].unavailable[9], edited.teachers[3].unavailable[10], edited.teachers[3].avoid[31]], [1, 1, 1]);
    assert.deepEqual(school.teachers[3].unavailable, before);
    assert.equal(school.teachers[3].avoid, undefined);
  });

  it("mark the locked courses with their place, and only them", () => {
    const edited = applyEdits(school, { ...emptyEdits("S", 2), locks: lockOf([lone]) });
    assert.deepEqual(edited.courses[lone].fixed, { slot: timetable.slot[lone], room: timetable.room[lone] });
    assert.equal(edited.courses.filter((c) => c.fixed).length, 1);
  });

  it("make a week of absences that runWeek plays, the volunteers by hand or the collège's", () => {
    const edits = { ...emptyEdits("S", 2), absences: [{ teacher: 1, from: 1, to: 2, known: "matin", told: "daily" }], week: 1, volunteers: { 4: 2 } };
    const scenario = scenarioOf(school, edits);
    assert.deepEqual([scenario.week, scenario.budget[4], scenario.budget.reduce((a, b) => a + b, 0)], [1, 2, 2]);
    const { plan } = runWeek(school, timetable, scenario, p1);
    assert.equal(plan.week, 1);
    assert.ok(scenarioOf(school, { ...edits, volunteers: null }).budget.some((h) => h > 0));
  });
});

describe("the sandbox's weights and avoided slots", () => {
  /** A teacher's first placed course: where to put an avoided slot. */
  const course = school.courses.find((c) => timetable.slot[c.id] >= 0);
  const avoided = { ...emptyEdits("S", 2), weights: { S2: 6 }, teachers: { [course.teacher]: { away: [], avoid: [timetable.slot[course.id]] } } };
  const edited = applyEdits(school, avoided);

  it("leave the costs as they were when empty", () => {
    assert.deepEqual(evaluate(applyEdits(school, emptyEdits("S", 2)), timetable), evaluate(school, timetable));
  });

  it("weigh each soft constraint as set, and count an hour given on an avoided slot in S3", () => {
    const [before, after] = [evaluate(school, timetable), evaluate(edited, timetable)];
    assert.equal(after.soft.S3 - before.soft.S3, weeksOf(course.weeks).length);
    const extra = 3 * after.soft.S2 + 5 * (after.soft.S3 - before.soft.S3);
    assert.equal(after.cost - before.cost, extra);
  });

  it("are what the searches and the replanning count too", () => {
    for (const search of [anneal, tabu]) {
      const found = search(edited, timetable, { seed: 3, tries: 20000 });
      assert.equal(found.cost, evaluate(edited, found.timetable).cost);
    }
    const weeks = [0, 1].map((week) => softOf(planOf(edited, timetable, week)));
    assert.equal(weeks[0] + weeks[1], evaluate(edited, timetable).cost);
  });
});
