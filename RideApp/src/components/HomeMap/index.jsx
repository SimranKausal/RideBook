import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import MapView from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

const HomeMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const requestAndroidPermissionAndGetLocation = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Velo needs access to your location to set your pickup point.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          loadFallback();
        }
      } else {
        // iOS handles permission checks at plist configuration level
        getCurrentLocation();
      }
    } catch (err) {
      console.warn(err);
      loadFallback();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });
        setLoading(false);
      },
      (error) => {
        console.log("❌ [HomeMap GPS Error] Could not fetch coordinates:", error.message);
        loadFallback();
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
  };

  const loadFallback = () => {
    setUserLocation({
      latitude: 28.6139,
      longitude: 77.2090,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
    setLoading(false);
  };

  useEffect(() => {
    requestAndroidPermissionAndGetLocation();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={userLocation}
        showsUserLocation={true} // Enables native pulsing blue location marker dot
        followsUserLocation={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#bec7ff",
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
});

export default HomeMap;