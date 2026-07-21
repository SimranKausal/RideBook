import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import axios from 'axios';

export const registerFCMToken = async (customUserId = null) => {
  try {
    // Request Android 13+ Notification Permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    try {
      await messaging().requestPermission();
    } catch (e) {}

    // 2. Fetch the unique device token from Firebase
    const fcmToken = await messaging().getToken();
    console.log('🔥 [FCM] Fetched device token:', fcmToken);

    // 3. Find the logged-in user ID (fallback to baseline passenger ID if not logged in)
    const storedUserId = await AsyncStorage.getItem('userId');
    const userId = customUserId || storedUserId || "6a28fac827c86bf2fdbcd628";
    
    if (userId && fcmToken) {
      // 4. Save token to MongoDB
      await axios.post('http://4.240.25.27:5000/api/auth/update-fcm-token', {
        userId,
        fcmToken
      });
      console.log('💾 [FCM] Token synced to backend successfully for User:', userId);
    }
  } catch (error) {
    console.log('❌ [FCM Registration Error]:', error.message);
  }
};

// 🔔 Listens for notifications while the Rider App is open on screen
export const setupForegroundNotificationListener = () => {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('🔔 [FCM Foreground Notification Received]:', remoteMessage);
    if (remoteMessage.notification) {
      Alert.alert(
        remoteMessage.notification.title || 'Velo Update 🔔',
        remoteMessage.notification.body || ''
      );
    }
  });
};
