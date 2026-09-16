export function isUnaffordable(currentHours, cost, allowZero = false) {
  const n = Number(cost);
  const remaining = currentHours - n;
  return !Number.isFinite(n) || n < 0 || remaining < 0 || remaining === 0 && !allowZero;
}

export function debitHours(state, cost, allowZero = false) {
  if (isUnaffordable(state.hours, cost, allowZero)) {
    return { ok: false, remaining: 0, defeat: true, hours: 0 };
  }
  const remaining = state.hours - Number(cost);
  return { ok: true, remaining, defeat: false, hours: remaining };
}
