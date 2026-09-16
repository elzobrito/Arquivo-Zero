export function filterSuspects(game, chosen) {
  const pairs = chosen || [];
  return (game.suspects || []).filter((suspect) => pairs.every(([key, value]) => suspect[key] === value));
}

export function issueWarrant(state, suspectId) {
  return Object.assign({}, state, { warrant: true, warrantSuspect: suspectId });
}
