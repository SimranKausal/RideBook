const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
let firebaseAdmin = null;

function loadServiceAccount() {
  // 1. Render / production: JSON stored in an environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (account.private_key) {
      account.private_key = account.private_key.replace(/\\n/g, '\n');
    }
    return account;
  }
  // 2. Local development: JSON file next to this script
  if (fs.existsSync(serviceAccountPath)) {
    return require(serviceAccountPath);
  }
  return null;
}

try {
  const serviceAccount = loadServiceAccount();
  if (serviceAccount) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    firebaseAdmin = admin;
    console.log('🔥 [Firebase] Admin SDK initialized successfully');
  } else {
    console.log('⚠️ [Firebase] No credentials found. Push notifications disabled.');
  }
} catch (error) {
  console.log('❌ [Firebase] Failed to initialize Admin SDK:', error.message);
}

module.exports = firebaseAdmin;