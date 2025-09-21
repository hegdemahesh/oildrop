import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { initializeApp, getApp, getApps } from 'firebase/app';

// We rely on existing initialization via services/firebase but for safety we ensure an app instance exists.
const getFirebaseApp = () => {
  if (!getApps().length) {
    return initializeApp({
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    });
  }
  return getApp();
};

// This component only renders anything on native (iOS/Android); on web we use the invisible div container.
export const PhoneRecaptcha = forwardRef<FirebaseRecaptchaVerifierModal>((props, ref) => {
  if (Platform.OS === 'web') return null as any;
  const app = getFirebaseApp();
  return (
    <FirebaseRecaptchaVerifierModal
      ref={ref}
      firebaseConfig={app.options}
      attemptInvisibleVerification={true}
    />
  );
});

export default PhoneRecaptcha;
