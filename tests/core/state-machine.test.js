#!/usr/bin/env node
const { STATES, getCurrentState, transition, isTerminal, canArrest } = require("../../src/core/state-machine.js");
const errors = [];
function check(label, cond) {
  if (!cond) errors.push(label);
}

check("briefing", getCurrentState({ finished: false, warrant: false, rewarded: false, actions: [], route: ["a"] }) === STATES.BRIEFING);
check("investigating", getCurrentState({ finished: false, warrant: false, actions: ["x"], route: ["a"] }) === STATES.INVESTIGATING);
check("warrant", getCurrentState({ finished: false, warrant: true, actions: ["x"] }) === STATES.WARRANT_ISSUED);
check("won", getCurrentState({ finished: true, rewarded: true }) === STATES.CASE_WON);
check("lost time", getCurrentState({ finished: true, rewarded: false, warrant: false }) === STATES.CASE_LOST_TIME);
check("lost warrant", getCurrentState({ finished: true, rewarded: false, warrant: true }) === STATES.CASE_LOST_WARRANT);

check("canArrest only warrant", canArrest(STATES.WARRANT_ISSUED) && !canArrest(STATES.INVESTIGATING) && !canArrest(STATES.BRIEFING));
check("terminal won", isTerminal(STATES.CASE_WON));
check("terminal lost", isTerminal(STATES.CASE_LOST_TIME) && isTerminal(STATES.CASE_LOST_WARRANT));
check("not terminal investigating", !isTerminal(STATES.INVESTIGATING));

check("briefing+action", transition({ actions: [], route: ["a"] }, "ACTION").newState === STATES.INVESTIGATING);
check("investigating+warrant", transition({ actions: ["x"], warrant: false }, "WARRANT").newState === STATES.WARRANT_ISSUED);
check("invalid arrest without warrant", transition({ actions: ["x"], warrant: false }, "ARREST_VALID").ok === false);
check("warrant+valid", transition({ warrant: true, finished: false }, "ARREST_VALID").newState === STATES.CASE_WON);
check("timeout briefing", transition({ actions: [], route: ["a"] }, "TIMEOUT").newState === STATES.CASE_LOST_TIME);
check("no warrant from briefing", transition({ actions: [], route: ["a"] }, "WARRANT").ok === false);

if (errors.length) {
  console.error("FSM_FAIL");
  for (const e of errors) console.error("-", e);
  process.exit(1);
}
console.log("FSM_PASS");
