const KEY_PREFIX = "masaarat:kids:active-profile:";

export function getActiveKidsProfile(userId: string): string | null {
  try {
    return window.localStorage.getItem(`${KEY_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

export function setActiveKidsProfile(userId: string, profileId: string): void {
  try {
    window.localStorage.setItem(`${KEY_PREFIX}${userId}`, profileId);
  } catch {
    // The current page can still use the chosen profile when storage is unavailable.
  }
}

export function clearActiveKidsProfile(userId: string): void {
  try {
    window.localStorage.removeItem(`${KEY_PREFIX}${userId}`);
  } catch {
    // The current page still clears its selection.
  }
}
