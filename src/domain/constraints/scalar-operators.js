"use strict";

function isAbsent(value) {
  return value === undefined || value === null;
}

function typeName(value) {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number" && Number.isNaN(value)) return "NaN";
  return typeof value;
}

function pathPrefix(ctx) {
  const path = ctx && ctx.path;
  return path ? path + ": " : "";
}

function evalResult(result, explanation) {
  return { result: result, explanation: explanation };
}

function unknown(ctx, explanation) {
  return evalResult("UNKNOWN", pathPrefix(ctx) + explanation);
}

function match(ctx, explanation) {
  return evalResult("MATCH", pathPrefix(ctx) + explanation);
}

function noMatch(ctx, explanation) {
  return evalResult("NO_MATCH", pathPrefix(ctx) + explanation);
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function sameValue(left, right) {
  if (typeof left === "number" && typeof right === "number") {
    if (Number.isNaN(left) || Number.isNaN(right)) {
      return { comparable: false, equal: false };
    }
    return { comparable: true, equal: left === right };
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return { comparable: true, equal: false };
    for (let i = 0; i < left.length; i += 1) {
      const inner = sameValue(left[i], right[i]);
      if (!inner.comparable) return { comparable: false, equal: false };
      if (!inner.equal) return { comparable: true, equal: false };
    }
    return { comparable: true, equal: true };
  }
  if (isPlainObject(left) || isPlainObject(right)) {
    return { comparable: false, equal: false };
  }
  if (typeof left !== typeof right) {
    return { comparable: false, equal: false };
  }
  return { comparable: true, equal: left === right };
}

function eq(actual, expected, ctx) {
  if (isAbsent(actual) || isAbsent(expected)) {
    return unknown(ctx, "campo ausente ou null; eq devolve UNKNOWN, nunca NO_MATCH.");
  }
  const compared = sameValue(actual, expected);
  if (!compared.comparable) {
    return unknown(
      ctx,
      "tipos incompatíveis para eq (" + typeName(actual) + " vs " + typeName(expected) + ").",
    );
  }
  if (compared.equal) return match(ctx, "valores iguais.");
  return noMatch(ctx, "valores diferentes.");
}

function neq(actual, expected, ctx) {
  const equal = eq(actual, expected, ctx);
  if (equal.result === "UNKNOWN") {
    return unknown(ctx, equal.explanation.replace(/^[^:]+: /, "").replace(/eq /, "neq "));
  }
  if (equal.result === "MATCH") return noMatch(ctx, "valores iguais; neq não casa.");
  return match(ctx, "valores diferentes.");
}

function contains(actual, expected, ctx) {
  if (isAbsent(actual)) {
    return unknown(ctx, "campo ausente ou null; contains devolve UNKNOWN, nunca NO_MATCH.");
  }
  if (typeof actual === "string") {
    if (typeof expected !== "string") {
      return unknown(
        ctx,
        "tipos incompatíveis para contains (" + typeName(actual) + " vs " + typeName(expected) + ").",
      );
    }
    if (actual.indexOf(expected) !== -1) return match(ctx, "string contém o esperado.");
    return noMatch(ctx, "string não contém o esperado.");
  }
  if (Array.isArray(actual)) {
    if (isAbsent(expected) || isPlainObject(expected)) {
      return unknown(
        ctx,
        "tipos incompatíveis para contains (" + typeName(actual) + " vs " + typeName(expected) + ").",
      );
    }
    for (let i = 0; i < actual.length; i += 1) {
      const compared = sameValue(actual[i], expected);
      if (compared.comparable && compared.equal) return match(ctx, "array contém o elemento.");
    }
    return noMatch(ctx, "array não contém o elemento.");
  }
  return unknown(
    ctx,
    "tipos incompatíveis para contains (" + typeName(actual) + " vs " + typeName(expected) + ").",
  );
}

function inOp(actual, expected, ctx) {
  if (isAbsent(actual)) {
    return unknown(ctx, "campo ausente ou null; in devolve UNKNOWN, nunca NO_MATCH.");
  }
  if (!Array.isArray(expected)) {
    return unknown(
      ctx,
      "tipos incompatíveis para in (" + typeName(actual) + " vs " + typeName(expected) + ").",
    );
  }
  for (let i = 0; i < expected.length; i += 1) {
    const compared = sameValue(actual, expected[i]);
    if (compared.comparable && compared.equal) return match(ctx, "valor pertence ao conjunto.");
  }
  return noMatch(ctx, "valor não pertence ao conjunto.");
}

function notIn(actual, expected, ctx) {
  const membership = inOp(actual, expected, ctx);
  if (membership.result === "UNKNOWN") {
    return unknown(ctx, membership.explanation.replace(/^[^:]+: /, "").replace(/in /, "notIn "));
  }
  if (membership.result === "MATCH") return noMatch(ctx, "valor pertence ao conjunto.");
  return match(ctx, "valor não pertence ao conjunto.");
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function range(actual, expected, ctx) {
  if (isAbsent(actual)) {
    return unknown(ctx, "campo ausente ou null; range devolve UNKNOWN, nunca NO_MATCH.");
  }
  if (!isFiniteNumber(actual)) {
    return unknown(
      ctx,
      "tipos incompatíveis para range (" + typeName(actual) + " vs " + typeName(expected) + ").",
    );
  }
  if (!isPlainObject(expected)) {
    return unknown(
      ctx,
      "tipos incompatíveis para range (" + typeName(actual) + " vs " + typeName(expected) + ").",
    );
  }
  const hasMin = Object.prototype.hasOwnProperty.call(expected, "min") && expected.min != null;
  const hasMax = Object.prototype.hasOwnProperty.call(expected, "max") && expected.max != null;
  if (!hasMin && !hasMax) {
    return unknown(ctx, "intervalo sem limite numérico.");
  }
  if (hasMin && !isFiniteNumber(expected.min)) {
    return unknown(ctx, "tipos incompatíveis para range (min " + typeName(expected.min) + ").");
  }
  if (hasMax && !isFiniteNumber(expected.max)) {
    return unknown(ctx, "tipos incompatíveis para range (max " + typeName(expected.max) + ").");
  }
  if (hasMin && hasMax && expected.min > expected.max) {
    return unknown(ctx, "intervalo invertido (min > max).");
  }
  if (hasMin && actual < expected.min) return noMatch(ctx, "abaixo do mínimo inclusivo.");
  if (hasMax && actual > expected.max) return noMatch(ctx, "acima do máximo inclusivo.");
  return match(ctx, "dentro do intervalo inclusivo.");
}

module.exports = {
  eq: eq,
  neq: neq,
  contains: contains,
  in: inOp,
  notIn: notIn,
  range: range,
};
