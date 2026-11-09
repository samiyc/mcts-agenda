import { createRng } from "mcts-commun/random.js";
import { SLOTS, dayOf } from "../time.js";
import { placeFor, teacherThere } from "./moves.js";
import { lengthOf, mark, orphan, setSession, shareOf } from "./plan.js";
import { canReplace, inTeam, p1, sameSubject } from "./rules.js";

/**
 * The replanning search (docs/modele.md § 7): at each moment of the week, P1 decides first, then simulated annealing
 * looks for better on the days the decision may touch (from the current day on). Its moves:
 * - a lost session goes to a volunteer of its discipline or its class's team, or is caught up (« rattrapée ») at
 *   another slot of the week where its teacher is back;
 * - another session moves, to make room, or goes back where it was.
 * The value is `LOST` points a lost hour (by share of division) plus the weighted changes, in that order (Q-S4). The
 * best plan met is kept. The budget counts the moves tried at each moment (H).
 */
export const REPLAN = Object.freeze({ tries: 4000, hot: 2, cold: 0.05, seed: 1 });
const LOST = 100;

/** A session's part of the value: its lost hours, its weighted change. */
const valueOf = (plan, s) => (orphan(plan, s) ? LOST * lengthOf(plan, s) * shareOf(plan, s) : 0) + plan.changed[s];

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
  const before = valueOf(plan, s);
  const { old, target } = run;
  Object.assign(old, { teacher: plan.teacher[s], slot: plan.slot[s], room: plan.room[s], changed: plan.changed[s] });
  setSession(plan, s, target, run.ctx.weight);
  const delta = valueOf(plan, s) - before;
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
  if (orphan(plan, s)) {
    if (rng.next() < 0.5) rescueByTeacher(run, s);
    else shift(run, s);
  } else if (plan.changed[s] > 0 && rng.next() < 0.5) restore(run, s);
  else shift(run, s);
}

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
  for (let s = 0; s < plan.course.length; s += 1) mark(plan, s, 1);
}

const totalOf = (plan) => {
  let value = 0;
  for (let s = 0; s < plan.course.length; s += 1) value += valueOf(plan, s);
  return value;
};

/**
 * The search as a rule (`run.js`): `replanSearch({ tries, seed })` decides at each moment.
 * @param {{ tries?: number, hot?: number, cold?: number, seed?: number }} [options]
 */
export function replanSearch(options = {}) {
  const { tries, hot, cold, seed } = { ...REPLAN, ...options };
  const rng = createRng(seed);
  const cooling = Math.pow(cold / hot, 1 / tries);
  return (plan, ctx) => {
    p1(plan, ctx);
    const run = { plan, ctx, rng, temperature: hot, value: totalOf(plan), best: null, old: { teacher: 0, slot: 0, room: 0, changed: 0 }, target: { teacher: 0, slot: 0, room: 0 } };
    run.best = { ...snapshot(plan), value: run.value };
    for (let i = 0; i < tries; i += 1) {
      step(run);
      keepBest(run);
      run.temperature *= cooling;
    }
    if (run.value > run.best.value) restoreBest(run);
  };
}
