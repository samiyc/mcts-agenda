import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRng } from "mcts-commun/random.js";
import { anneal, runOf, XANNEAL } from "../src/xhstt/anneal.js";
import { draw } from "../src/xhstt/draws.js";
import { evaluateSolution } from "../src/xhstt/evaluate.js";
import { greedy } from "../src/xhstt/greedy.js";
import { readInstance } from "../src/xhstt/instance.js";
import { layoutOf } from "../src/xhstt/layout.js";
import { undo } from "../src/xhstt/moves.js";
import { mergeSlots, splitSlot } from "../src/xhstt/reshape.js";
import { readArchive } from "../src/xhstt/solution.js";
import { createState, planNow } from "../src/xhstt/state.js";
import { parseXml } from "../src/xhstt/xml.js";

/**
 * The XHSTT solver (docs/modele.md § 13) on two small instances written by hand: the evaluator's (every constraint
 * violated once) and the solver's (linked events, a required cut, rooms to assign, a room shared by a course). The
 * bench itself runs outside the tests (scripts/xhstt-bench.js): its archives are not in git.
 */
const read = (name, id) => readArchive(parseXml(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8")), readInstance).instances.get(id);
const small = read("xhstt-small.xml", "Small1");
const solve = read("xhstt-solve.xml", "Solve1");
const eventOf = (instance, id) => instance.events.index.get(id);

const costsOf = (state) => ({ infeasibility: state.infeasibility, objective: state.objective });
/** The evaluator's costs on the state's awake pieces. */
const fullOf = (state) => {
  const { infeasibility, objective } = evaluateSolution(state.instance, { events: state.layout.pieces.filter((p) => p.duration > 0) });
  return { infeasibility, objective };
};
const sameCosts = (state) => assert.deepEqual(costsOf(state), fullOf(state));

/** Random moves on `state`, half taken back: the costs the search and the evaluator give, every 50 moves. */
function walk(state, seed, shares = {}) {
  const run = runOf(state, { ...XANNEAL, seed, reshape: 0.3, ...shares });
  const seen = [];
  for (let i = 0; i < 3000; i += 1) {
    const moved = !Number.isNaN(draw(state, run));
    if (moved && run.rng.next() < 0.5) undo(state);
    if (i % 50 === 0) seen.push([costsOf(state), fullOf(state)]);
  }
  return seen;
}

function ruled(instance, seed = 1) {
  const state = createState(instance, layoutOf(instance));
  greedy(state, createRng(seed));
  return state;
}

describe("the layout of the XHSTT solver", () => {
  const layout = layoutOf(solve);
  const unitOf = (id) => layout.units.find((u) => u.events.includes(eventOf(solve, id)));

  it("binds the events of a required link into one unit, cut alike", () => {
    assert.equal(unitOf("E7"), unitOf("E8"));
    assert.deepEqual(unitOf("E7").parts, [2]);
  });

  it("cuts an event as its required SplitEvents asks, and gives it a pool for other cuts", () => {
    const e5 = unitOf("E5");
    assert.deepEqual(e5.parts, [2, 1]);
    assert.deepEqual([e5.lo, e5.hi, e5.cap, e5.slots.length], [1, 2, 2, 2]);
    assert.deepEqual(unitOf("E6").parts, [2, 1], "one double, as DistributeSplitEvents wants");
  });

  it("starts doubles where the required PreferTimes allows, within a day; or nowhere", () => {
    assert.deepEqual(Array.from(unitOf("E1").domainAt(2).domain), [0, 2, 4, 6, -1]);
    assert.deepEqual(Array.from(unitOf("E2").domainAt(1).domain), [0, 1, 2, 3, 4, 5, 6, 7, -1]);
    assert.equal(layout.slots.find((s) => s.unit === layout.units.indexOf(unitOf("E9"))).fixed, true);
  });

  it("makes one task of the course's rooms, and keeps E3 to its room or none", () => {
    const pieceOf = (id) => layout.pieces.findIndex((p) => p.event === eventOf(solve, id));
    const task = (id) => layout.tasks.find((t) => Array.from(t.targets).some((p, i) => i % 2 === 0 && p === pieceOf(id)));
    assert.equal(task("E1"), task("E2"));
    assert.deepEqual(Array.from(task("E3").candidates), [solve.resources.index.get("R1"), -1]);
  });
});

describe("the XHSTT search state", () => {
  it("starts with the evaluator's costs, and the rule's state too", () => {
    for (const instance of [small, solve]) {
      const fresh = createState(instance, layoutOf(instance));
      assert.deepEqual(costsOf(fresh), fullOf(fresh));
      const rule = ruled(instance);
      assert.deepEqual(costsOf(rule), fullOf(rule));
    }
  });

  it("keeps the evaluator's costs through random moves, kept or taken back", () => {
    for (const instance of [small, solve]) {
      for (const [ours, theirs] of walk(ruled(instance), 7)) assert.deepEqual(ours, theirs);
    }
  });

  it("keeps them too when swaps look for a piece as long, tasks for a free resource, spans change places, and weeks slide", () => {
    for (const instance of [small, solve]) {
      for (const [ours, theirs] of walk(ruled(instance), 8, { alike: 0.7, free: 0.7, block: 0.2, slide: 0.2 })) assert.deepEqual(ours, theirs);
    }
  });

  it("cuts a piece in two and joins them back, to the same costs", () => {
    const state = ruled(solve);
    const s = state.live.live.find((x) => state.slotDuration[x] === 2 && state.slotTime[x] >= 0 && state.layout.units[state.layout.slots[x].unit].slots.length > 1);
    const idle = state.layout.units[state.layout.slots[s].unit].slots.find((x) => state.slotDuration[x] === 0);
    const before = costsOf(state);
    splitSlot(state, s, idle, 1);
    assert.deepEqual([state.slotDuration[s], state.slotDuration[idle], state.slotTime[idle]], [1, 1, state.slotTime[s] + 1]);
    sameCosts(state);
    mergeSlots(state, s, idle);
    assert.deepEqual(costsOf(state), before);
    sameCosts(state);
  });
});

describe("the XHSTT annealing", () => {
  it("does no worse than the rule, and replays from its seed", () => {
    const start = ruled(solve);
    const rule = costsOf(start);
    const once = anneal(start, { tries: 20000, seed: 3 });
    sameCosts(once.state);
    const better = once.state.infeasibility < rule.infeasibility || (once.state.infeasibility === rule.infeasibility && once.state.objective <= rule.objective);
    assert.ok(better, `${JSON.stringify(costsOf(once.state))} against ${JSON.stringify(rule)}`);
    const again = anneal(ruled(solve), { tries: 20000, seed: 3 });
    assert.deepEqual(planNow(again.state), planNow(once.state));
  });

  it("finds a timetable without any required constraint broken on the small instance", () => {
    assert.equal(anneal(ruled(solve), { tries: 50000, seed: 1 }).state.infeasibility, 0);
  });

  it("finds one as well with a first phase on the infeasibility alone, and replays from its seed", () => {
    const options = { tries: 50000, seed: 2, feasible: 0.5 };
    const once = anneal(ruled(solve), options);
    sameCosts(once.state);
    assert.equal(once.state.infeasibility, 0);
    assert.deepEqual(planNow(anneal(ruled(solve), options).state), planNow(once.state));
  });
});
