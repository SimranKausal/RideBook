const User = require('../models/user');
const firebaseAdmin = require('../../config/firebase');

const sendPushNotification = async (userId, title, body) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`⚠️ [FCM] User not found: ${userId}`);
      return;
    }

    const token = user.fcmToken;
    if (!token) {
      console.log(`⚠️ [FCM] No registered FCM token found for passenger: ${user.fullname || userId}`);
      return;
    }

    if (firebaseAdmin) {
      const message = {
        notification: {
          title,
          body
        },
        token: token
      };

      const response = await firebaseAdmin.messaging().send(message);
      console.log(`🔥 [FCM] Push notification sent successfully to User ${userId}`);
    } else {
      console.log(`📱 [FCM Mock] Push alert to User ${userId}: "${title}" - "${body}" (FCM not active)`);
    }
  } catch (error) {
    console.log("❌ [FCM Error] Failed to send push notification:", error.message);
  }
};

module.exports = { sendPushNotification };
