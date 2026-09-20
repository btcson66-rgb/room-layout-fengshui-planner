/**
 * Keep RoomFeng placement keys separate from Google's numeric ad-unit IDs.
 *
 * PUBLIC_ADSENSE_MANUAL_SLOTS is intentionally optional. It may contain a
 * JSON object such as {"en-home-mid":"1234567890"} when a real, reviewed
 * AdSense unit is configured. Invalid, missing, and placement-like values
 * always resolve to null so they can never reach data-ad-slot.
 */
const rawManualSlots = import.meta.env?.PUBLIC_ADSENSE_MANUAL_SLOTS ?? '';

/** @returns {Record<string, unknown>} */
function readConfiguredSlots(raw) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

const configuredSlots = readConfiguredSlots(rawManualSlots);
const numericSlotPattern = /^\d+$/;

/** @param {unknown} value */
export function isValidAdSenseSlot(value) {
  return typeof value === 'string' && numericSlotPattern.test(value);
}

/** @param {string} placement @param {string | undefined} explicitSlot */
export function resolveAdSenseSlot(placement, explicitSlot = undefined) {
  const candidate = explicitSlot ?? configuredSlots[placement];
  return isValidAdSenseSlot(candidate) ? candidate : null;
}

export function hasConfiguredManualSlot(placement) {
  return resolveAdSenseSlot(placement) !== null;
}
