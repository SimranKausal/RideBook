import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Driver screens
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import VehicleInfoScreen from '../screens/VehicleInfoScreen';
import DashboardScreen from '../screens/DashboardScreen';

const Stack = createNativeStackNavigator();

const DriverNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        {/* Boot Splash Loading screen */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        
        {/* Authentication screen */}
        <Stack.Screen name="Auth" component={AuthScreen} />

        {/* Vehicle Details screen (Required if new driver profile) */}
        <Stack.Screen name="VehicleInfo" component={VehicleInfoScreen} />
        
        {/* Main Online Dashboard & Maps screen */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default DriverNavigator;
