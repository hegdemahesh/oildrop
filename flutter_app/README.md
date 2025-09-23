# Oildrop Mobile (Flutter)

This is the new Flutter mobile client that will eventually replace / augment the existing web demo.

## Current Scope
- Firebase Email/Password Authentication
- Biometric toggle (fingerprint / face) post-login using `local_auth`
- Secure storage of biometric preference
- Basic AuthGate + Home screen scaffolding

## Next Possible Features
- Firestore integration for customers, inventory, sales
- Invoking existing Cloud Functions (callable) for sales & payments
- Offline caching & sync
- Role-based UI controls based on Firestore `roles` collection
- Invoice PDF viewing/sharing

## Project Structure
```
flutter_app/
  lib/
    main.dart
    src/
      firebase_options_placeholder.dart   # replace via flutterfire configure
      services/
        auth_service.dart
      ui/
        auth_gate.dart
        sign_in_screen.dart
        home_screen.dart
  pubspec.yaml
```

## Setup Steps
1. Install Flutter SDK (3.3+ recommended) and run:
   ```bash
   flutter doctor
   ```
2. Activate FlutterFire CLI if not already:
   ```bash
   dart pub global activate flutterfire_cli
   ```
3. From `flutter_app` directory run:
   ```bash
   flutterfire configure
   ```
   Select the existing Firebase project (the one hosting your Cloud Functions). This generates `lib/firebase_options.dart`.
4. Remove `firebase_options_placeholder.dart` import from `main.dart` and import the generated one instead.
5. Install dependencies:
   ```bash
   flutter pub get
   ```
6. Run the app (Android example):
   ```bash
   flutter run
   ```
7. Create a user or sign in. Toggle biometric switch to store preference. On next app start (and already signed in) a biometric prompt appears.

## Biometric Notes
- Uses `local_auth`. On Android requires edits in `android/app/src/main/AndroidManifest.xml` if you add custom permissions.
- iOS requires Face ID usage description in `Info.plist`.

## Using Existing Cloud Functions
Later we will:
- Add callable functions via `FirebaseFunctions.instance.httpsCallable('functionName')`.
- Mirror interfaces used in the web app.

## Keeping Web App Frozen
The `/web` folder remains as reference; all new feature work proceeds in Flutter.

## Troubleshooting
- If Firebase initialization fails, verify `firebase_options.dart` exists.
- For biometrics returning false: ensure device/emulator has a fingerprint/face enrolled.

## License
Internal / Proprietary (adjust as needed).
