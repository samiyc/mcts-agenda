import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildGreedy } from "../src/build/greedy.js";
import { evaluate } from "../src/evaluate.js";
import { createSchool } from "../src/school/generate.js";
import { anneal } from "../src/search/anneal.js";
import { makeShift, makeSwap, shiftDelta, swapDelta } from "../src/search/moves.js";
import { createState, neighboursOf } from "../src/search/state.js";
import { tabu } from "../src/search/tabu.js";
import { SLOTS } from "../src/time.js";
import { createRng } from "mcts-commun/random.js";

const school = createSchool({ size: "S", seed: 1 });
const r0 = buildGreedy(school, { seed: 1 });
const r0Cost = evaluate(school, r0.timetable).cost;
const timetableOf = (state) => ({ slot: state.board.slot, room: state.board.roomOf });
const same = (a, b) => assert.deepEqual([Array.from(a.slot), Array.from(a.room)], [Array.from(b.slot), Array.from(b.room)]);

/** Prices a shift or a swap, checks the board did not change, makes it, checks the cost: 1 when made. */
function tryMove(state, { link, other = -1, slot = -1 }) {
  if (other < 0 && slot === state.at[link]) return 0;
  const before = { slot: state.board.slot.slice(), room: state.board.roomOf.slice() };
  const delta = other >= 0 ? swapDelta(state, link, other) : shiftDelta(state, link, slot);
  same(timetableOf(state), before);
  if (Number.isNaN(delta)) return 0;
  if (other >= 0) makeSwap(state, link, other, delta);
  else makeShift(state, link, slot, delta);
  const { infeasibility, cost } = evaluate(school, timetableOf(state));
  assert.deepEqual([infeasibility, cost], [0, state.cost]);
  return 1;
}

describe("the moves", () => {
  it("price a move exactly, and leave the board as it was until it is made", () => {
    const state = createState(school, r0.timetable);
    const near = neighboursOf(school);
    const rng = createRng(7);
    let made = 0;
    for (let i = 0; i < 400; i += 1) {
      const link = rng.int(school.links.length);
      const other = near[link][rng.int(near[link].length)];
      made += tryMove(state, i % 2 === 1 && state.at[other] !== state.at[link] ? { link, other } : { link, slot: rng.int(SLOTS) });
    }
    assert.ok(made > 50, `${made} moves made`);
  });

  it("know the barrettes that share a division or a teacher", () => {
    const near = neighboursOf(school);
    const course = school.courses[school.links[0][0]];
    const other = school.courses.find((c) => c.link !== 0 && c.teacher === course.teacher);
    assert.ok(near[0].includes(other.link));
    assert.ok(!near[0].includes(0));
  });
});

for (const [name, search, tries] of [
  ["the annealing", anneal, 20000],
  ["the tabu search", tabu, 60000],
]) {
  describe(name, () => {
    const result = search(school, r0.timetable, { seed: 3, tries });

    it("beats R0 from R0's timetable, without breaking a hard constraint", () => {
      const { infeasibility, cost } = evaluate(school, result.timetable);
      assert.deepEqual([infeasibility, cost], [result.infeasibility, result.cost]);
      assert.equal(infeasibility, 0);
      assert.ok(cost < r0Cost, `${cost} against R0's ${r0Cost}`);
      assert.ok(result.tries >= tries);
    });

    it("replays from its seed", () => {
      const again = search(school, r0.timetable, { seed: 3, tries }).timetable;
      assert.deepEqual([Array.from(again.slot), Array.from(again.room)], [Array.from(result.timetable.slot), Array.from(result.timetable.room)]);
    });

    it("places a barrette R0 left", () => {
      const slot = r0.timetable.slot.slice();
      const room = r0.timetable.room.slice();
      const link = school.links.findIndex((ids) => ids.length === 2);
      for (const id of school.links[link]) [slot[id], room[id]] = [-1, -1];
      const start = { slot, room };
      assert.ok(evaluate(school, start).infeasibility > 0);
      const placed = search(school, start, { seed: 3, tries: tries / 4 });
      assert.equal(evaluate(school, placed.timetable).infeasibility, 0);
    });
  });
}
