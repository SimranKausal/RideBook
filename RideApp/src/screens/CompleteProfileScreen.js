import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.2.2:5000/api/auth'; 

export default function CompleteProfileScreen({ route, navigation }) {
  // Grab the userId passed from the AuthScreen after a successful login
  const { userId } = route.params || {}; 
  
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProfileSubmit = async () => {
    // 1. Basic Form Validation
    if (!fullname.trim() || !email.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    // Simple Email Regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setLoading(false);
    try {
      setLoading(true);
      
      // 2. Make the PUT request to update MongoDB profile records
      const response = await axios.put(`${API_BASE_URL}/update-profile`, {
        userId,
        fullname: fullname.trim(),
        email: email.trim().toLowerCase()
      });

      if (response.data.success) {
        Alert.alert('Welcome!', 'Your profile has been set up successfully.');
        
        // Save session locally
        await AsyncStorage.setItem('userId', userId);
        
        // ✅ Close out the onboarding system and mount your Map + Drawer workspace
        navigation.replace('MainApp');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update profile details.';
      Alert.alert('Submission Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Create Your Profile</Text>
        <Text style={styles.subtitle}>Just a few details to get you moving with Velo.</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          placeholderTextColor="#666"
          value={fullname}
          onChangeText={setFullname}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="johndoe@example.com"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleProfileSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Get Started</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Dark theme matching your premium Splash layout
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  button: {
    backgroundColor: '#FFFFFF', // Clean high-contrast white button
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    height: 56,
  },
  buttonText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: 'bold',
  },
});