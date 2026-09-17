"use strict";

var CLOCK_RE = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

function cloneTimestamp(value) {
  // Empty string is absence, not a timestamp we may invent or order as a date.
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    const cloned = {};
    if (Object.prototype.hasOwnProperty.call(value, "start")) cloned.start = value.start;
    if (Object.prototype.hasOwnProperty.call(value, "end")) cloned.end = value.end;
    return cloned;
  }
  return value;
}

function eventText(event) {
  if (event.description !== undefined && event.description !== null) return event.description;
  if (event.event !== undefined && event.event !== null) return event.event;
  return null;
}

function cloneEvent(event, index) {
  const text = eventText(event);
  const cloned = {
    id: event.id === undefined ? null : event.id,
    timestamp: cloneTimestamp(event.timestamp),
    description: text,
    event: text,
    source: event.source === undefined ? null : event.source,
    _index: index
  };
  if (Object.prototype.hasOwnProperty.call(event, "evidenceIds")) {
    cloned.evidenceIds = Array.isArray(event.evidenceIds) ? event.evidenceIds.slice() : event.evidenceIds;
  }
  if (Object.prototype.hasOwnProperty.call(event, "causes")) {
    cloned.causes = Array.isArray(event.causes) ? event.causes.slice() : event.causes;
  }
  if (Object.prototype.hasOwnProperty.call(event, "exclusive")) cloned.exclusive = event.exclusive;
  if (Object.prototype.hasOwnProperty.call(event, "disjointWith")) {
    cloned.disjointWith = Array.isArray(event.disjointWith) ? event.disjointWith.slice() : event.disjointWith;
  }
  if (Object.prototype.hasOwnProperty.call(event, "notes")) cloned.notes = event.notes;
  if (Object.prototype.hasOwnProperty.call(event, "observation")) cloned.observation = event.observation;
  if (Object.prototype.hasOwnProperty.call(event, "observations")) {
    cloned.observations = Array.isArray(event.observations) ? event.observations.slice() : event.observations;
  }
  return cloned;
}

function cloneEvents(events) {
  if (!Array.isArray(events)) return [];
  const cloned = [];
  for (let index = 0; index < events.length; index += 1) {
    const item = events[index];
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    cloned.push(cloneEvent(item, index));
  }
  return cloned;
}

function stripIndex(event) {
  const out = {};
  const keys = Object.keys(event);
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i] === "_index") continue;
    out[keys[i]] = event[keys[i]];
  }
  return out;
}

function eventId(event) {
  return event && event.id != null ? String(event.id) : "";
}

function hasProvidedTimestamp(event) {
  return event.timestamp !== null && event.timestamp !== undefined && event.timestamp !== "";
}

function parseClock(text) {
  const match = CLOCK_RE.exec(text);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ? Number(match[3]) : 0;
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

function parseInstant(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const clock = parseClock(trimmed);
  if (clock !== null) return { kind: "clock", ms: clock };
  const ms = Date.parse(trimmed);
  if (!Number.isNaN(ms)) return { kind: "iso", ms: ms };
  return null;
}

function parsedInterval(start, end) {
  if (!start && !end) return null;
  const kind = (start && start.kind) || (end && end.kind);
  const startMs = start ? start.ms : end.ms;
  const endMs = end ? end.ms : start.ms;
  return { kind: kind, ms: startMs, endMs: endMs, interval: true };
}

function parseTimestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return parsedInterval(parseInstant(value.start), parseInstant(value.end));
  }
  if (typeof value === "string" && value.indexOf("/") !== -1) {
    const parts = value.split("/");
    if (parts.length === 2) {
      const interval = parsedInterval(parseInstant(parts[0]), parseInstant(parts[1]));
      if (interval) return interval;
    }
  }
  const instant = parseInstant(value);
  if (!instant) return null;
  return { kind: instant.kind, ms: instant.ms, endMs: instant.ms, interval: false };
}

function asIdList(value) {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) {
    const ids = [];
    for (let i = 0; i < value.length; i += 1) {
      if (value[i] != null && value[i] !== "") ids.push(String(value[i]));
    }
    return ids;
  }
  return [String(value)];
}

function eventCauses(origin, target) {
  const targetId = eventId(target);
  if (!targetId) return false;
  const causes = asIdList(origin.causes);
  return causes.indexOf(targetId) !== -1;
}

function isDisjointDeclared(left, right) {
  const leftId = eventId(left);
  const rightId = eventId(right);
  return asIdList(left.disjointWith).indexOf(rightId) !== -1 ||
    asIdList(right.disjointWith).indexOf(leftId) !== -1;
}

