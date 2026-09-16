import { isUnaffordable, debitHours } from "./time-service.js";

export function canTravel(state, game, destinationId, navigation) {
  const from = state.location;
  const graph = navigation || game.navigation || {};
  const allowed = graph[from] || [];
  if (!allowed.includes(destinationId)) return { ok: false, reason: "not-adjacent" };
  const cost = game.travel?.[from]?.[destinationId];
  if (typeof cost !== "number") return { ok: false, reason: "no-cost" };
  if (isUnaffordable(state.hours, cost, false)) return { ok: false, reason: "unaffordable" };
  return { ok: true, cost };
}

export function applyTravel(state, game, destinationId, navigation) {
  const check = canTravel(state, game, destinationId, navigation);
  if (!check.ok) return { ok: false, newState: state, hoursSpent: 0, reason: check.reason };
  const debit = debitHours(state, check.cost, false);
  if (!debit.ok) {
    return { ok: false, newState: Object.assign({}, state, { hours: 0, finished: true }), hoursSpent: 0, defeat: true, reason: "timeout" };
  }
  const visited = state.visited.includes(destinationId) ? state.visited.slice() : state.visited.concat(destinationId);
  return {
    ok: true,
    hoursSpent: check.cost,
    newState: Object.assign({}, state, {
      hours: debit.hours,
      location: destinationId,
      route: state.route.concat(destinationId),
      visited,
    }),
  };
}
