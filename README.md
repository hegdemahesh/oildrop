# OilDrop Garage App

Cross-platform (Android / iOS / Web) inventory, billing & GST reporting app for a small garage selling engine oils & coolants.

Tech Stack:
- Frontend: Expo (React Native + React Native Web)
- Backend: Firebase (Auth, Firestore, Storage, Cloud Functions)
- PDF: jsPDF
- Excel: SheetJS (xlsx)
- Messaging: (Pluggable) Twilio / WhatsApp Business API (future)

Monorepo structure:
```
oildrop/
  app/            # Expo project (frontend)
  functions/      # Firebase Cloud Functions (TypeScript)
  firebase.json   # Firebase config (hosting + emulators)
  .firebaserc     # Firebase project alias mapping
```

## 1. Prerequisites
- Node 18+
- npm (or yarn / pnpm)
- Firebase CLI: `npm install -g firebase-tools`
- Expo CLI (optional classic): `npm install -g expo`
- Java JDK + Android Studio (for Android), Xcode (for iOS)

## 2. Environment Variables
Copy `app/.env.example` to `app/.env` (values for production already prefilled for project `lubelogix`; replace Google OAuth client IDs):

Required additions (obtain from Google Cloud Console OAuth credentials):
- EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
- EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
- EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID

For local emulators the SDK auto-detects if you call `connectEmulator` helpers.

## 3. Install Dependencies
```
cd app
npm install
cd ../functions
npm install
```

## 4. Run Firebase Emulators (Firestore, Auth, Functions, Hosting)
In repo root (where `firebase.json` resides):
```
firebase emulators:start
```

## 5. Run the Expo App (with web support)
In another terminal:
```
cd app
npm start
```
Choose: `w` for web, `a` for Android, `i` for iOS (Mac only).

The app will auto-use emulators when `NODE_ENV !== 'production'` (see `services/firebase.ts`).

## 6. Build Web Version & Host via Firebase
```
cd app
npx expo export --platform web
cd ..
firebase deploy --only hosting
```

## 7. Cloud Functions Deployment
```
cd functions
npm run build
firebase deploy --only functions
```

## 8. Features (Initial Scaffold)
Implemented (scaffold / placeholder logic) now targeting Firebase project `lubelogix`:
- Google (Gmail) sign-in using Firebase Auth & Expo AuthSession
- Role-based context (Owner/Admin) placeholder
- Navigation: Login -> Dashboard -> Customers / Inventory / Sales
- Hooks: `useAuth`, `useInventory`, `useCustomers`
- Invoice creation local draft object (future: persist & trigger function)
- PDF & Excel utility placeholders
- Cloud Functions: sample HTTPS endpoints & Firestore triggers for invoices + GST summary

## 9. Next Steps / Roadmap
- Persist invoices & inventory adjustments
- Implement GST calculation util & monthly summaries
- WhatsApp/Twilio messaging integration (secure callable function with admin check)
- Add sales reporting & charts
- Low stock alert system (function scheduled via `pubsub.schedule`)
- Role management UI (owner assigns admin) stored in `roles` collection

## 10. Testing Strategy
- Unit tests (future): hooks & pure utils
- Emulator-based integration: create invoice, verify stock decrement

## 11. Directory Highlights (Frontend)
```
src/
  navigation/       # React Navigation stacks
  screens/          # UI Screens
  components/       # Reusable UI parts
  hooks/            # Data & state hooks
  context/          # Providers
  services/         # Firebase init & API wrappers
  utils/            # PDF / Excel helpers
  types/            # Shared TS types
```

## 12. Security Notes
- Never commit `.env` with Firebase keys (though web keys are public, keep pattern consistent)
- Restrictive Firestore rules needed (not included yet)
- Cloud Functions to enforce server-side stock & role checks

## 13. Firestore Suggested Collections
```
customers/{customerId}
inventory/{itemId}
invoices/{invoiceId}
roles/{uid}  => { role: 'owner' | 'admin' }
meta/config  => global settings
```

## 14. Sample Firestore Security Rules (conceptual)
```
match /roles/{uid} {
  allow read: if request.auth != null;
  allow write: if isOwner();
}
match /inventory/{id} {
  allow read: if signedIn();
  allow write: if isAdminOrOwner();
}
```

## 15. Troubleshooting
- Web Google sign-in blocked: Ensure correct OAuth redirect (https://auth.expo.io/@your-username/oildrop) or use new Auth Session pattern.
- Emulator connection issues: Confirm host `127.0.0.1` & ports not occupied.

## 16. License
Internal / Proprietary (adjust as needed).
