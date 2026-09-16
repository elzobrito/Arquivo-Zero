"use strict";

function isUnaffordable(currentHours, cost, allowZero) {
  const n = Number(cost);
  const remaining = currentHours - n;
  return !Number.isFinite(n) || n < 0 || remaining < 0 || remaining === 0 && !allowZero;
}

function debitHours(state, cost, allowZero) {
  if (isUnaffordable(state.hours, cost, allowZero)) {
    return { ok: false, remaining: 0, defeat: true, hours: 0 };
  }
  const remaining = state.hours - Number(cost);
  return { ok: true, remaining, defeat: false, hours: remaining };
}

module.exports = { isUnaffordable, debitHours };
