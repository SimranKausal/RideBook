import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;      // Fade in the logo
  const scaleAnim = useRef(new Animated.Value(0.4)).current;    // Zoom in the logo
  const slideAnim = useRef(new Animated.Value(40)).current;     // Slide up the logo
  const taglineFade = useRef(new Animated.Value(0)).current;    // Delayed fade in for tagline
  const taglineSlide = useRef(new Animated.Value(15)).current;   // Slide up for tagline
  const spinnerFade = useRef(new Animated.Value(0)).current;    // Delayed fade in for loading spinner

  useEffect(() => {
    // 🎛️ Premium multi-stage animation sequence
    Animated.sequence([
      // Stage 1: Logo fades in, scales up, and slides up in parallel
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
      // Stage 2: Tagline and loading spinner fade in smoothly right after
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
        const savedUserId = await AsyncStorage.getItem('userId');
        setTimeout(() => {
          if (savedUserId) {
            console.log("👋 [Session Engine] Active session found. Auto-logging in Rider:", savedUserId);
            navigation.replace('MainApp');
          } else {
            navigation.replace('Auth');
          }
        }, 3500);
      } catch (err) {
        console.log("Error checking Rider session:", err.message);
        setTimeout(() => {
          navigation.replace('Auth');
        }, 3500);
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background radial-like light leak effect */}
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
        {/* Sleek, glowing brand logo icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>V</Text>
        </View>

        <Text style={styles.logoText}>VELO</Text>
      </Animated.View>

      <Animated.View style={[
        styles.taglineContainer, 
        { 
          opacity: taglineFade,
          transform: [{ translateY: taglineSlide }]
        }
      ]}>
        <Text style={styles.tagline}>Your Ride, Simplified.</Text>
      </Animated.View>

      {/* Animated Loading Spinner */}
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
    backgroundColor: 'rgba(59, 130, 246, 0.05)', // Extremely soft ambient blue glow
    top: '20%',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E293B', // Slate-800
    borderWidth: 2,
    borderColor: '#3B82F6', // Electric blue ring
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    // Native shadows for premium feel
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  iconText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#3B82F6', // Electric blue icon character
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-condensed',
  },
  logoText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 6,
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-CondensedBold' : 'sans-serif-medium',
  },
  taglineContainer: {
    marginTop: 15,
  },
  tagline: {
    fontSize: 15,
    color: '#94A3B8', // Slate-400
    fontWeight: '500',
    letterSpacing: 1.5,
  },
  spinnerContainer: {
    position: 'absolute',
    bottom: 80,
  },
});