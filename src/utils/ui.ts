import { Alert, Platform } from 'react-native';

/** Asks the user to confirm a destructive action. Works on iOS, Android and web. */
export function confirmDestructive(options: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}): void {
  const { title, message, confirmLabel = 'Delete', onConfirm } = options;

  if (Platform.OS === 'web') {
    // react-native-web's Alert.alert is a no-op, so fall back to the browser dialog.
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

/** Returns the *local* calendar date as YYYY-MM-DD (toISOString() would use UTC). */
export function localDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
