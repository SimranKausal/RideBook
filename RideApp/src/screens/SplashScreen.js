import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';

export default function SplashScreen({ navigation }) {
  // Animation value for fading in the logo
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // 1. Run the logo fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // 2. Simulate an authentication token check (e.g., from AsyncStorage / SecureStore)
    const checkAuthStatus = async () => {
      // Temporary timeout to simulate loading app assets/checking tokens
      setTimeout(() => {
        
        // --- NEXT STEP LOGIC ---
        // const token = await AsyncStorage.getItem('userToken');
        // if (token) { navigation.replace('Home'); } else { navigation.replace('Auth'); }
        
        // For now, redirect straight to your working Auth screen
        navigation.replace('Auth');
      }, 3000); // Displays splash for 3 seconds
    };

    checkAuthStatus();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        {/* You can replace this Text with an <Image source={require('../assets/logo.png')} /> later */}
        <Text style={styles.logoText}>VELO</Text>
        <Text style={styles.tagline}>Your Ride, Simplified.</Text>
      </Animated.View>

      {/* Loading Spinner at the bottom */}
      <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Premium dark theme background for Velo
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 10,
    fontWeight: '400',
  },
  spinner: {
    position: 'absolute',
    bottom: 60,
  },
});