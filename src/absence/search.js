import { createRng } from "mcts-commun/random.js";
import { DAYS, SLOTS, dayOf } from "../time.js";
import { oddsOf } from "./belief.js";
import { placeFor, teacherThere } from "./moves.js";
import { lengthOf, mark, setSession, shareOf } from "./plan.js";
import { canReplace, inTeam, p1, sameSubject } from "./rules.js";
import { areaCost, softOf } from "./soft.js";

/**
 * The replanning search (docs/modele.md § 7): at each moment of the week, P1 decides first, then simulated annealing
 * looks for better on the days the decision may touch (from the current day on). Its moves:
 * - a lost session goes to a volunteer of its discipline or its class's team, or is caught up (« rattrapée ») at
 *   another slot of the week where its teacher is back; so does, ahead, a session whose teacher may be away (J6);
 * - another session moves, to make room, or goes back where it was.
 * The value is `LOST` points a lost hour (by share of division), plus the weighted changes, plus `soft` times the
 * week's soft cost (`soft.js`), in that order (Q-S4): at 0,01 a point, a change outweighs a hole of a division
 * (10 points) ten times (H). The best plan met is kept. The budget counts the moves tried at each moment (H).
 *
 * A lost hour counts by the odds that the session's teacher is away on its day, as `belief` (`belief.js`) has them:
 * 1 when known; on the days after an absence of unknown length (J6), 0 for `known` (J5's search), 1 for `worst`, the
 * scenario's odds for `odds`.
 */
export const REPLAN = Object.freeze({ tries: 4000, hot: 2, cold: 0.05, seed: 1, soft: 0.01, belief: /** @type {"known" | "worst" | "odds"} */ ("known") });
const LOST = 100;

/** The odds that session `s`'s teacher is away on its day. */
const awayOdds = (run, s) => run.odds[run.plan.teacher[s] * DAYS.length + dayOf(run.plan.slot[s])];

/** A session's part of the value: its lost hours, by the odds, its weighted change. */
function valueOf(run, s) {
  const { plan } = run;
  const odds = awayOdds(run, s);
  return (odds > 0 ? odds * LOST * lengthOf(plan, s) * shareOf(plan, s) : 0) + plan.changed[s];
}

/** The soft part of the value that a move of session `s` over `run.area` may change. */
const softPart = (run, s) => (run.soft > 0 ? run.soft * areaCost(run.plan, s, run.area) : 0);

const keep = (delta, run) => delta <= 0 || run.rng.next() < Math.exp(-delta / run.temperature);

/** The next place to try: `teacher` at `slot` in `room`. */
function aim(run, teacher, slot, room) {
  run.target.teacher = teacher;
  run.target.slot = slot;
  run.target.room = room;
}

/** Tries session `s` at `run.target`: kept by the annealing, or undone. */
function attempt(run, s) {
  const { plan } = run;
  const { old, target, area } = run;
  Object.assign(old, { teacher: plan.teacher[s], slot: plan.slot[s], room: plan.room[s], changed: plan.changed[s] });
  Object.assign(area, { day0: dayOf(old.slot), day1: dayOf(target.slot), teacher0: old.teacher, teacher1: target.teacher });
  const before = valueOf(run, s) + softPart(run, s);
  setSession(plan, s, target, run.ctx.weight);
  const delta = valueOf(run, s) + softPart(run, s) - before;
  if (keep(delta, run)) {
    run.value += delta;
    return;
  }
  setSession(plan, s, old, run.ctx.weight);
  plan.changed[s] = old.changed;
}

/** A lost session to a volunteer drawn among all teachers, when he may take it. */
function rescueByTeacher(run, s) {
  const { plan, rng, ctx } = run;
  const t = rng.int(plan.school.teachers.length);
  if ((sameSubject(plan, s, t) || inTeam(plan, s, t)) && canReplace(plan, s, t, ctx)) {
    aim(run, t, plan.slot[s], plan.room[s]);
    attempt(run, s);
  }
}

