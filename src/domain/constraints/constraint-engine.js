"use strict";

const scalars = require("./scalar-operators.js");

const MAX_DEPTH = 10;
const RESULTS = { MATCH: true, NO_MATCH: true, UNKNOWN: true };

function evalResult(result, explanation) {
  return { result: result, explanation: explanation };
}

function shape(rule) {
  if (!rule || !RESULTS[rule.result] || typeof rule.explanation !== "string") {
    return evalResult("UNKNOWN", "regra malformada.");
  }
  return { result: rule.result, explanation: rule.explanation };
}

function joinParts(op, parts) {
  return op + ": " + parts.join(" ");
}

function composeAnd(rules) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return evalResult("UNKNOWN", "AND sem operandos.");
  }
  let sawUnknown = false;
  const parts = [];
  for (let i = 0; i < rules.length; i += 1) {
    const item = shape(rules[i]);
    parts.push(item.explanation);
    if (item.result === "NO_MATCH") {
      return evalResult("NO_MATCH", joinParts("AND", parts));
    }
    if (item.result === "UNKNOWN") sawUnknown = true;
  }
  if (sawUnknown) return evalResult("UNKNOWN", joinParts("AND", parts));
  return evalResult("MATCH", joinParts("AND", parts));
}

function composeOr(rules) {
  if (!Array.isArray(rules) || rules.length === 0) {
    return evalResult("UNKNOWN", "OR sem operandos.");
  }
  let sawUnknown = false;
  const parts = [];
  for (let i = 0; i < rules.length; i += 1) {
    const item = shape(rules[i]);
    parts.push(item.explanation);
    if (item.result === "MATCH") {
      return evalResult("MATCH", joinParts("OR", parts));
    }
    if (item.result === "UNKNOWN") sawUnknown = true;
  }
  if (sawUnknown) return evalResult("UNKNOWN", joinParts("OR", parts));
  return evalResult("NO_MATCH", joinParts("OR", parts));
}

function composeNot(rule) {
  const item = shape(rule);
  if (item.result === "MATCH") return evalResult("NO_MATCH", "NOT: " + item.explanation);
  if (item.result === "NO_MATCH") return evalResult("MATCH", "NOT: " + item.explanation);
  return evalResult("UNKNOWN", "NOT: " + item.explanation);
}

function ownGet(object, key) {
  if (object == null || (typeof object !== "object" && typeof object !== "function")) {
    return { present: false, value: undefined };
  }
  if (Array.isArray(object) && /^\d+$/.test(String(key))) {
    const index = Number(key);
    if (index >= 0 && index < object.length) return { present: true, value: object[index] };
    return { present: false, value: undefined };
  }
  if (!Object.prototype.hasOwnProperty.call(object, key)) {
    return { present: false, value: undefined };
  }
  return { present: true, value: object[key] };
}

function resolvePath(record, path) {
  if (path == null || path === "") return { present: record !== undefined, value: record };
  const parts = String(path).split(".");
  let current = record;
  for (let i = 0; i < parts.length; i += 1) {
    if (current === null) return { present: false, value: undefined };
    const step = ownGet(current, parts[i]);
    if (!step.present) return { present: false, value: undefined };
    current = step.value;
  }
  return { present: true, value: current };
}

function operatorFn(name) {
  if (name === "in") return scalars.in;
  return scalars[name];
}

function evaluateAtom(node, context) {
  const record = context && context.record;
  const resolved = resolvePath(record, node.path);
  const fn = operatorFn(node.operator);
  if (typeof fn !== "function") {
    return evalResult("UNKNOWN", "operador desconhecido: " + String(node.operator) + ".");
  }
  if (!resolved.present || resolved.value === undefined) {
    return fn(undefined, node.value, { path: node.path });
  }
  return fn(resolved.value, node.value, { path: node.path });
}

function evaluateNode(node, context, depth, objectStack, idStack) {
  if (depth > MAX_DEPTH) {
    return evalResult("UNKNOWN", "aviso: profundidade " + depth + " excede o máximo " + MAX_DEPTH + ".");
  }
  if (!node || typeof node !== "object") {
    return evalResult("UNKNOWN", "nó malformado.");
  }
  for (let i = 0; i < objectStack.length; i += 1) {
    if (objectStack[i] === node) {
      return evalResult("UNKNOWN", "referência circular detectada.");
    }
  }
  if (node.id != null && idStack.indexOf(node.id) !== -1) {
    return evalResult("UNKNOWN", "referência circular detectada (id " + node.id + ").");
  }

  const nextObjects = objectStack.concat([node]);
  const nextIds = node.id != null ? idStack.concat([node.id]) : idStack.slice();
  const op = node.op;

  if (op === "ATOM") return evaluateAtom(node, context);

  if (op === "NOT") {
    const children = Array.isArray(node.children) ? node.children : [];
    if (children.length !== 1) {
      return evalResult("UNKNOWN", "NOT exige exatamente um filho.");
    }
    return composeNot(evaluateNode(children[0], context, depth + 1, nextObjects, nextIds));
  }

  if (op === "AND" || op === "OR") {
    const children = Array.isArray(node.children) ? node.children : [];
    const evaluated = [];
    for (let i = 0; i < children.length; i += 1) {
      evaluated.push(evaluateNode(children[i], context, depth + 1, nextObjects, nextIds));
    }
    return op === "AND" ? composeAnd(evaluated) : composeOr(evaluated);
  }

  return evalResult("UNKNOWN", "op desconhecido: " + String(op) + ".");
}

function evaluate(node, context) {
  return evaluateNode(node, context || {}, 1, [], []);
}

module.exports = {
  composeAnd: composeAnd,
  composeOr: composeOr,
  composeNot: composeNot,
  evaluate: evaluate,
  MAX_DEPTH: MAX_DEPTH,
};
