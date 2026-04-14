'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    
    // If we have a valid config, use it directly to avoid unnecessary warnings 
    // about automatic initialization failing.
    if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId) {
      try {
        firebaseApp = initializeApp(firebaseConfig);
        return getSdks(firebaseApp);
      } catch (e) {
        console.error('Failed to initialize Firebase with config object:', e);
      }
    }

    try {
      // Attempt to initialize via Firebase App Hosting environment variables as a fallback
      firebaseApp = initializeApp();
    } catch (e) {
      // If both fail, we have a problem
      if (process.env.NODE_ENV === "production") {
        console.error('Firebase initialization failed completely.', e);
      }
      // Last resort fallback to config if not already tried
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  // Check if firestoreDatabaseId is provided in the config
  const dbId = (firebaseConfig as any).firestoreDatabaseId;
  
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp)
  };
}
