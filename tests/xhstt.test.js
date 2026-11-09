import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateSolution } from "../src/xhstt/evaluate.js";
import { readInstance } from "../src/xhstt/instance.js";
import { readArchive, readSolution } from "../src/xhstt/solution.js";
import { child, parseXml } from "../src/xhstt/xml.js";

/**
 * The XHSTT reader and evaluator on a small archive written by hand (tests/fixtures/xhstt-small.xml), where every
 * type of constraint is violated by a deviation worked out from the specification. The public archives and HSEval's
 * reports are checked by scripts/xhstt-check.js (docs/mesures-j4.md), outside the tests: they are not in git.
 */
const root = parseXml(readFileSync(new URL("./fixtures/xhstt-small.xml", import.meta.url), "utf8"));
const { instances, solutions } = readArchive(root, readInstance);
const instance = instances.get("Small1");
const [solution] = solutions;
const result = evaluateSolution(instance, solution);

describe("the XML reader", () => {
  it("reads elements, attributes, text, entities, CDATA, comments and self-closing tags", () => {
    const node = parseXml(`<?xml version="1.0"?><!-- a --><a x="1 &amp; 2" y='q'><b>t &lt; u &#65;&#x42;</b><c/><d><![CDATA[<raw>]]></d></a>`);
    assert.deepEqual([node.name, node.attrs], ["a", { x: "1 & 2", y: "q" }]);
    assert.equal(child(node, "b").text, "t < u AB");
    assert.deepEqual(child(node, "c").children, []);
    assert.equal(child(node, "d").text, "<raw>");
    assert.equal(child(child(root, "Instances").children[0], "MetaData").children[0].text, "Small & tiny");
  });

  it("refuses a tag closed by another, or never closed", () => {
    assert.throws(() => parseXml("<a><b></a>"), /ferme/);
    assert.throws(() => parseXml("<a><b></b>"), /jamais fermé/);
  });
});

describe("the XHSTT instance", () => {
  it("reads the times, their days, the resources, their groups and the events", () => {
    assert.equal(instance.times.ids.length, 8);
    assert.deepEqual(instance.times.groups.get("Tuesday"), [4, 5, 6, 7]);
    assert.deepEqual(instance.resources.groups.get("Teachers"), [0, 1]);
    const e4 = instance.events.list[instance.events.index.get("E4")];
    assert.deepEqual([e4.duration, e4.workload, e4.time], [1, 3, -1]);
    assert.equal(instance.events.list[instance.events.index.get("E3")].time, 4);
  });

  it("keeps an event once in a group it names twice, as Course and as EventGroup", () => {
    assert.deepEqual(instance.events.groups.get("K1"), [0, 1]);
  });
});

describe("the XHSTT solution", () => {
  it("adds the events it leaves out, with their preassigned time and resources", () => {
    const e3 = solution.events.find((se) => se.event === instance.events.index.get("E3"));
    assert.deepEqual([e3.time, Array.from(e3.resources)], [4, [3, 0]]);
    assert.equal(solution.events.find((se) => se.event === instance.events.index.get("E5")).time, -1);
  });

  it("refuses pieces whose durations do not add up to their event's", () => {
    const node = parseXml(`<Solution Reference="Small1"><Events><Event Reference="E2"><Duration>1</Duration></Event></Events></Solution>`);
    assert.throws(() => readSolution(node, instance), /dure 2/);
  });

  it("keeps HSEval's report", () => {
    assert.deepEqual([solution.report.infeasibility, solution.report.objective], [5, 27]);
    assert.equal(solution.report.costs.get("C1|clashes"), 1);
  });
});

describe("the XHSTT evaluation", () => {
  it("gives each constraint the cost worked out by hand", () => {
    assert.deepEqual(Object.fromEntries(result.byConstraint), {
      assignTime: 2, // E5 has no time, and is named twice: two points
      assignTeacher: 1, // the second piece of E1 has no teacher
      split: 2, // two pieces of E1, three wanted, weight 2
      distribute: 2, // no piece of E2 lasts 1, two wanted
      preferRoom: 1, // the first piece of E1 in R2
      preferMonday: 3, // E4 on Tuesday, weight 3; E3's time is preassigned
      sameTeacher: 5, // K1 taught by T2 and T1, weight 5
      spread: 3, // three starts on Monday, one wanted; none on Tuesday
      link: 1, // E3 and E4 apart, a step
      order: 1, // E1 ends at Mo4, E4 starts one time later; none allowed
      clashes: 1, // C1 twice at Mo1
      unavailable: 1, // T2 at Mo1
      idle: 1, // C1 free at Mo3, between Mo2 and Mo4
      days: 2, // T1 busy two days, one allowed, weight 2
      busy: 4, // C2 busy 2 times on Tuesday, 4 wanted, squared; Monday empty, not counted
      workload: 2, // T2: 1 from half of E1, 3 from E4; 2 allowed
    });
  });

  it("adds the required constraints to the infeasibility, the others to the objective, as HSEval's report", () => {
    assert.deepEqual([result.infeasibility, result.objective], [solution.report.infeasibility, solution.report.objective]);
    assert.equal(result.costs.get("C1|clashes"), solution.report.costs.get("C1|clashes"));
  });
});