/** A session to a slot drawn, when it may go there. */
function shift(run, s) {
  const slot = run.rng.int(SLOTS);
  const room = placeFor(run.plan, s, slot, run.ctx.day);
  if (room >= 0) {
    aim(run, run.plan.teacher[s], slot, room);
    attempt(run, s);
  }
}

/** A changed session back to its teacher, or to its slot. */
function restore(run, s) {
  const { plan } = run;
  const { origin } = plan;
  if (plan.teacher[s] !== origin.teacher[s]) {
    if (teacherThere(plan, origin.teacher[s], plan.slot[s], lengthOf(plan, s))) {
    aim(run, origin.teacher[s], plan.slot[s], plan.room[s]);
    attempt(run, s);
  }
    return;
  }
  const room = placeFor(plan, s, origin.slot[s], run.ctx.day);
  if (room >= 0) {
    aim(run, plan.teacher[s], origin.slot[s], room);
    attempt(run, s);
  }
}

function step(run) {
  const { plan, rng } = run;
  const s = rng.int(plan.course.length);
  if (dayOf(plan.slot[s]) < run.ctx.day) return;
  if (awayOdds(run, s) > 0) {
    if (rng.next() < 0.5) rescueByTeacher(run, s);
    else shift(run, s);
  } else if (plan.changed[s] > 0 && rng.next() < 0.5) restore(run, s);
  else shift(run, s);
}

/** The objects a run overwrites move after move, made once a moment. */
const scratch = () => ({ old: { teacher: 0, slot: 0, room: 0, changed: 0 }, target: { teacher: 0, slot: 0, room: 0 }, area: { day0: 0, day1: 0, teacher0: 0, teacher1: 0 } });

/** The arrays that make a plan, to keep the best one met. */
const snapshot = (plan) => ({ slot: plan.slot.slice(), teacher: plan.teacher.slice(), room: plan.room.slice(), changed: plan.changed.slice(), replacements: plan.replacements.slice() });

function keepBest(run) {
  if (run.value >= run.best.value) return;
  const { plan, best } = run;
  for (const key of ["slot", "teacher", "room", "changed", "replacements"]) best[key].set(plan[key]);
  best.value = run.value;
}

/** Puts the best plan back, its busy layers rebuilt. */
function restoreBest(run) {
  const { plan, best } = run;
  for (const key of ["slot", "teacher", "room", "changed", "replacements"]) plan[key].set(best[key]);
  for (const layer of Object.values(plan.busy)) layer.fill(0);
  plan.at.fill(-1);
  for (let s = 0; s < plan.course.length; s += 1) mark(plan, s, 1);
}

function totalOf(run) {
  let value = run.soft > 0 ? run.soft * softOf(run.plan) : 0;
  for (let s = 0; s < run.plan.course.length; s += 1) value += valueOf(run, s);
  return value;
}

/**
 * The search as a rule (`run.js`): `replanSearch({ tries, seed })` decides at each moment; `soft: 0` leaves the
 * soft cost out of the value; `belief` says how it counts the days after an absence of unknown length.
 * @param {{ tries?: number, hot?: number, cold?: number, seed?: number, soft?: number, belief?: "known" | "worst" | "odds" }} [options]
 */
export function replanSearch(options = {}) {
  const { tries, hot, cold, seed, soft, belief } = { ...REPLAN, ...options };
  const rng = createRng(seed);
  const cooling = Math.pow(cold / hot, 1 / tries);
  return (plan, ctx) => {
    p1(plan, ctx);
    const run = { plan, ctx, rng, soft, odds: oddsOf(plan, belief), temperature: hot, value: 0, best: null, ...scratch() };
    run.value = totalOf(run);
    run.best = { ...snapshot(plan), value: run.value };
    for (let i = 0; i < tries; i += 1) {
      step(run);
      keepBest(run);
      run.temperature *= cooling;
    }
    if (run.value > run.best.value) restoreBest(run);
  };
}
