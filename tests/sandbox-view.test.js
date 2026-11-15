import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildGreedy } from "../src/build/greedy.js";
import { evaluate } from "../src/evaluate.js";
import { applyEdits, emptyEdits } from "../src/sandbox/edits.js";
import { moveLink, optionsFor } from "../src/sandbox/moves.js";
import { createSchool } from "../src/school/generate.js";
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
