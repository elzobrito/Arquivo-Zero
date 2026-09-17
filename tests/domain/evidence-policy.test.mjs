#!/usr/bin/env node
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const require = createRequire(import.meta.url);
const policy = require(resolve(root, "src/domain/evidence/evidence-policy.js"));
const evidenceService = require(resolve(root, "src/domain/evidence/evidence-service.js"));
const { isAdmissible, meetsQualityThreshold, isIntegrityVerified, canSupportArrest } = policy;
const { getDiscovered } = evidenceService;

const errors = [];
function check(label, condition) {
  if (!condition) errors.push(label);
}

check("INV-001 unknown admissibility accepted", isAdmissible({ admissibility: "unknown" }) === true);
check("INV-002 admissible accepted", isAdmissible({ admissibility: "admissible" }) === true);
check("INV-003 inadmissible rejected", isAdmissible({ admissibility: "inadmissible" }) === false);
check("INV-004 null quality accepted", meetsQualityThreshold({ quality: null }) === true);
check("INV-005 zero quality meets zero threshold", meetsQualityThreshold({ quality: 0 }) === true);
check("INV-006 quality below threshold rejected", meetsQualityThreshold({ quality: 0.5 }, 0.7) === false);
check("INV-007 verified integrity accepted", isIntegrityVerified({ integrity: "verified" }) === true);
check("INV-008 unverified integrity accepted", isIntegrityVerified({ integrity: "unverified" }) === true);
check("INV-009 compromised integrity rejected", isIntegrityVerified({ integrity: "compromised" }) === false);
check("INV-010 inadmissible cannot support arrest", canSupportArrest({ admissibility: "inadmissible", integrity: "verified" }) === false);
check("INV-011 compromised cannot support arrest", canSupportArrest({ admissibility: "unknown", integrity: "compromised" }) === false);
check("INV-012 unknown and unverified supports arrest", canSupportArrest({ admissibility: "unknown", integrity: "unverified" }) === true);
check("INV-013 admissible and verified supports arrest", canSupportArrest({ admissibility: "admissible", integrity: "verified" }) === true);

const game = {
  evidence: [
    { id: "EA1", admissibility: "admissible", quality: null, integrity: "verified" },
    { id: "EB1", admissibility: "inadmissible", quality: 0.2, integrity: "verified" },
  ],
};
const discovered = getDiscovered({ evidence: ["EA1", "EB1"] }, game);
check("INV-014 inadmissible evidence remains discovered", discovered.length === 2 && discovered.some((record) => record.id === "EB1"));
check("INV-015 inadmissible evidence is not supporting", discovered.filter((record) => canSupportArrest(record)).map((record) => record.id).join() === "EA1");

if (errors.length) {
  console.error("EVIDENCE_POLICY_FAIL");
  for (const error of errors) console.error("-", error);
  process.exit(1);
}

console.log("EVIDENCE_POLICY_PASS tests=15");
