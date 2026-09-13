# RevenueWorks

A responsive financial workspace for projects, cost centers, revenue, and deductions.

## Run locally

1. Copy `.env.example` to `.env` and provide Firebase credentials to use Firebase.
2. Run `npm install`.
3. Run `npm run dev`.

Without Firebase environment variables, the application uses browser-local demo data.

## Enable production (Firebase)

Production mode is on when every required `VITE_FIREBASE_*` variable is present. The Auth page then hides the “Demo mode” banner, and data is stored in Firebase instead of the browser.

1. In [Firebase Console](https://console.firebase.google.com/), open the project (or create one).
2. **Authentication → Sign-in method** → enable **Email/Password**.
3. **Firestore Database** → Create database (start in production mode).
4. Copy the web app config into `.env` (and into your host’s env vars). Required keys:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

5. Deploy rules so each signed-in user can only access their own records:

```
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

You can also paste `firestore.rules` in the Console under Firestore → Rules.

6. Build with those env vars available (Vite inlines them at build time):

```
npm run build
```

Restart `npm run dev` after changing `.env`. If any required variable is missing, the app stays in demo mode.

Business logos are stored only in the browser that selected them; they are never uploaded to Firebase. They will not follow the user to another browser or device.
