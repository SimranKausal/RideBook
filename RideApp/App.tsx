import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import RootNavigator from "./src/Navigation/Root";

export default function App() {

  // Run when app starts
  useEffect(() => {
    // Permission and geolocation is now requested contextually on Map mount
  }, []);

  return (
    <View style = {{flex:1}}>
      {/* <Router /> */}
      <RootNavigator />
    </View>
  );
}