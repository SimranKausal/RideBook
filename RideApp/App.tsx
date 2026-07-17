import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import RootNavigator from "./src/Navigation/Root";
import { registerFCMToken } from './src/utils/fcm';

export default function App() {

  // Run when app starts
  useEffect(() => {
    registerFCMToken();
  }, []);

  return (
    <View style = {{flex:1}}>
      {/* <Router /> */}
      <RootNavigator />
    </View>
  );
}