import React from 'react';
import { NavigationContainer, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

// Import all your screen configurations
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import HomeNavigator from "./Home.js";
import CompleteProfileScreen from '../screens/CompleteProfileScreen';
import ServicesScreen from '../screens/ServicesScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AccountScreen from '../screens/AccountScreen';

// Initialize both Navigators
const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// The Main Application Bottom Tab Navigator (Only accessible after logging in)
const AppTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0F172A',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        }
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeNavigator} 
        options={{
          tabBarLabel: 'Home',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            height: 62,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>🏠</Text>
          )
        }}
      />
      <Tab.Screen 
        name="ServicesTab" 
        component={ServicesScreen} 
        options={{
          tabBarLabel: 'Services',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>🎛️</Text>
          )
        }}
      />
      <Tab.Screen 
        name="ActivityTab" 
        component={HistoryScreen} 
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>📋</Text>
          )
        }}
      />
      <Tab.Screen 
        name="AccountTab" 
        component={AccountScreen} 
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>👤</Text>
          )
        }}
      />
    </Tab.Navigator>
  );
};

// The Absolute Root Component
const RootNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        {/* Gateway Layer 1: App Boot Loading */}
        <RootStack.Screen name="Splash" component={SplashScreen} />
        
        {/* Gateway Layer 2: Phone Authentication */}
        <RootStack.Screen name="Auth" component={AuthScreen} />

        {/* PROFILE GATEWAY */}
        <RootStack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        
        {/* Core Application Layer: Bottom Tabs */}
        <RootStack.Screen name="MainApp" component={AppTabNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;