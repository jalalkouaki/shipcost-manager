import type { Scenario } from '../types';

/**
 * Encodes a scenario into a URL-safe base64 hash parameter.
 */
export function encodeScenarioToHash(scenario: Scenario): string {
  try {
    const jsonStr = JSON.stringify(scenario);
    // Base64 encode UTF-8 string safely in browser
    const base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
    return `scenario=${base64}`;
  } catch (e) {
    console.error('Failed to encode scenario to hash', e);
    return '';
  }
}

/**
 * Decodes a scenario from a URL-safe base64 hash parameter.
 */
export function decodeScenarioFromHash(hashStr: string): Scenario | null {
  try {
    const cleanHash = hashStr.startsWith('#') ? hashStr.slice(1) : hashStr;
    const params = new URLSearchParams(cleanHash);
    const b64 = params.get('scenario');
    if (!b64) return null;

    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(atob(b64), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.name && parsed.product && Array.isArray(parsed.profiles)) {
      return parsed as Scenario;
    }
    return null;
  } catch (e) {
    console.error('Failed to decode scenario from hash', e);
    return null;
  }
}

/**
 * Generates a full shareable permalink URL for the given scenario.
 */
export function generateScenarioPermalink(scenario: Scenario): string {
  const hash = encodeScenarioToHash(scenario);
  const url = new URL(window.location.href);
  url.hash = hash;
  return url.toString();
}
