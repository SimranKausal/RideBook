import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://4.240.25.27:5000/api/auth';

export default function VehicleInfoScreen({ route, navigation }) {
  const { driverId } = route.params || {};

  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [carModel, setCarModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [color, setColor] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullname || !email || !carModel || !plateNumber || !color) {
      Alert.alert('Missing Info', 'Please fill out all the fields.');
      return;
    }

    setLoading(true);
    try {
      // Hits the driver profile completion route
      const response = await axios.put(`${API_BASE_URL}/driver/update-profile`, {
        driverId,
        fullname,
        email,
        vehicleDetails: {
          carModel,
          plateNumber,
          color
        }
      });

      if (response.data.success) {
        Alert.alert('Profile Configured!', 'Your driver profile is active.');
        navigation.replace('Dashboard', { driverId });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Server error updating profile details.';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Register Vehicle</Text>
          <Text style={styles.subtitle}>Fill in your driver details to start matching</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionHeader}>👤 Driver Details</Text>
          
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullname}
            onChangeText={setFullname}
            placeholder="John Doe"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="john@example.com"
            placeholderTextColor="#64748B"
            keyboardType="email-address"
          />

          <Text style={styles.sectionHeader}>🚖 Vehicle details</Text>

          <Text style={styles.label}>Car Model</Text>
          <TextInput
            style={styles.input}
            value={carModel}
            onChangeText={setCarModel}
            placeholder="Suzuki WagonR / Swift"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.label}>Registration Number (Plate)</Text>
          <TextInput
            style={styles.input}
            value={plateNumber}
            onChangeText={setPlateNumber}
            placeholder="DL 3C AY 4412"
            placeholderTextColor="#64748B"
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Car Color</Text>
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
            placeholder="White / Silver"
            placeholderTextColor="#64748B"
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Complete Registration</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionHeader: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  label: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1.5,
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
