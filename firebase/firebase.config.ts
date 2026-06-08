// ============================================================
// FIREBASE CONFIG - Mobile App
// ============================================================
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getAuth } from "firebase/auth";
// @ts-ignore
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAZrHLLG2RxxoIqkOdwz79bVHCXM0GhJIw",
  authDomain: "peshraft-6084a.firebaseapp.com",
  projectId: "peshraft-6084a",
  storageBucket: "peshraft-6084a.firebasestorage.app",
  messagingSenderId: "6990579301",
  appId: "1:6990579301:web:eb44fb2e604771bbf9288c",
};

// Prevent duplicate app initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize auth with AsyncStorage persistence
let auth: any;
try {
  const { getReactNativePersistence } = require("firebase/auth");
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);