import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView, Dimensions, Alert, TouchableOpacity, Modal } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { io } from 'socket.io-client';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = 'http://4.240.25.27:5000/api';

export default function DashboardScreen({ route }) {
  const { driverId } = route.params || { driverId: "6a34d1819c65dd2c4eb29403" }; // Amit Kumar dummy backup ID

  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
  });

  // 🔔 Ride Request States
  const [incomingRide, setIncomingRide] = useState(null);
  const [countdown, setCountdown] = useState(15);
  const [activeRide, setActiveRide] = useState(null); // Tracks currently accepted active ride

  const locationInterval = useRef(null);
  const countdownInterval = useRef(null);
  const socketRef = useRef(null);

  // 1. WebSocket connection setup
  useEffect(() => {
    socketRef.current = io('http://4.240.25.27:5000');

    socketRef.current.on('connect', () => {
      console.log('📡 [Driver Socket] Connected to system gateway.');
    });

    // 📡 Socket Listener: Incoming Ride Request
    socketRef.current.on('incoming-ride-request', (data) => {
      // Only show request popup if driver is online and not currently on another ride
      if (isOnline && !activeRide && !incomingRide) {
        console.log("🚖 [Socket Event] Incoming ride request received:", data.rideId);
        setIncomingRide(data);
        setCountdown(15);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      clearInterval(locationInterval.current);
      clearInterval(countdownInterval.current);
    };
  }, [isOnline, activeRide, incomingRide]);

  // ⏰ Countdown Timer Effect
  useEffect(() => {
    if (incomingRide && countdown > 0) {
      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Auto-reject on timeout
      handleRejectRide();
    }

    return () => clearInterval(countdownInterval.current);
  }, [incomingRide, countdown]);

  // 2. Location streaming trigger
  useEffect(() => {
    if (isOnline) {
      if (socketRef.current) {
        socketRef.current.emit('join-driver-stream');
      }
      startLocationStreaming();
    } else {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
      }
      updateAvailabilityStatus(false);
    }

    return () => clearInterval(locationInterval.current);
  }, [isOnline]);

  const startLocationStreaming = () => {
    fetchAndUploadLocation();
    locationInterval.current = setInterval(() => {
      fetchAndUploadLocation();
    }, 10000);
  };

  const fetchAndUploadLocation = () => {
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });

        try {
          await axios.put(`${API_BASE_URL}/auth/driver/update-location`, {
            driverId,
            latitude,
            longitude,
            isAvailable: !activeRide // only available if not currently on a trip
          });
        } catch (error) {
          console.log('❌ [GPS Stream] Failed to update location:', error.message);
        }
      },
      (error) => {
        console.log('❌ [GPS Error] Could not fetch current coordinates:', error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const updateAvailabilityStatus = async (status) => {
    try {
      await axios.put(`${API_BASE_URL}/auth/driver/update-location`, {
        driverId,
        isAvailable: status
      });
    } catch (error) {
      console.log('❌ Failed to update availability status:', error.message);
    }
  };

  // ✅ Accept Ride API Caller
  const handleAcceptRide = async () => {
    if (!incomingRide) return;

    clearInterval(countdownInterval.current);
    try {
      const response = await axios.post(`${API_BASE_URL}/rides/accept-ride`, {
        rideId: incomingRide.rideId,
        driverId
      });

      if (response.data.success) {
        Alert.alert('Ride Confirmed!', 'Proceed to pickup location.');
        setActiveRide(incomingRide);
        setIncomingRide(null);
      }
    } catch (error) {
      Alert.alert('Booking Error', 'This ride is no longer available.');
      setIncomingRide(null);
    }
  };

  const handleRejectRide = () => {
    clearInterval(countdownInterval.current);
    setIncomingRide(null);
  };

  const handleCompleteRide = async () => {
    if (!activeRide) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/rides/complete-ride`, {
        rideId: activeRide.rideId,
        driverId
      });

      if (response.data.success) {
        Alert.alert('Trip Completed! 🎉', 'You are now ready for new rides.');
        setActiveRide(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete the trip on the server.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Map View */}
      <MapView
        style={styles.map}
        region={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.012,
        }}
      >
        <Marker
          coordinate={currentLocation}
          title="My Location"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.driverMarkerOuter}>
            <View style={styles.driverMarkerInner} />
          </View>
        </Marker>
      </MapView>

      {/* 🟢 OFFLINE/ONLINE panel overlay */}
      {!activeRide && (
        <View style={styles.statusPanel}>
          <View style={styles.panelRow}>
            <View>
              <Text style={styles.statusHeader}>
                {isOnline ? '🟢 ONLINE & ACTIVE' : '🔴 OFFLINE'}
              </Text>
              <Text style={styles.statusSubtext}>
                {isOnline ? 'Streaming GPS and waiting for rides...' : 'Go online to start receiving rides'}
              </Text>
            </View>

            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#334155"
            />
          </View>
        </View>
      )}

      {/* 🚖 ACTIVE TRIP DRAWER PANEL */}
      {activeRide && (
        <View style={styles.activeRidePanel}>
          <Text style={styles.activeRideHeader}>Active Trip Info</Text>
          
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>📍 PICKUP</Text>
            <Text style={styles.addressText}>{activeRide.pickup?.address || 'Pickup address'}</Text>
            
            <View style={styles.addressLine} />
            
            <Text style={styles.addressLabel}>🏁 DROPOFF</Text>
            <Text style={styles.addressText}>{activeRide.dropoff?.address || 'Dropoff address'}</Text>
          </View>

          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Requested Class: <Text style={{fontWeight:'700'}}>{activeRide.vehicleType}</Text></Text>
            <Text style={styles.fareValue}>₹{activeRide.fare}</Text>
          </View>

          <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteRide}>
            <Text style={styles.completeBtnText}>Complete Trip & Collect Cash</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 🔔 INCOMING RIDE REQUEST MODAL */}
      <Modal
        visible={incomingRide !== null}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            
            {/* Countdown Badge */}
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>

            <Text style={styles.newRequestTitle}>New Ride Offer!</Text>
            
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>📍 PICKUP FROM</Text>
              <Text style={styles.modalAddress}>{incomingRide?.pickup?.address}</Text>

              <Text style={styles.addressLabel}>🏁 GOING TO</Text>
              <Text style={styles.modalAddress}>{incomingRide?.dropoff?.address}</Text>
            </View>

            <View style={styles.modalDetailsRow}>
              <View>
                <Text style={styles.detailTitle}>FARE</Text>
                <Text style={styles.detailVal}>₹{incomingRide?.fare}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.detailTitle}>VEHICLE CLASS</Text>
                <Text style={styles.detailVal}>{incomingRide?.vehicleType}</Text>
              </View>
            </View>

            {/* Buttons Row */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.declineBtn} onPress={handleRejectRide}>
                <Text style={styles.declineBtnText}>Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptRide}>
                <Text style={styles.acceptBtnText}>Accept Request</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  map: {
    width: width,
    height: height,
  },
  driverMarkerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statusPanel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  panelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    width: width * 0.55,
  },
  
  // 🚖 Active Ride Styles
  activeRidePanel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3B82F6', // Blue Border when Active
    elevation: 10,
  },
  activeRideHeader: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  addressContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  addressLabel: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  addressText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  addressLine: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fareLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  fareValue: {
    color: '#10B981',
    fontSize: 22,
    fontWeight: '900',
  },
  completeBtn: {
    backgroundColor: '#10B981', // green button
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '850',
  },

  // 🔔 Incoming Request Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Dim overlay background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#3B82F6', // Glowing blue border
    alignItems: 'center',
    elevation: 20,
  },
  countdownBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  newRequestTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  modalAddress: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
  },
  modalDetailsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  detailVal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