function reverseCausation(left, right, parsedLeft, parsedRight) {
  if (!parsedLeft || !parsedRight || parsedLeft.kind !== parsedRight.kind) return null;
  if (eventCauses(left, right) && parsedLeft.ms > parsedRight.ms) {
    return { causeId: eventId(left), effectId: eventId(right) };
  }
  if (eventCauses(right, left) && parsedRight.ms > parsedLeft.ms) {
    return { causeId: eventId(right), effectId: eventId(left) };
  }
  return null;
}

function intervalsOverlap(parsedLeft, parsedRight) {
  if (!parsedLeft || !parsedRight || !parsedLeft.interval || !parsedRight.interval) return false;
  if (parsedLeft.kind !== parsedRight.kind) return false;
  return parsedLeft.ms <= parsedRight.endMs && parsedRight.ms <= parsedLeft.endMs;
}

function exclusivePair(left, right) {
  return left.exclusive === true || right.exclusive === true || isDisjointDeclared(left, right);
}

function pairRecord(idA, idB, reason) {
  const eventA = idA < idB ? idA : idB;
  const eventB = idA < idB ? idB : idA;
  return { eventA: eventA, eventB: eventB, reason: reason };
}

function detectConflicts(events) {
  const list = Array.isArray(events) ? events : [];
  const conflicts = [];
  const seen = {};
  for (let i = 0; i < list.length; i += 1) {
    const left = list[i];
    if (!left || typeof left !== "object") continue;
    const parsedLeft = parseTimestamp(left.timestamp);
    for (let j = i + 1; j < list.length; j += 1) {
      const right = list[j];
      if (!right || typeof right !== "object") continue;
      const parsedRight = parseTimestamp(right.timestamp);
      let reason = null;
      const reversed = reverseCausation(left, right, parsedLeft, parsedRight);
      if (reversed) {
        reason = "cronologia invertida: " + reversed.causeId + " causa " + reversed.effectId + " mas ocorre depois.";
      } else if (intervalsOverlap(parsedLeft, parsedRight) && exclusivePair(left, right)) {
        reason = "sobreposição de intervalos exclusivos ou disjuntos.";
      }
      if (!reason) continue;
      const record = pairRecord(eventId(left), eventId(right), reason);
      const key = record.eventA + "\0" + record.eventB;
      if (seen[key]) continue;
      seen[key] = true;
      conflicts.push(record);
    }
  }
  conflicts.sort(function (a, b) {
    if (a.eventA < b.eventA) return -1;
    if (a.eventA > b.eventA) return 1;
    if (a.eventB < b.eventB) return -1;
    if (a.eventB > b.eventB) return 1;
    return 0;
  });
  return conflicts;
}

function sortTimeline(events) {
  const list = cloneEvents(events);
  const dated = [];
  const undated = [];
  for (let i = 0; i < list.length; i += 1) {
    if (hasProvidedTimestamp(list[i])) dated.push(list[i]);
    else undated.push(list[i]);
  }
  dated.sort(function (a, b) {
    const parsedA = parseTimestamp(a.timestamp);
    const parsedB = parseTimestamp(b.timestamp);
    const valueA = parsedA ? parsedA.ms : Number.POSITIVE_INFINITY;
    const valueB = parsedB ? parsedB.ms : Number.POSITIVE_INFINITY;
    if (valueA < valueB) return -1;
    if (valueA > valueB) return 1;
    return a._index - b._index;
  });
  const ordered = dated.concat(undated);
  const result = [];
  for (let i = 0; i < ordered.length; i += 1) result.push(stripIndex(ordered[i]));
  return result;
}

function buildTimeline(events) {
  const sorted = sortTimeline(events);
  const conflicts = detectConflicts(sorted);
  const flagged = {};
  for (let i = 0; i < conflicts.length; i += 1) {
    flagged[conflicts[i].eventA] = true;
    flagged[conflicts[i].eventB] = true;
  }
  let datedOrder = 0;
  const result = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const event = sorted[i];
    const known = hasProvidedTimestamp(event);
    const item = Object.assign({}, event, {
      conflict: !!flagged[eventId(event)],
      order: known ? datedOrder : null,
      timeStatus: known ? "known" : "unknown"
    });
    if (!known) item.timeLabel = "horário desconhecido";
    if (known) datedOrder += 1;
    result.push(item);
  }
  return result;
}

module.exports = {
  buildTimeline: buildTimeline,
  detectConflicts: detectConflicts,
  sortTimeline: sortTimeline
};
