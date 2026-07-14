import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;      // Fade in logo
  const scaleAnim = useRef(new Animated.Value(0.4)).current;    // Zoom in logo
  const slideAnim = useRef(new Animated.Value(40)).current;     // Slide up logo
  const taglineFade = useRef(new Animated.Value(0)).current;    // Delayed fade in for tagline
  const taglineSlide = useRef(new Animated.Value(15)).current;   // Slide up for tagline
  const spinnerFade = useRef(new Animated.Value(0)).current;    // Delayed fade in for loading spinner

  useEffect(() => {
    // Premium animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3.5,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(taglineSlide, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(spinnerFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Check auth token and redirect after 3.5 seconds
    const checkAuthStatus = async () => {
      try {
        const savedDriverId = await AsyncStorage.getItem('driverId');
        setTimeout(() => {
          if (savedDriverId) {
            console.log("👋 [Session Engine] Active session found. Auto-logging in Driver:", savedDriverId);
            navigation.replace('Dashboard', { driverId: savedDriverId });
          } else {
            navigation.replace('Auth');
          }
        }, 3500);
      } catch (err) {
        console.log("Error checking Driver session:", err.message);
        setTimeout(() => {
          navigation.replace('Auth');
        }, 3500);
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.glowEffect} />

      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ]
          }
        ]}
      >
        {/* Glow Ring circle around letter V */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>V</Text>
        </View>

        <Text style={styles.logoText}>VELO</Text>
        <View style={styles.driverBadge}>
          <Text style={styles.driverBadgeText}>DRIVER</Text>
        </View>
      </Animated.View>

      <Animated.View style={[
        styles.taglineContainer, 
        { 
          opacity: taglineFade,
          transform: [{ translateY: taglineSlide }]
        }
      ]}>
        <Text style={styles.tagline}>Drive & Earn, Simplified.</Text>
      </Animated.View>

      <Animated.View style={[styles.spinnerContainer, { opacity: spinnerFade }]}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate-900 (ultra premium deep dark blue-grey)
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowEffect: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: 'rgba(59, 130, 246, 0.04)', // soft ambient glow
    top: '20%',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#3B82F6', // Electric blue ring
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  iconText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#3B82F6',
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-condensed',
  },
  logoText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-CondensedBold' : 'sans-serif-medium',
  },
  driverBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  driverBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  taglineContainer: {
    marginTop: 15,
  },
  tagline: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 1.5,
  },
  spinnerContainer: {
    position: 'absolute',
    bottom: 80,
  },
});
