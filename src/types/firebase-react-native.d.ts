/**
 * Minimal ambient types so the TS checker doesn't complain if the
 * 'firebase/auth/react-native' entrypoint isn't present (Firebase 11+).
 * At runtime we load it via dynamic require() only when it exists.
 */
declare module 'firebase/auth/react-native' {
  import type { FirebaseApp } from 'firebase/app'
  import type { Auth } from 'firebase/auth'
  export function initializeAuth(app: FirebaseApp, options?: any): Auth
  export function getReactNativePersistence(storage: any): any
}
