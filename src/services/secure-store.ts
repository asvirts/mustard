import * as SecureStore from 'expo-secure-store';

/**
 * Native (iOS Keychain / Android Keystore) storage for secrets such as the
 * YouVersion App Key. Web has its own implementation in `secure-store.web.ts`.
 */
export async function getSecret(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setSecret(key: string, value: string): Promise<void> {
  try {
    if (value) {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch {
    // Ignore secure storage errors
  }
}
