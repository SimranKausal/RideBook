import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView, Dimensions, Alert, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
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
  const [startOtpInput, setStartOtpInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historyTrips, setHistoryTrips] = useState([]);

  const locationInterval = useRef(null);
  const countdownInterval = useRef(null);
  const socketRef = useRef(null);

  const isOnlineRef = useRef(isOnline);
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // 1. WebSocket connection setup
  useEffect(() => {
    socketRef.current = io('http://4.240.25.27:5000');

    socketRef.current.on('connect', () => {
      console.log('📡 [Driver Socket] Connected to system gateway.');
      if (isOnlineRef.current) {
        socketRef.current.emit('join-driver-stream');
      }
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

    if (activeRide) {
      socketRef.current.emit('join-ride-room', { rideId: activeRide.rideId });
      console.log(`📡 [Socket] Joined private room: ride-room-${activeRide.rideId}`);

      socketRef.current.on(`ride-update-${activeRide.rideId}`, (data) => {
        if (data.status === 'CANCELLED') {
          Alert.alert('Ride Cancelled ❌', 'The passenger has cancelled this ride.');
          setActiveRide(null);
          setStartOtpInput('');
        }
      });

      socketRef.current.on(`new-message-${activeRide.rideId}`, (data) => {
        console.log(`💬 [Socket Chat] Incoming message: ${data.text}`);
        Alert.alert('New Message 💬', `Passenger: "${data.text}"`);
      });
    }

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
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
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

  // Approximates street turns by inserting 90-degree elbow points
  const generateRoadPath = (start, end) => {
    if (!start || !end) return [];
    return [
      { latitude: start.latitude, longitude: start.longitude },
      { latitude: start.latitude, longitude: end.longitude },
      { latitude: end.latitude, longitude: end.longitude }
    ];
  };

  // Calculates Haversine distance and travel time (ETA) to passenger
  const calculateDistanceAndEta = () => {
    if (!currentLocation || !activeRide || !activeRide.pickup) return null;
    
    const lat1 = currentLocation.latitude;
    const lon1 = currentLocation.longitude;
    const lat2 = activeRide.pickup.latitude;
    const lon2 = activeRide.pickup.longitude;
    
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; 
    const eta = Math.max(1, Math.round((distance / 30) * 60)); // 30 km/h speed assumption
    
    return {
      distance: distance.toFixed(1),
      eta
    };
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
        // Set the active ride status specifically to 'ACCEPTED'
        const acceptedRide = { ...incomingRide, status: 'ACCEPTED' };
        setActiveRide(acceptedRide);
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

  const handleStartRide = async () => {
    if (!activeRide || !startOtpInput) {
      Alert.alert('Error', 'Please enter the 4-digit OTP from the passenger.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/rides/start-ride`, {
        rideId: activeRide.rideId,
        otp: startOtpInput
      });

      if (response.data.success) {
        Alert.alert('Trip Started! 🚗', 'Passenger is on board. Drive safely.');
        setActiveRide((prev) => ({ ...prev, status: 'ON_TRIP' }));
        setStartOtpInput('');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Invalid OTP. Please check passenger screen.';
      Alert.alert('Verification Failed', errorMsg);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rides/trips/history/${driverId}`);
      if (response.data.success) {
        setHistoryTrips(response.data.trips);
      }
    } catch (error) {
      console.log('Failed to fetch history:', error.message);
    }
  };

  const handleOpenHistory = () => {
    fetchHistory();
    setShowHistory(true);
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
        setStartOtpInput('');
        fetchHistory(); // refresh history database
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete the trip on the server.');
    }
  };

  const handleCancelRide = async () => {
    if (!activeRide) return;

    Alert.alert(
      'Cancel Ride ❌',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.post(`${API_BASE_URL}/rides/cancel-ride`, {
                rideId: activeRide.rideId,
                canceller: 'driver'
              });
              if (response.data.success) {
                Alert.alert('Cancelled', 'Ride has been cancelled.');
                setActiveRide(null);
                setStartOtpInput('');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel the ride.');
            }
          }
        }
      ]
    );
  };

  const sendQuickMessage = (text) => {
    if (socketRef.current && activeRide) {
      socketRef.current.emit('send-message', {
        rideId: activeRide.rideId,
        text,
        senderId: driverId
      });
      Alert.alert('Sent 💬', `Message sent: "${text}"`);
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
        {/* Driver Current Location Marker */}
        <Marker
          coordinate={currentLocation}
          title="My Location"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.driverMarkerOuter}>
            <View style={styles.driverMarkerInner} />
          </View>
        </Marker>

        {/* 🗺️ Active Trip Route & Pins */}
        {activeRide && activeRide.pickup && activeRide.dropoff && (
          <>
            {/* Passenger Pickup Pin (Green) */}
            <Marker
              coordinate={{
                latitude: activeRide.pickup.latitude,
                longitude: activeRide.pickup.longitude,
              }}
              title="Passenger Pickup"
              description={activeRide.pickup.address}
              pinColor="#10B981"
            />

            {/* Passenger Dropoff Pin (Red) */}
            <Marker
              coordinate={{
                latitude: activeRide.dropoff.latitude,
                longitude: activeRide.dropoff.longitude,
              }}
              title="Dropoff Destination"
              description={activeRide.dropoff.address}
              pinColor="#EF4444"
            />

            {/* Sleek Blue Route Line (Dynamic navigation path) */}
            <Polyline
              coordinates={
                activeRide.status === 'ACCEPTED'
                  ? generateRoadPath(currentLocation, activeRide.pickup)
                  : generateRoadPath(activeRide.pickup, activeRide.dropoff)
              }
              strokeColor="#3B82F6"
              strokeWidth={4}
            />
          </>
        )}
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

          {/* History Button */}
          <TouchableOpacity style={styles.historyBtn} onPress={handleOpenHistory}>
            <Text style={styles.historyBtnText}>📋 View Past Completed Trips</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 🚖 ACTIVE TRIP DRAWER PANEL */}
      {activeRide && (
        <View style={styles.activeRidePanel}>
          <Text style={styles.activeRideHeader}>
            {activeRide.status === 'ACCEPTED' ? 'Heading to Pickup 🚗' : 'Active Trip in Progress 🏁'}
          </Text>

          {activeRide.status === 'ACCEPTED' && (
            <View style={styles.etaContainer}>
              <Text style={styles.etaText}>
                🟢 Passenger is <Text style={{fontWeight:'800', color: '#10B981'}}>{calculateDistanceAndEta()?.distance || '0.0'} km</Text> away (approx. <Text style={{fontWeight:'800', color: '#10B981'}}>{calculateDistanceAndEta()?.eta || '0'} mins</Text>)
              </Text>
            </View>
          )}
          
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>📍 PICKUP</Text>
            <Text style={styles.addressText}>{activeRide.pickup?.address || 'Pickup address'}</Text>
            
            <View style={styles.addressLine} />
            
            <Text style={styles.addressLabel}>🏁 DROPOFF</Text>
            <Text style={styles.addressText}>{activeRide.dropoff?.address || 'Dropoff address'}</Text>
          </View>

          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Class: <Text style={{fontWeight:'700'}}>{activeRide.vehicleType}</Text></Text>
            <Text style={styles.fareValue}>₹{activeRide.fare}</Text>
          </View>

          {/* Action State Buttons */}
          {activeRide.status === 'ACCEPTED' ? (
            <View style={styles.otpInputContainer}>
              <Text style={styles.otpLabel}>Enter Passenger Start OTP:</Text>
              <TextInput
                style={styles.otpInput}
                value={startOtpInput}
                onChangeText={setStartOtpInput}
                placeholder="e.g. 5821"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                maxLength={4}
              />
              <TouchableOpacity style={styles.startBtn} onPress={handleStartRide}>
                <Text style={styles.startBtnText}>Start Trip 🚗</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteRide}>
              <Text style={styles.completeBtnText}>Complete Trip & Collect Cash</Text>
            </TouchableOpacity>
          )}

          {/* Quick Chat Section */}
          <Text style={styles.chatSectionTitle}>💬 Quick Chat Presets:</Text>
          <View style={styles.presetsRow}>
            <TouchableOpacity style={styles.presetBtn} onPress={() => sendQuickMessage("I have arrived at pickup")}>
              <Text style={styles.presetBtnText}>Arrived</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => sendQuickMessage("Stuck in traffic, 5 mins")}>
              <Text style={styles.presetBtnText}>Traffic</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => sendQuickMessage("Where are you waiting?")}>
              <Text style={styles.presetBtnText}>Where?</Text>
            </TouchableOpacity>
          </View>

          {/* Cancel button */}
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelRide}>
            <Text style={styles.cancelBtnText}>Cancel Ride ❌</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 📊 TRIP HISTORY MODAL */}
      <Modal visible={showHistory} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Past Completed Trips</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.closeHistoryBtn}>
              <Text style={styles.closeHistoryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.historyScroll}>
            {historyTrips.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyText}>No completed trips logged yet.</Text>
              </View>
            ) : (
              historyTrips.map((trip) => (
                <View key={trip._id} style={styles.historyCard}>
                  <View style={styles.historyCardRow}>
                    <Text style={styles.historyCardFare}>₹{trip.fare}</Text>
                    <Text style={styles.historyCardDate}>{new Date(trip.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.historyCardLabel}>📍 PICKUP</Text>
                  <Text style={styles.historyCardAddress}>{trip.pickupLocation?.address || 'Unknown'}</Text>
                  <Text style={styles.historyCardLabel}>🏁 DROPOFF</Text>
                  <Text style={styles.historyCardAddress}>{trip.dropoffLocation?.address || 'Unknown'}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
  otpInputContainer: {
    marginVertical: 8,
  },
  otpLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  otpInput: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1.5,
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: '700',
  },
  startBtn: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  chatSectionTitle: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  presetBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  historyBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  historyBtnText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '700',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  closeHistoryBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  closeHistoryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  historyScroll: {
    paddingBottom: 20,
  },
  emptyHistory: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
  },
  historyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyCardFare: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '800',
  },
  historyCardDate: {
    color: '#94A3B8',
    fontSize: 13,
  },
  historyCardLabel: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  historyCardAddress: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 2,
  },
  etaContainer: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    alignItems: 'center',
  },
  etaText: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
