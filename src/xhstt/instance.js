import { readConstraint } from "./constraints-read.js";
import { child, childrenOf, references, textOf } from "./xml.js";

/**
 * An XHSTT instance (the format of ITC 2011, http://jeffreykingston.id.au/cgi-bin/hseval.cgi?op=spec), read into
 * arrays and indexes: the times in their order, the time groups (Week and Day among them) as lists of time indexes,
 * the resources and their groups, the events with their event resources, the event groups (Course among them), and
 * the constraints (`constraints-read.js`). Everything refers to everything else by index.
 */

/**
 * Adds `member` to the group `id` of `groups`, a Map of id to member lists. A group is a set: an event that names its
 * course both as `Course` and in `EventGroups` (the Greek instances do) is in it once. Members come in increasing
 * order, so a repeat is always the last one.
 */
function join(groups, id, member) {
  const group = groups.get(id);
  if (!group) throw new Error(`XHSTT : groupe inconnu ${id}`);
  if (group[group.length - 1] !== member) group.push(member);
}

/** The groups a time names: its week, its day, its other time groups. */
const groupsOfTime = (time) => [
  ...["Week", "Day"].filter((kind) => child(time, kind)).map((kind) => child(time, kind).attrs.Reference),
  ...references(time, "TimeGroups", "TimeGroup"),
];

function readTimes(node) {
  const groups = new Map();
  for (const kind of ["Week", "Day", "TimeGroup"]) for (const g of childrenOf(child(node, "TimeGroups"), kind)) groups.set(g.attrs.Id, []);
  const ids = childrenOf(node, "Time").map((time, index) => {
    for (const ref of groupsOfTime(time)) join(groups, ref, index);
    return time.attrs.Id;
  });
  return { ids, index: new Map(ids.map((id, i) => [id, i])), groups };
}

function readResources(node) {
  const types = childrenOf(child(node, "ResourceTypes"), "ResourceType").map((t) => t.attrs.Id);
  const groups = new Map(childrenOf(child(node, "ResourceGroups"), "ResourceGroup").map((g) => [g.attrs.Id, []]));
  const list = childrenOf(node, "Resource").map((r, index) => {
    for (const ref of references(r, "ResourceGroups", "ResourceGroup")) join(groups, ref, index);
    return { id: r.attrs.Id, type: child(r, "ResourceType").attrs.Reference };
  });
  return { types, groups, list, index: new Map(list.map((r, i) => [r.id, i])) };
}

const integer = (node, name, fallback) => (child(node, name) ? Number(textOf(node, name)) : fallback);

/** An event resource: its role, type, preassigned resource (−1 if none) and workload. */
function eventResource(node, resources, workload) {
  const ref = node.attrs.Reference;
  const resource = ref === undefined ? -1 : resources.index.get(ref);
  if (resource === undefined) throw new Error(`XHSTT : ressource inconnue ${ref}`);
  const type = child(node, "ResourceType")?.attrs.Reference ?? resources.list[resource].type;
  return { role: textOf(node, "Role", null), type, resource, workload: integer(node, "Workload", workload) };
}

function readEvent(node, index, { times, resources, groups }) {
  const duration = Number(textOf(node, "Duration"));
  const workload = integer(node, "Workload", duration);
  const time = child(node, "Time") ? times.index.get(child(node, "Time").attrs.Reference) : -1;
  const own = childrenOf(child(node, "Resources"), "Resource").map((r) => eventResource(r, resources, workload));
  const fromGroups = references(node, "ResourceGroups", "ResourceGroup").flatMap((ref) =>
    resources.groups.get(ref).map((resource) => ({ role: null, type: resources.list[resource].type, resource, workload })),
  );
  if (child(node, "Course")) join(groups, child(node, "Course").attrs.Reference, index);
  for (const ref of references(node, "EventGroups", "EventGroup")) join(groups, ref, index);
  return { id: node.attrs.Id, duration, workload, time, resources: [...own, ...fromGroups] };
}

function readEvents(node, context) {
  const groups = new Map();
  for (const kind of ["Course", "EventGroup"]) for (const g of childrenOf(child(node, "EventGroups"), kind)) groups.set(g.attrs.Id, []);
  const list = childrenOf(node, "Event").map((e, index) => readEvent(e, index, { ...context, groups }));
  return { list, groups, index: new Map(list.map((e, i) => [e.id, i])) };
}

/**
 * @param {{ name: string, attrs: Record<string, string>, children: any[], text: string }} node an `Instance` element
 */
export function readInstance(node) {
  const times = readTimes(child(node, "Times"));
  const resources = readResources(child(node, "Resources"));
  const events = readEvents(child(node, "Events"), { times, resources });
  const instance = { id: node.attrs.Id, name: textOf(child(node, "MetaData"), "Name", node.attrs.Id), times, resources, events, constraints: [] };
  instance.constraints = child(node, "Constraints").children.map((c) => readConstraint(c, instance));
  return instance;
}
