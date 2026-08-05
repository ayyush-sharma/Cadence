"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import type { AuthUser } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the initial auth state resolves. */
  loading: boolean;
  /** False when env vars are missing; the UI shows a setup guide instead. */
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Strip the Firebase `User` down to a plain object for the UI. */
function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();

  // `resolved` flips once Firebase reports an initial auth state. Combining it
  // with the user in one state object keeps the effect free of synchronous
  // setState, which would trigger a cascading render.
  const [state, setState] = useState<{
    resolved: boolean;
    user: AuthUser | null;
  }>({ resolved: false, user: null });

  useEffect(() => {
    // Without config there is nothing to subscribe to; the shell shows the
    // setup guide, and `loading` below is already false in that case.
    if (!configured) return;

    const unsubscribe = onAuthStateChanged(
      getFirebaseAuth(),
      (firebaseUser) =>
        setState({
          resolved: true,
          user: firebaseUser ? toAuthUser(firebaseUser) : null,
        }),
      () => setState({ resolved: true, user: null }),
    );

    return unsubscribe;
  }, [configured]);

  const user = state.user;
  const loading = configured && !state.resolved;

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password,
      );
    },
    [],
  );

  const registerWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password,
      );

      const name = displayName.trim();
      if (name) {
        await updateProfile(credential.user, { displayName: name });
        // `updateProfile` does not re-fire `onAuthStateChanged`, so reflect the
        // new name immediately rather than waiting for the next sign-in.
        setState({ resolved: true, user: toAuthUser(credential.user) });
      }
    },
    [],
  );

  const logOut = useCallback(async () => {
    await signOut(getFirebaseAuth());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured,
      signInWithGoogle,
      signInWithEmail,
      registerWithEmail,
      logOut,
    }),
    [
      user,
      loading,
      configured,
      signInWithGoogle,
      signInWithEmail,
      registerWithEmail,
      logOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth() must be used inside <AuthProvider>.");
  }
  return context;
}
