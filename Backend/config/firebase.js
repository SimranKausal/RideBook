const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, './firebase-service-account.json');
let firebaseAdmin = null;

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = require(serviceAccountPath);
    const cert = admin.cert || (admin.credential && admin.credential.cert);
    admin.initializeApp({
      credential: cert(serviceAccount)
    });
    firebaseAdmin = admin;
    console.log("🔥 [Firebase] Admin SDK initialized successfully");
  } catch (error) {
    console.log("❌ [Firebase] Failed to initialize Admin SDK:", error.message);
  }
} else {
  console.log("⚠️ [Firebase] firebase-service-account.json not found in config. Push notifications will be mocked.");
}

module.exports = firebaseAdmin;