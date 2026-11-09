import { child, childrenOf, textOf } from "./xml.js";

/**
 * An XHSTT solution: its solution events, each derived from an instance event, with a duration, a starting time (−1
 * when none) and the resource of each of the event's event resources (−1 when none). As the specification says, an
 * instance event without solution events gets one of its whole duration, and the preassigned times and resources
 * fill what the solution leaves empty. The durations of an event's solution events must add up to its own.
 *
 * Its report, when it has one, keeps HSEval's totals and each cost by point and constraint, to compare with ours.
 */

function solutionEvent(node, instance) {
  const event = instance.events.index.get(node.attrs.Reference);
  if (event === undefined) throw new Error(`XHSTT : événement inconnu ${node.attrs.Reference}`);
  const source = instance.events.list[event];
  const timeRef = child(node, "Time")?.attrs.Reference;
  const resources = Int32Array.from(source.resources, (er) => er.resource);
  for (const r of childrenOf(child(node, "Resources"), "Resource")) {
    const role = textOf(r, "Role");
    const at = source.resources.findIndex((er) => er.role === role);
    if (at < 0) throw new Error(`XHSTT : rôle ${role} absent de ${source.id}`);
    resources[at] = instance.resources.index.get(r.attrs.Reference);
  }
  return {
    event,
    duration: child(node, "Duration") ? Number(textOf(node, "Duration")) : source.duration,
    time: timeRef === undefined ? source.time : instance.times.index.get(timeRef),
    resources,
  };
}

/** Adds the missing solution events, and checks the durations. */
function complete(events, instance) {
  const total = new Int32Array(instance.events.list.length);
  for (const se of events) total[se.event] += se.duration;
  instance.events.list.forEach((source, event) => {
    if (total[event] === 0) {
      events.push({ event, duration: source.duration, time: source.time, resources: Int32Array.from(source.resources, (er) => er.resource) });
    } else if (total[event] !== source.duration) {
      throw new Error(`XHSTT : ${source.id} dure ${source.duration}, ses morceaux ${total[event]}`);
    }
  });
  return events;
}

const KINDS = [
  ["Resources", "Resource"],
  ["Events", "Event"],
  ["EventGroups", "EventGroup"],
];

/** HSEval's report: its two totals, and the cost of each (point, constraint), summed when listed twice. */
function readReport(node) {
  if (!node) return null;
  const costs = new Map();
  for (const [list, name] of KINDS) {
    for (const point of childrenOf(child(node, list), name)) {
      for (const c of childrenOf(point, "Constraint")) {
        const key = `${point.attrs.Reference}|${c.attrs.Reference}`;
        costs.set(key, (costs.get(key) ?? 0) + Number(textOf(c, "Cost")));
      }
    }
  }
  return { infeasibility: Number(textOf(node, "InfeasibilityValue")), objective: Number(textOf(node, "ObjectiveValue")), costs };
}

/** A `Solution` element of instance `instance`. */
export function readSolution(node, instance) {
  const events = childrenOf(child(node, "Events"), "Event").map((e) => solutionEvent(e, instance));
  return { instance: node.attrs.Reference, description: textOf(node, "Description"), events: complete(events, instance), report: readReport(child(node, "Report")) };
}

/**
 * Every instance and solution of an archive (a `HighSchoolTimetableArchive` element): `{ instances, solutions }`,
 * a solution carrying its group's id.
 * @param {any} root
 * @param {(node: any) => any} readInstance
 */
export function readArchive(root, readInstance) {
  const instances = new Map(childrenOf(child(root, "Instances"), "Instance").map((node) => [node.attrs.Id, readInstance(node)]));
  const solutions = childrenOf(child(root, "SolutionGroups"), "SolutionGroup").flatMap((group) =>
    childrenOf(group, "Solution").map((node) => ({ group: group.attrs.Id, ...readSolution(node, instances.get(node.attrs.Reference)) })),
  );
  return { instances, solutions };
}
