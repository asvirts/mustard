/**
 * Browsers have no secure enclave equivalent; anything in localStorage is readable
 * by any script on the origin. On web, secrets are therefore kept in memory only
 * for the current session and are never persisted.
 */
const memory = new Map<string, string>();

export async function getSecret(key: string): Promise<string | null> {
  return memory.get(key) ?? null;
}

export async function setSecret(key: string, value: string): Promise<void> {
  if (value) {
    memory.set(key, value);
  } else {
    memory.delete(key);
  }
}
