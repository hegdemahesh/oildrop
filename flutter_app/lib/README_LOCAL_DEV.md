# Local Development Guide

## 1. Prerequisites
- Flutter SDK installed (3.3 or newer)
- Dart in PATH
- Firebase project already configured (same one as web demo)
- FlutterFire CLI: `dart pub global activate flutterfire_cli`

## 2. Configure Firebase
From `flutter_app/` run:
```
flutterfire configure
```
Select existing project. This generates `lib/firebase_options.dart`.
Then in `lib/main.dart` replace:
```
import 'src/firebase_options_placeholder.dart';
```
with:
```
import 'firebase_options.dart';
```
Delete the placeholder file if desired.

## 3. Install Dependencies
```
flutter pub get
```

## 4. Run the App
Android emulator / device:
```
flutter run
```
Web (optional for debugging, not prod target):
```
flutter run -d chrome
```

## 5. Authentication
- Register or sign in with email/password.
- Toggle the fingerprint icon switch to enable biometric prompt on next launch.

## 6. Test Cloud Function
Press "Test Cloud Function" on Home screen. You should see a snackbar with `Ping: ok @ <time>`.
If it fails:
- Ensure you deployed the callable `ping` function: `firebase deploy --only functions:ping` (or full deploy).
- Make sure you are logged in (ping requires auth).

## 7. Using Emulators (Optional)
Start emulators (from repo root):
```
firebase emulators:start --only functions,firestore,auth
```
Then in Flutter early init (before any Firebase usage) add something like:
```
FirebaseFirestore.instance.useFirestoreEmulator('localhost', 8080);
FirebaseAuth.instance.useAuthEmulator('localhost', 9099);
FirebaseFunctions.instance.useFunctionsEmulator('localhost', 5001);
```
(You can wrap this behind a debug flag.)

## 8. Troubleshooting
- `MissingPluginException`: run `flutter clean && flutter pub get` and rebuild.
- iOS biometric issues: add NSFaceIDUsageDescription to Info.plist.
- Android set minSdkVersion >= 21 in `android/app/build.gradle` (local_auth requires).

## 9. Next Development Steps
- Add Firestore repositories for customers & inventory.
- Mirror callable sales/payment logic.
- Implement role-based guards (read /roles/{uid}).
- Add secure logout + data wipe on sign out.

## 10. Deployment
Later we will configure flavors or build types; for now just use debug builds.
