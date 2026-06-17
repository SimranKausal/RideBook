import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import RootNavigator from "./src/Navigation/Root";

export default function App() {

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "This app needs access to your location",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("✅ Permission granted");

        Geolocation.getCurrentPosition(
          (position) => {
            console.log("📍 Location:", position);
          },
          (error) => {
            console.log("❌ Error:", error);
          }
        );

      } else {
        console.log("❌ Permission denied");
      }

    } catch (err) {
      console.warn(err);
    }
  };

  // Run when app starts
  useEffect(() => {

    if (Platform.OS === 'android') {
      requestLocationPermission();
    } else {

      Geolocation.getCurrentPosition(
        (position) => {
          console.log("📍 Location:", position);
        },
        (error) => {
          console.log("❌ Error:", error);
        }
      );

    }

  }, []);

  return (
    <View style = {{flex:1}}>
      {/* <Router /> */}
      <RootNavigator />
    </View>
  );
}