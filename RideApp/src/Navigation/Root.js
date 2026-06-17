import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from "@react-navigation/drawer";
import { View, Text } from 'react-native';

// Import all your screen configurations
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import HomeNavigator from "./Home.js";
import CompleteProfileScreen from '../screens/CompleteProfileScreen'; //
import CustomDrawer from "./CustomDrawer.js";

// Initialize both Navigators
const RootStack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// 1. Your reusable Dummy Screen component
const DummyScreen = (props) => {
  return (
    <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
      <Text>{props.name}</Text>
    </View>
  );
};

// 2. The Main Application Drawer (Only accessible after logging in)
const AppDrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        swipeEdgeWidth: 100,
      }}
    >
      {/* Your working Map Stack sits right here as the primary screen */}
      <Drawer.Screen name="Home" component={HomeNavigator} />

      <Drawer.Screen name="Your Trips">
        {() => <DummyScreen name="Your Trips" />}
      </Drawer.Screen>

      <Drawer.Screen name="Help">
        {() => <DummyScreen name="Help" />}
      </Drawer.Screen>

      <Drawer.Screen name="Wallet">
        {() => <DummyScreen name="Wallet" />}
      </Drawer.Screen>

      <Drawer.Screen name="Settings">
        {() => <DummyScreen name="Settings" />}
      </Drawer.Screen>
    </Drawer.Navigator>
  );
};

// 3. The Absolute Root Component
const RootNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        {/* Gateway Layer 1: App Boot Loading */}
        <RootStack.Screen name="Splash" component={SplashScreen} />
        
        {/* Gateway Layer 2: Phone Authentication */}
        <RootStack.Screen name="Auth" component={AuthScreen} />

        {/* ✅ 2. PROFILE GATEWAY: Added right after Auth, but before entering the main app drawer */}
        <RootStack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        
        {/* Core Application Layer: Side Menu & Maps */}
        <RootStack.Screen name="MainApp" component={AppDrawerNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;