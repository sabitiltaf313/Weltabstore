# WellTabs Store — Firebase starter

A simple single-page marketplace starter using Firebase Authentication and Cloud Firestore. It includes a storefront, email/password login and signup, seller product submission, admin product approval, basic order records, affiliate link records, and a simple admin role-request screen.

## Important limitations

- This is a starter, not a production-ready Daraz clone.
- It does **not** accept or verify payments. Orders are saved as `pending_payment` only.
- Affiliate links are created, but referral attribution, commission calculation, refunds, fraud checks, and payouts are not implemented.
- Do not send money to sellers until you have a verified payment provider and a trusted backend.
- Do not expose Firebase service-account keys or private secrets in the browser.
- Review and test Firestore rules before going live.

## Step 1 — Create Firebase app

1. Open https://console.firebase.google.com/ and select your Firebase project.
2. Go to Project settings → General → Your apps → Web app.
3. Copy the Firebase web config.
4. Open `index.html` and replace the six `PASTE_YOUR_...` values in `firebaseConfig`.
5. In Firebase Authentication → Sign-in method, enable **Email/Password**.
6. In Firestore Database, create a database.

## Step 2 — Install Firestore rules

1. Open Firebase Console → Firestore Database → Rules.
2. Replace the existing rules with the contents of `firestore.rules`.
3. Publish.

Rules intentionally allow only users with an approved `seller` role to create products and only `admin` users to approve products and change roles. New signups are buyers by default.

## Step 3 — Make your account admin (one-time manual setup)

1. Open the website and sign up with your own email.
2. In Firebase Console → Firestore Database → `users` collection, open the document whose ID matches your Firebase Authentication UID.
3. Change `role` from `buyer` to `admin` and save.
4. Sign out and sign back in.

Do not give anyone else the admin role. The admin role must only be assigned from the Firebase Console or a trusted server.

## Step 4 — Give seller/affiliate access

A user can select seller or affiliate when signing up, but they remain a buyer until approved. As admin, open My Dashboard → Admin panel → Load user requests, choose the correct role, and update it. If you need to bootstrap seller accounts before your own admin is set up, change the `role` field manually in the Firebase Console.

## Step 5 — Upload to GitHub

1. Create a repository named `welltabs-store` at https://github.com/new.
2. Upload `index.html`, `firestore.rules`, and `README.md` to the repository root.
3. Open `index.html` in GitHub and replace the Firebase config placeholders, then commit changes.
4. Go to repository Settings → Pages, choose Deploy from a branch → `main` → `/ (root)`, then Save.
5. Wait for GitHub Pages to publish your site.

Alternatively, connect the repository to Firebase Hosting or another static host.

## Firestore collections used

- `users`
- `products`
- `orders`
- `affiliateLinks`
- `sellerPayouts` (rules prepared; UI/backend still needs implementing)
- `affiliateCommissions` (rules prepared; backend still needs implementing)

## Notes

- The Firebase web config is designed to be public; security comes from Firestore Rules, not from hiding the web config.
- Never put a service-account private key in `index.html` or GitHub.
- For real payments, use a supported provider and a trusted backend/webhook to verify payment status. Never trust browser-side claims that payment succeeded.
