import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Connects to local Node server (re-routed in android simulator)
const API_BASE_URL = 'http://4.240.25.27:5000/api/auth';

export default function AuthScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [code, setCode] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Send OTP Request
  const handleSendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Missing Number', 'Please enter your phone number.');
      return;
    }

    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/send-otp`, { phoneNumber: formattedPhone });
      if (response.data.success) {
        setSessionInfo(response.data.sessionInfo);
        setIsOtpSent(true);
        Alert.alert('Success', 'Verification code sent to your mobile.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      Alert.alert('Authentication Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP Request
  const handleVerifyOTP = async () => {
    if (!code) {
      Alert.alert('Verification Error', 'Please type the 6-digit OTP code.');
      return;
    }

    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    setLoading(true);
    try {
      // Hits the driver-specific verification endpoint
      const response = await axios.post(`${API_BASE_URL}/driver/verify-otp`, {
        sessionInfo,
        code,
        phoneNumber: formattedPhone
      });

      if (response.data.success) {
        const { driverId, isProfileComplete } = response.data;
        
        // Save session locally
        await AsyncStorage.setItem('driverId', driverId);
        
        if (isProfileComplete) {
          // Returning Driver: Profile completed, go straight to Map Console
          navigation.replace('Dashboard', { driverId });
        } else {
          // New Driver: Go to Vehicle Details form
          navigation.replace('VehicleInfo', { driverId });
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Verification code is invalid.';
      Alert.alert('Incorrect OTP', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Branding header */}
        <View style={styles.header}>
          <Text style={styles.logo}>VELO</Text>
          <Text style={styles.subtitle}>DRIVER WORKSPACE</Text>
        </View>

        {!isOtpSent ? (
          <View style={styles.form}>
            <Text style={styles.label}>Enter Mobile Number</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={(text) => {
                // Keep +91 country code prefix locked
                if (!text.startsWith('+91')) {
                  setPhoneNumber('+91');
                } else {
                  setPhoneNumber(text);
                }
              }}
              placeholder="+91 98765 43210"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              style={styles.input}
            />
            
            <TouchableOpacity style={styles.button} onPress={handleSendOTP} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Get Verification Code</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Enter 6-Digit Code</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
            />

            <TouchableOpacity style={styles.button} onPress={handleVerifyOTP} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Verify & Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendBtn} onPress={() => setIsOtpSent(false)}>
              <Text style={styles.resendText}>Change Phone Number</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Premium Slate-900 dark theme
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6', // Blue Accent
    letterSpacing: 3,
    marginTop: 4,
  },
  form: {
    backgroundColor: '#1E293B', // Slate-800 Card
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  label: {
    color: '#94A3B8', // Slate-400
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1.5,
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3B82F6', // Electric blue active button
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendBtn: {
    marginTop: 16,
    alignSelf: 'center',
  },
  resendText: {
    color: '#94A3B8',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
