import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { drawWeek, volunteersOf } from "../src/absence/scenario.js";
import { buildGreedy } from "../src/build/greedy.js";
import { evaluate } from "../src/evaluate.js";
import { applyEdits, emptyEdits } from "../src/sandbox/edits.js";
import { moveLink, optionsFor } from "../src/sandbox/moves.js";
import { createSchool } from "../src/school/generate.js";
import { absenceLines, addAbsence, removeAbsence, setVolunteer, volunteerRows, withDrawn } from "../src/view/absences.js";
import { cycleHalf, halfSlots, setWeight, teacherWeek, weightRows } from "../src/view/settings.js";

/** What the sandbox's panel shows and does (docs/modele.md § 14): the weights, a teacher's half-days, a course moved. */
const drawn = createSchool({ size: "S", seed: 2 });
const empty = emptyEdits("S", 2);
const { timetable } = buildGreedy(drawn, { seed: 2 });

describe("the sandbox's panel", () => {
  it("shows each weight beside its default, and drops one set back to it", () => {
    const six = setWeight(empty, "S2", 6);
    assert.deepEqual(weightRows(six).find((r) => r.key === "S2"), { key: "S2", label: "les trous des professeurs", value: 6, base: 3, changed: true });
    assert.deepEqual(setWeight(six, "S2", 3).weights, {});
    assert.deepEqual(setWeight(six, "S2", -1).weights, {});
  });

  it("cuts the week in half-days, Wednesday without an afternoon", () => {
    assert.deepEqual([halfSlots(0, 0), halfSlots(0, 1), halfSlots(2, 0), halfSlots(2, 1)], [[0, 1, 2, 3], [4, 5, 6, 7, 8], [18, 19, 20, 21], []]);
  });

  it("turns a teacher's half-day from free to avoided to away and back, and the collège's draw stays", () => {
    const free = drawn.teachers.findIndex((t) => t.unavailable.every((x) => x === 0));
    const at = { day: 1, half: 1 };
    const states = [empty];
    for (let k = 0; k < 3; k += 1) states.push(cycleHalf(drawn, states[k], free, at));
    assert.deepEqual(states.map((e) => teacherWeek(drawn, e, free)[1].halves[1].state), ["free", "avoid", "away", "free"]);
    assert.deepEqual(states[3].teachers, {});
    assert.deepEqual(Array.from(applyEdits(drawn, states[2]).teachers[free].unavailable.subarray(13, 18)), [1, 1, 1, 1, 1]);
    const away = drawn.teachers.findIndex((t) => t.unavailable.some((x) => x === 1));
    const day = teacherWeek(drawn, empty, away).find((d) => d.halves[0].state === "elsewhere");
    assert.equal(cycleHalf(drawn, empty, away, { day: day.day, half: 0 }), empty);
  });

  it("moves a course only where the hard constraints let it, priced as the evaluator prices it, and locks it there", () => {
    /** A barrette of several courses, the one with the most slots to go to: the timetable is tight. */
    const counts = drawn.links.map((ids, l) => (ids.length > 1 && timetable.slot[ids[0]] >= 0 ? optionsFor(drawn, timetable, l).length : 0));
    const link = counts.indexOf(Math.max(...counts));
    const options = optionsFor(drawn, timetable, link);
    assert.ok(options.length > 1);
    const before = evaluate(drawn, timetable);
    for (const option of options.slice(0, 5)) {
      const moved = moveLink(empty, drawn, timetable, { link, ...option });
      const after = evaluate(drawn, moved.timetable);
      assert.deepEqual([after.infeasibility, after.cost - before.cost], [before.infeasibility, option.delta]);
    }
    const { edits } = moveLink(empty, drawn, timetable, { link, ...options[0] });
    const rebuilt = buildGreedy(applyEdits(drawn, edits), { seed: 7 }).timetable;
    assert.ok(drawn.links[link].every((id) => rebuilt.slot[id] === options[0].slot));
  });
});

describe("the absences chosen by hand", () => {
  const one = { teacher: 2, from: 3, to: 1, known: "veille", told: "whole" };

  it("put the days in order, refuse a second absence of the teacher on the same days, and say each in words", () => {
    const { edits } = addAbsence(empty, one);
    assert.deepEqual(edits.absences, [{ ...one, from: 1, to: 3 }]);
    assert.match(addAbsence(edits, { ...one, from: 3, to: 4 }).error, /déjà absent/);
    assert.equal(addAbsence(edits, { ...one, teacher: 3 }).edits.absences.length, 2);
    assert.match(absenceLines(drawn, edits)[0], /absent du mardi au jeudi, prévenue la veille, durée connue$/);
    assert.deepEqual(removeAbsence(edits, 0).absences, []);
  });

  it("start from the week the measures draw", () => {
    const week = drawWeek(drawn, 2005);
    const edits = withDrawn(empty, drawn, 2005);
    assert.deepEqual([edits.week, edits.absences], [week.week, week.absences]);
  });

  it("give the collège's volunteers their hours, and keep them when one is set by hand", () => {
    const flags = volunteersOf(drawn);
    assert.deepEqual(volunteerRows(drawn, empty).map((r) => r.hours > 0), Array.from(flags, Boolean));
    const other = flags.indexOf(0);
    const set = setVolunteer(empty, drawn, other, 3);
    const hours = volunteerRows(drawn, set).map((r) => r.hours);
    assert.equal(hours[other], 3);
    assert.equal(hours.filter((h) => h > 0).length, flags.reduce((a, b) => a + b, 0) + 1);
    assert.equal(volunteerRows(drawn, setVolunteer(set, drawn, other, 0))[other].hours, 0);
  });
});
