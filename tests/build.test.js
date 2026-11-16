import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildGreedy, buildNaive } from "../src/build/greedy.js";
import { evaluate } from "../src/evaluate.js";
import { WEIGHTS } from "../src/rules/soft.js";
import { createSchool } from "../src/school/generate.js";
import { SLOTS, weeksOf } from "../src/time.js";

const school = createSchool({ size: "S", seed: 1 });
const cells = school.courses.reduce((sum, c) => sum + c.length * weeksOf(c.weeks).length, 0);
const presentMonday = (c) => !school.teachers[c.teacher].unavailable[0];
const empty = () => ({ slot: new Int16Array(school.courses.length).fill(-1), room: new Int16Array(school.courses.length).fill(-1) });
const greedy = buildGreedy(school, { seed: 1 });

describe("the evaluation", () => {
  it("counts every cell of an empty timetable as unplaced, and nothing else", () => {
    const { infeasibility, cost, hard } = evaluate(school, empty());
    assert.equal(hard.D1, cells);
    assert.equal(infeasibility, cells);
    assert.equal(cost, 0);
  });

  it("counts clashes, wrong rooms, a teacher away, a block across noon, a lost break and a long 6e day", () => {
    const timetable = empty();
    const sixieme = school.divisions.find((d) => d.level === 6);
    const own = school.courses.filter((c) => c.divisions[0] === sixieme.id && c.length === 1 && c.weeks === "AB" && presentMonday(c));
    own.slice(0, 7).forEach((c, i) => {
      timetable.slot[c.id] = i;
      timetable.room[c.id] = sixieme.homeRoom;
    });
    const block = school.courses.find((c) => c.divisions[0] === sixieme.id && c.discipline === "eps" && presentMonday(c));
    [timetable.slot[block.id], timetable.room[block.id]] = [3, sixieme.homeRoom];
    const away = school.teachers.find((t) => t.unavailable.some(Boolean));
    const absent = school.courses.find((c) => c.teacher === away.id && c.divisions[0] !== sixieme.id && c.length === 1 && c.weeks === "AB" && c.kind === "ordinary");
    [timetable.slot[absent.id], timetable.room[absent.id]] = [away.unavailable.indexOf(1), absent.home];
    const { hard } = evaluate(school, timetable);
    assert.equal(hard.D2 > 0, true, "the block sits on 11 h and 12 h");
    assert.equal(hard.D3, 4, "a gym course in a classroom, 2 slots on 2 weeks");
    assert.equal(hard.D4, 2);
    assert.equal(hard.D8, 2);
    assert.equal(hard.D5, 2, "Monday's break lost on both weeks");
    assert.equal(hard.D6, 2, "seven hours, one too many, on both weeks");
  });
});

describe("R0, the greedy", () => {
  it("places every course of the small collèges without breaking a hard constraint", () => {
    for (const seed of [1, 2]) {
      const other = createSchool({ size: "S", seed });
      const { timetable, unplaced } = seed === 1 ? greedy : buildGreedy(other, { seed });
      assert.deepEqual(unplaced, []);
      assert.equal(evaluate(other, timetable).infeasibility, 0, `S seed ${seed}`);
    }
  });

  it("adds up, placement by placement, the cost the evaluation finds", () => {
    const { cost, soft } = evaluate(school, greedy.timetable);
    assert.equal(greedy.added, cost);
    assert.equal(cost, Object.entries(soft).reduce((sum, [key, n]) => sum + WEIGHTS[key] * n, 0));
  });

  it("replays from its seed", () => {
    const again = buildGreedy(school, { seed: 1 });
    assert.deepEqual(again.timetable, greedy.timetable);
  });
});

describe("R0-naïf", () => {
  const naive = buildNaive(school);

  it("never breaks a hard constraint but leaves courses unplaced, with why", () => {
    const { hard } = evaluate(school, naive.timetable);
    const unplacedCells = naive.unplaced
      .flatMap(({ courses }) => courses)
      .reduce((sum, id) => sum + school.courses[id].length * weeksOf(school.courses[id].weeks).length, 0);
    assert.ok(naive.unplaced.length > 0);
    assert.deepEqual(hard, { D1: unplacedCells, D2: 0, D3: 0, D4: 0, D5: 0, D6: 0, D8: 0, D9: 0, D10: 0 });
    for (const { reasons } of naive.unplaced) assert.equal(Object.values(reasons).reduce((a, b) => a + b, 0), SLOTS);
  });

  it("is beaten by R0 on infeasibility", () => {
    assert.ok(evaluate(school, greedy.timetable).infeasibility < evaluate(school, naive.timetable).infeasibility);
  });
});
