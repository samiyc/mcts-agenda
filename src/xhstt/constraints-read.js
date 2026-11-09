import { child, childrenOf, references, textOf } from "./xml.js";

/**
 * The constraints of an XHSTT instance, read into one shape: the common fields (Required, Weight, CostFunction) and
 * the points of application, then what each type adds. A point is an event, an event group, a resource or a pair of
 * events, as the type says (`POINTS`). An event or a resource named twice is two points: the specification counts
 * its violations twice.
 */
export const POINTS = Object.freeze({
  AssignResource: "event",
  AssignTime: "event",
  SplitEvents: "event",
  DistributeSplitEvents: "event",
  PreferResources: "event",
  PreferTimes: "event",
  AvoidSplitAssignments: "group",
  SpreadEvents: "group",
  LinkEvents: "group",
  OrderEvents: "pair",
  AvoidClashes: "resource",
  AvoidUnavailableTimes: "resource",
  LimitIdleTimes: "resource",
  ClusterBusyTimes: "resource",
  LimitBusyTimes: "resource",
  LimitWorkload: "resource",
});

const number = (node, name, fallback = 0) => (child(node, name) ? Number(textOf(node, name)) : fallback);

function lookup(map, id, what) {
  const found = map.get(id);
  if (found === undefined) throw new Error(`XHSTT : ${what} inconnu ${id}`);
  return found;
}

/** The members of the referenced groups, then the referenced items, as indexes; duplicates kept. */
function members(node, { groups, index }, [groupList, groupName, list, name], what) {
  const fromGroups = references(node, groupList, groupName).flatMap((ref) => lookup(groups, ref, what));
  return [...fromGroups, ...references(node, list, name).map((ref) => lookup(index, ref, what))];
}

const timesOf = (node, instance) => members(node, instance.times, ["TimeGroups", "TimeGroup", "Times", "Time"], "temps");

/** A set of times or resources, as flags over all of them. */
function flags(indexes, size) {
  const set = new Uint8Array(size);
  for (const i of indexes) set[i] = 1;
  return set;
}

function pointsOf(kind, applies, instance) {
  const { events, resources } = instance;
  if (POINTS[kind] === "event") return members(applies, events, ["EventGroups", "EventGroup", "Events", "Event"], "événement");
  if (POINTS[kind] === "resource") return members(applies, resources, ["ResourceGroups", "ResourceGroup", "Resources", "Resource"], "ressource");
  if (POINTS[kind] === "group") return references(applies, "EventGroups", "EventGroup").map((id) => ({ id, events: lookup(events.groups, id, "groupe") }));
  return childrenOf(child(applies, "EventPairs"), "EventPair").map((pair) => ({
    first: lookup(events.index, child(pair, "FirstEvent").attrs.Reference, "événement"),
    second: lookup(events.index, child(pair, "SecondEvent").attrs.Reference, "événement"),
    min: number(pair, "MinSeparation", 0),
    max: number(pair, "MaxSeparation", Infinity),
  }));
}

/** What each type adds to the common fields. */
const EXTRA = {
  AssignResource: (node) => ({ role: textOf(node, "Role") }),
  SplitEvents: (node) => ({ minDuration: number(node, "MinimumDuration"), maxDuration: number(node, "MaximumDuration"), minAmount: number(node, "MinimumAmount"), maxAmount: number(node, "MaximumAmount") }),
  DistributeSplitEvents: (node) => ({ duration: number(node, "Duration"), minimum: number(node, "Minimum"), maximum: number(node, "Maximum") }),
  PreferResources: (node, instance) => ({
    role: textOf(node, "Role"),
    preferred: flags(members(node, instance.resources, ["ResourceGroups", "ResourceGroup", "Resources", "Resource"], "ressource"), instance.resources.list.length),
  }),
  PreferTimes: (node, instance) => ({ preferred: flags(timesOf(node, instance), instance.times.ids.length), duration: number(node, "Duration", 0) }),
  AvoidSplitAssignments: (node) => ({ role: textOf(node, "Role") }),
  SpreadEvents: (node, instance) => ({
    timeGroups: childrenOf(child(node, "TimeGroups"), "TimeGroup").map((g) => ({
      times: flags(lookup(instance.times.groups, g.attrs.Reference, "groupe de temps"), instance.times.ids.length),
      minimum: number(g, "Minimum"),
      maximum: number(g, "Maximum"),
    })),
  }),
  AvoidUnavailableTimes: (node, instance) => ({ unavailable: flags(timesOf(node, instance), instance.times.ids.length) }),
  LimitIdleTimes: (node, instance) => busyLimits(node, instance),
  ClusterBusyTimes: (node, instance) => busyLimits(node, instance),
  LimitBusyTimes: (node, instance) => busyLimits(node, instance),
  LimitWorkload: (node) => ({ minimum: number(node, "Minimum"), maximum: number(node, "Maximum") }),
};

function busyLimits(node, instance) {
  const timeGroups = references(node, "TimeGroups", "TimeGroup").map((ref) => lookup(instance.times.groups, ref, "groupe de temps"));
  return { timeGroups, minimum: number(node, "Minimum"), maximum: number(node, "Maximum") };
}

/** One constraint element of an instance. */
export function readConstraint(node, instance) {
  const kind = node.name.replace(/Constraint$/, "");
  if (!POINTS[kind]) throw new Error(`XHSTT : contrainte inconnue ${node.name}`);
  return {
    id: node.attrs.Id,
    kind,
    required: textOf(node, "Required") === "true",
    weight: number(node, "Weight"),
    costFunction: textOf(node, "CostFunction", "Linear"),
    points: pointsOf(kind, child(node, "AppliesTo"), instance),
    ...(EXTRA[kind]?.(node, instance) ?? {}),
  };
}
