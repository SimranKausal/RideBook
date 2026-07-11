import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import DriverNavigator from './src/Navigation/Root';

export default function App() {
  
  useEffect(() => {
    // Geolocation permission is now requested contextually when the Dashboard screen mounts
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <DriverNavigator />
    </View>
  );
}
