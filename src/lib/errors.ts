/**
 * Translate Firebase error codes into messages a user can act on.
 *
 * Raw codes like `auth/invalid-credential` are meaningless in the UI, and
 * Firebase's own `error.message` leaks internals such as request URLs.
 */

const AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/email-already-in-use": "An account already exists with that email.",
  "auth/weak-password": "Choose a password of at least 6 characters.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/popup-blocked":
    "Your browser blocked the sign-in popup. Allow popups and try again.",
  "auth/too-many-requests": "Too many attempts. Try again in a few minutes.",
  "auth/network-request-failed": "Network problem. Check your connection.",
  "auth/unauthorized-domain":
    "This domain isn't authorised in Firebase. Add it under Authentication → Settings → Authorized domains.",
  "auth/operation-not-allowed":
    "That sign-in method is disabled. Enable it in the Firebase console.",
};

const FIRESTORE_MESSAGES: Record<string, string> = {
  "permission-denied":
    "You don't have permission for that. Check your Firestore security rules.",
  unavailable: "Can't reach the database. You may be offline.",
  "failed-precondition":
    "The database needs an index for this query. Check the Firebase console.",
  unauthenticated: "Your session expired. Please sign in again.",
};

/** Narrow an unknown thrown value to a Firebase-style `{ code }` error. */
function errorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

export function friendlyAuthError(error: unknown): string {
  const code = errorCode(error);
  if (code && AUTH_MESSAGES[code]) return AUTH_MESSAGES[code];
  return "Something went wrong signing you in. Please try again.";
}

export function friendlyDataError(error: unknown): string {
  const code = errorCode(error);
  if (code && FIRESTORE_MESSAGES[code]) return FIRESTORE_MESSAGES[code];
  return "Couldn't sync with the database. Please try again.";
}
