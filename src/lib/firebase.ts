import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Firebase client bootstrap.
 *
 * Everything here is browser-only and lazily initialised. That matters on
 * Cloudflare Workers: initialising at module scope would run during SSR and
 * during the build, where `window` is absent and the env vars may not be set,
 * which breaks the build rather than the request.
 *
 * All keys are `NEXT_PUBLIC_*` and inlined into the client bundle. That is
 * expected — Firebase web config is public by design, and access is controlled
 * by Firestore security rules plus the authorised-domains list, not by hiding
 * the API key. See `firestore.rules`.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** The keys that must be present for the SDK to work at all. */
const REQUIRED_KEYS = ["apiKey", "authDomain", "projectId", "appId"] as const;

/**
 * True when the app has enough config to talk to Firebase.
 *
 * The UI checks this to show a setup guide instead of crashing, which keeps a
 * fresh `git clone` runnable before anyone creates a Firebase project.
 */
export function isFirebaseConfigured(): boolean {
  return REQUIRED_KEYS.every((key) => {
    const value = firebaseConfig[key];
    return typeof value === "string" && value.length > 0;
  });
}

function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Copy .env.example to .env.local and fill in your project credentials.",
    );
  }
  // `getApps()` guards against re-initialising across Fast Refresh reloads.
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("getFirebaseAuth() is browser-only.");
  }
  authInstance ??= getAuth(getFirebaseApp());
  return authInstance;
}

export function getDb(): Firestore {
  if (typeof window === "undefined") {
    throw new Error("getDb() is browser-only.");
  }
  dbInstance ??= getFirestore(getFirebaseApp());
  return dbInstance;
}
