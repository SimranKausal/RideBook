import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const registerFCMToken = async (customUserId = null) => {
  try {
    // 1. Request notification permissions from the OS
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      // 2. Fetch the unique device token from Firebase
      const fcmToken = await messaging().getToken();
      console.log('🔥 [FCM] Fetched device token:', fcmToken);

      // 3. Find the logged-in user ID
      const userId = customUserId || await AsyncStorage.getItem('userId');
      if (userId && fcmToken) {
        // 4. Save token to MongoDB
        await axios.post('http://4.240.25.27:5000/api/auth/update-fcm-token', {
          userId,
          fcmToken
        });
        console.log('💾 [FCM] Token synced to backend successfully');
      }
    }
  } catch (error) {
    console.log('❌ [FCM Registration Error]:', error.message);
  }
};
