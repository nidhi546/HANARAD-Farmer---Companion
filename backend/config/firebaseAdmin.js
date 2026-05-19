/**
 * Firebase Admin SDK — Central Configuration
 * Project: caryanams-ea9c1
 *
 * Uses service account credentials from .env
 * All Firebase Admin operations go through this file.
 */

require('dotenv').config();
const admin = require('firebase-admin');

// ── Initialise once (safe to import multiple times) ───────────────────────────
if (!admin.apps.length) {
  const serviceAccount = {
    type:                        process.env.FIREBASE_TYPE,
    project_id:                  process.env.FIREBASE_PROJECT_ID,
    private_key_id:              process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key:                 process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email:                process.env.FIREBASE_CLIENT_EMAIL,
    client_id:                   process.env.FIREBASE_CLIENT_ID,
    auth_uri:                    process.env.FIREBASE_AUTH_URI,
    token_uri:                   process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_CERT_URL,
    client_x509_cert_url:        process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain:             'googleapis.com',
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log(`✅ Firebase Admin initialised — project: ${process.env.FIREBASE_PROJECT_ID}`);
}

// ── Exports ───────────────────────────────────────────────────────────────────
const messaging  = admin.messaging();
const firestore  = admin.firestore();
const auth       = admin.auth();

module.exports = { admin, messaging, firestore, auth };
