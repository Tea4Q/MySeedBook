/**
 * Web stub for expo-secure-store.
 * expo-secure-store is a native module — it does not run in a browser.
 * On web we fall back to localStorage (no encryption, same-origin only).
 * Voice transcription is already gated to Platform.OS !== 'web' in the UI,
 * so this stub only needs to satisfy the import resolver.
 */

export async function getItemAsync(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItemAsync(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage may be unavailable (e.g. private browsing limits)
  }
}

export async function deleteItemAsync(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

export default {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
};
