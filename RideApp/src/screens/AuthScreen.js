import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import axios from 'axios'; 

// Using the 10.0.2.2 mapping so the Android Emulator routes to your computer's local port 5000
const API_BASE_URL = 'http://10.0.2.2:5000/api/auth'; 

export default function AuthScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null); 
  const [isOtpSent, setIsOtpSent] = useState(false);

  // 1. Send OTP Request to Express Backend
  const handleSendOTP = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter a valid phone number.');
      return;
    }

    // Ensures E.164 format requirement is met for Firebase
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    try {
      console.log(`Sending OTP to formatted number: ${formattedPhone}`);
      const response = await axios.post(`${API_BASE_URL}/send-otp`, { phoneNumber: formattedPhone });
      
      if (response.data.success) {
        setSessionInfo(response.data.sessionInfo);
        setIsOtpSent(true);
        Alert.alert('Success', 'OTP sent to your phone.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to send OTP.';
      Alert.alert('Error', errorMsg);
    }
  };

  // 2. Verify OTP Request to Express Backend
  const handleVerifyOTP = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the 6-digit verification code.');
      return;
    }

    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
        sessionInfo,
        code,
        phoneNumber: formattedPhone
      });

      // ✅ SUCCESS HANDLER WITH CONDITIONAL ROUTING
      if (response.data.success) {
        Alert.alert('Logged In Successfully!', 'Welcome to Velo.');
        
        // Destructure the values returned from your updated backend route
        const { userId, isProfileComplete } = response.data; 
        
        if (navigation && typeof navigation.replace === 'function') {
          if (isProfileComplete) {
            // ✅ RETURNING USER: Profile is already filled out, bypass onboarding form
            navigation.replace('MainApp'); 
          } else {
            // 🆕 NEW USER: Forward them to complete their name and email records
            navigation.replace('CompleteProfile', { userId: userId }); 
          }
        } else {
          console.warn("Navigation prop or replace method is missing!");
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'The OTP entered is incorrect.';
      Alert.alert('Verification Failed', errorMsg);
    }
  };

  return (
    <View style={styles.container}>
      {!isOtpSent ? (
        <>
          <Text style={styles.label}>Enter Phone Number (with Country Code):</Text>
          <TextInput 
            value={phoneNumber} 
            onChangeText={setPhoneNumber} 
            placeholder="+919876543210"
            keyboardType="phone-pad"
            style={styles.input}
          />
          <Button title="Send OTP" onPress={handleSendOTP} />
        </>
      ) : (
        <>
          <Text style={styles.label}>Enter the 6-Digit OTP:</Text>
          <TextInput 
            value={code} 
            onChangeText={setCode} 
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
          />
          <Button title="Verify & Login" onPress={handleVerifyOTP} />
          <Text 
            style={styles.resendText} 
            onPress={() => setIsOtpSent(false)}
          >
            Change Phone Number
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    justifyContent: 'center', 
    flex: 1,
    backgroundColor: '#fff'
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600'
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 20, 
    padding: 10,
    fontSize: 16
  },
  resendText: {
    textAlign: 'center',
    color: '#007AFF',
    marginTop: 15,
    textDecorationLine: 'underline'
  }
});