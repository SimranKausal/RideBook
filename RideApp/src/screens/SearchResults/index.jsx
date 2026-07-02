import React, { useState, useEffect } from 'react'; 
import { View, Dimensions, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import UberTypes from "../../components/UberTypes";
import RouteMap from "../../components/RouteMap";
import { useRoute } from "@react-navigation/native";
import { io } from 'socket.io-client'; // 📡 Import Socket client

// 🇮🇳 Smart baseline local coordinates to prevent structural layout calculation freezes
const DEFAULT_LAT = 28.6284;
const DEFAULT_LNG = 77.3769;

const SearchResults = () => {
  const route = useRoute();
  const { originPlace, destinationPlace } = route.params || {};

  const [isDriving, setIsDriving] = useState(false);
  
  // 🔄 Real-time booking states
  const [currentRideId, setCurrentRideId] = useState(null);
  const [rideStatus, setRideStatus] = useState('IDLE'); // IDLE, SEARCHING, ACCEPTED
  const [matchedDriver, setMatchedDriver] = useState(null);

  // ✨ Rectified: Coordinates fall back instantly to real numbers so placeholder states don't freeze
  const pickupLocation = {
    latitude: originPlace?.details?.geometry?.location?.lat || originPlace?.latitude || DEFAULT_LAT,
    longitude: originPlace?.details?.geometry?.location?.lng || originPlace?.longitude || DEFAULT_LNG,
    address: originPlace?.data?.description || "Current Location"
  };

  const dropoffLocation = {
    latitude: destinationPlace?.details?.geometry?.location?.lat || destinationPlace?.latitude || DEFAULT_LAT,
    longitude: destinationPlace?.details?.geometry?.location?.lng || destinationPlace?.longitude || DEFAULT_LNG,
    address: destinationPlace?.data?.description || "Enter Destination"
  };

  // 📡 Socket.io Listener Hook
  useEffect(() => {
    const socket = io('http://4.240.25.27:5000'); // Connects to your Node backend wrapper

    if (currentRideId) {
      console.log(`📡 [Socket] Listening for updates on Ride: ${currentRideId}`);
      
      // Listen for the specific socket broadcast channel we built in rides.js
      socket.on(`ride-update-${currentRideId}`, (data) => {
        if (data.status === 'ACCEPTED') {
          setRideStatus('ACCEPTED');
          setMatchedDriver(data.driver);
          setIsDriving(true); // Automatically starts your map animations!
        }
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [currentRideId]);

  // 𚖖 Mock Action: Simulates the driver hitting the "Accept Request" button
  const simulateDriverAcceptance = async () => {
    if (!currentRideId) return;

    try {
      const response = await fetch('http://4.240.25.27:5000/api/rides/accept-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: currentRideId,
          driverId: "6a34d1819c65dd2c4eb29403" // Amit Kumar's MongoDB Object ID
        })
      });

      // 🔍 Read response as plain text first to safely prevent JSON parsing crashes
      const responseText = await response.text();

      try {
        const data = JSON.parse(responseText);
        console.log("🛠️ Simulation Trigger Response:", data.message);
      } catch (parseError) {
        console.log("❌ Server returned HTML instead of JSON. The backend URL path configuration might be off!");
        console.log("📄 HTML Snippet from Server:", responseText.substring(0, 200));
        Alert.alert("Route Error", "Backend returned HTML. Double-check your URL mapping or endpoints in server.js!");
      }

    } catch (error) {
      console.error("❌ Simulation failed:", error.message);
    }
  };

  // 📝 Capture the Ride ID when it's created inside UberTypes component
  const handleRideCreated = (rideId) => {
    setCurrentRideId(rideId);
    setRideStatus('SEARCHING');
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'space-between' }}>
      <View style={{ height: Dimensions.get('window').height - 400 }}>
        <RouteMap 
          origin={originPlace} 
          destination={destinationPlace} 
          isDriving={isDriving} 
          setIsDriving={setIsDriving}
        />

        {/* 🚨 LIVE MANAGER DEMO PANEL (Floating Overlay) */}
        {rideStatus === 'SEARCHING' && (
          <View style={styles.demoPanel}>
            <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.demoText}>Searching for Drivers...</Text>
            <TouchableOpacity 
              style={styles.demoButton} 
              onPress={simulateDriverAcceptance}
            >
              <Text style={styles.demoButtonText}>Simulate Driver Accept 𚖖</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ✨ REAL-TIME MATCHED DRIVER PANEL */}
        {rideStatus === 'ACCEPTED' && matchedDriver && (
          <View style={[styles.demoPanel, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
            <Text style={[styles.demoText, { fontWeight: 'bold', color: '#1B5E20' }]}>
              ✨ Driver Found: {matchedDriver.fullname} ({matchedDriver.vehicle?.carModel || 'Vehicle'})
            </Text>
            <Text style={{ fontSize: 11, color: '#4CAF50' }}>Plate: {matchedDriver.vehicle?.plateNumber || 'N/A'}</Text>
          </View>
        )}
      </View>

      <View style={{ height: 400 }}>
        <UberTypes 
          pickupLocation={pickupLocation} 
          dropoffLocation={dropoffLocation} 
          triggerMovement={() => setIsDriving(true)}
          onRideCreated={handleRideCreated} // ◄── Pass function down to get the ID
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  demoPanel: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  demoText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  demoButton: {
    backgroundColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  }
});

export default SearchResults;