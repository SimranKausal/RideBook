import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import DriverNavigator from './src/Navigation/Root';

export default function App() {
  
  // Request location permission (Critical for driver updates)
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Velo Driver Location Permission",
            message: "Velo Driver needs access to your location to match you with nearby riders.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("✅ Location permission granted for Driver");
        } else {
          console.log("❌ Location permission denied for Driver");
        }
      } else {
        Geolocation.requestAuthorization();
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <DriverNavigator />
    </View>
  );
}
