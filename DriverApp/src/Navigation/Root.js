import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Import Driver screens
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import VehicleInfoScreen from '../screens/VehicleInfoScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DriverServicesScreen from '../screens/DriverServicesScreen';
import DriverHistoryScreen from '../screens/DriverHistoryScreen';
import DriverAccountScreen from '../screens/DriverAccountScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// The Main Driver Application Bottom Tab Navigator
const AppTabNavigator = ({ route }) => {
  const { driverId } = route.params || { driverId: "6a34d1819c65dd2c4eb29403" };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0F172A',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        }
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>🏠</Text>
          )
        }}
      >
        {() => <DashboardScreen route={{ params: { driverId } }} />}
      </Tab.Screen>
      <Tab.Screen 
        name="ServicesTab" 
        component={DriverServicesScreen} 
        options={{
          tabBarLabel: 'Services',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>🎛️</Text>
          )
        }}
      />
      <Tab.Screen 
        name="ActivityTab" 
        component={DriverHistoryScreen} 
        options={{
          tabBarLabel: 'Activity',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 18, color }}>📋</Text>
          )
        }}
      />
      <Tab.Screen 
        name="AccountTab" 
        component={DriverAccountScreen} 
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
        
        {/* Main Application Bottom Tabs */}
        <Stack.Screen name="Dashboard" component={AppTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default DriverNavigator;
