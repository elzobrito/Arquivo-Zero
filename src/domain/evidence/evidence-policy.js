"use strict";

/**
 * An evidence record is admissible unless it was explicitly marked as
 * inadmissible. Unknown admissibility receives the benefit of the doubt.
 */
function isAdmissible(record) {
  return !!record && record.admissibility !== "inadmissible";
}

/**
 * Missing quality is not a failed quality check. When quality is available,
 * it must meet the requested minimum.
 */
function meetsQualityThreshold(record, minQuality = 0) {
  if (!record) return false;
  if (record.quality == null) return true;
  return record.quality >= minQuality;
}

/**
 * Integrity is acceptable unless it was explicitly marked as compromised.
 * Unverified integrity receives the benefit of the doubt.
 */
function isIntegrityVerified(record) {
  return !!record && record.integrity !== "compromised";
}

/**
 * Evidence can support an arrest only when neither admissibility nor
 * integrity contains an explicit blocking decision.
 */
function canSupportArrest(record) {
  return isAdmissible(record) && isIntegrityVerified(record);
}

module.exports = {
  isAdmissible,
  meetsQualityThreshold,
  isIntegrityVerified,
  canSupportArrest,
};
