import React, { useState, useEffect, useRef } from 'react'; 
import { View, Dimensions, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, Modal, TextInput, ScrollView, SafeAreaView } from 'react-native';
import UberTypes from "../../components/UberTypes";
import RouteMap from "../../components/RouteMap";
import { useRoute, useNavigation } from "@react-navigation/native";
import { io } from 'socket.io-client'; // 📡 Import Socket client

// 🇮🇳 Smart baseline local coordinates to prevent structural layout calculation freezes
const DEFAULT_LAT = 28.6284;
const DEFAULT_LNG = 77.3769;

const SearchResults = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { originPlace, destinationPlace } = route.params || {};

  const [isDriving, setIsDriving] = useState(false);
  
  // 🔄 Real-time booking states
  const [currentRideId, setCurrentRideId] = useState(null);
  const [rideStatus, setRideStatus] = useState('IDLE'); // IDLE, SEARCHING, ACCEPTED
  const [matchedDriver, setMatchedDriver] = useState(null);
  const [startOtp, setStartOtp] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [etaInfo, setEtaInfo] = useState(null); // stores { distance, eta }
  const [driverPos, setDriverPos] = useState(null); // stores live driver coordinate

  // 📅 Book for Later states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedVehicleForLater, setSelectedVehicleForLater] = useState('Velo Go');
  const [selectedDayOffset, setSelectedDayOffset] = useState(0); // 0=Today, 1=Tomorrow, 2=Day After
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedAmPm, setSelectedAmPm] = useState('AM');

  const socketRef = useRef(null);

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
    socketRef.current = io('http://4.240.25.27:5000');
    const socket = socketRef.current;

    if (currentRideId) {
      console.log(`📡 [Socket] Listening for updates on Ride: ${currentRideId}`);
      socket.emit('join-ride-room', { rideId: currentRideId });
      
      // Listen for the specific socket broadcast channel we built in rides.js
      socket.on(`ride-update-${currentRideId}`, (data) => {
        console.log("📡 [Socket Event] Ride update received:", data);

        if (data.status === 'ACCEPTED') {
          setRideStatus('ACCEPTED');
          setMatchedDriver(data.driver);
          setIsDriving(true); // Automatically starts your map animations!
        } else if (data.status === 'ON_TRIP') {
          setRideStatus('ON_TRIP');
          Alert.alert('Trip Started! 🚗', 'Your ride has officially started. Enjoy your trip.');
        } else if (data.status === 'CANCELLED') {
          setRideStatus('CANCELLED');
          Alert.alert('Ride Cancelled ❌', 'This ride has been cancelled.');
          navigation.navigate('HomeScreen');
        } else if (data.status === 'COMPLETED') {
          setRideStatus('COMPLETED');
          Alert.alert(
            "Trip Completed! 🎉",
            `Thank you for riding with Velo!\nTotal Fare: ₹${data.fare || 0}`,
            [
              { 
                text: "OK", 
                onPress: () => {
                  navigation.navigate('HomeScreen');
                } 
              }
            ]
          );
        }

        // Handle live tracking/ETA calculations
        if (data.etaUpdate) {
          setEtaInfo({
            distance: data.etaUpdate.distance,
            eta: data.etaUpdate.eta
          });
          if (data.etaUpdate.driverLocation) {
            setDriverPos(data.etaUpdate.driverLocation);
          }
        }
      });

      // Listen for chat messages from driver
      socket.on(`new-message-${currentRideId}`, (msg) => {
        setChatMessages((prev) => [...prev, msg]);
        if (!showChat) {
          Alert.alert('New Message from Driver 💬', `"${msg.text}"`);
        }
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [currentRideId, navigation]);

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

  // 📝 Capture the Ride details when created
  const handleRideCreated = (ride) => {
    setCurrentRideId(ride._id);
    setRideStatus('SEARCHING');
    setStartOtp(ride.startOtp);
  };

  const handleCancelRide = async () => {
    if (!currentRideId) return;

    Alert.alert(
      'Cancel Booking ❌',
      'Are you sure you want to cancel your ride request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch('http://4.240.25.27:5000/api/rides/cancel-ride', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  rideId: currentRideId,
                  canceller: 'passenger'
                })
              });
              const data = await response.json();
              if (data.success) {
                Alert.alert('Cancelled', 'Your booking request has been cancelled.');
                navigation.navigate('HomeScreen');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel the request.');
            }
          }
        }
      ]
    );
  };

  // Calculates and saves scheduled ride request to backend
  const handleScheduleRide = async () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + selectedDayOffset);
    
    let hour = parseInt(selectedHour);
    if (selectedAmPm === 'PM' && hour < 12) hour += 12;
    if (selectedAmPm === 'AM' && hour === 12) hour = 0;
    
    targetDate.setHours(hour, parseInt(selectedMinute), 0, 0);

    // Validate that scheduled departure is in the future
    if (targetDate.getTime() <= Date.now()) {
      Alert.alert("Invalid Time ❌", "Scheduled departure time must be in the future!");
      return;
    }

    try {
      const response = await fetch('http://4.240.25.27:5000/api/rides/request-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengerId: "6a28fac827c86bf2fdbcd628", // Dummy passenger ID
          pickupLocation: pickupLocation, 
          dropoffLocation: dropoffLocation, 
          vehicleType: selectedVehicleForLater,
          scheduledTime: targetDate.toISOString()
        })
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert(
          "Ride Scheduled! 🎉",
          `Your ride has been successfully booked for ${targetDate.toLocaleString()}.\n\nWe will automatically match a driver 5 minutes before departure.`,
          [
            {
              text: "OK",
              onPress: () => {
                setShowDatePicker(false);
                navigation.navigate('HomeScreen');
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert("Scheduling Error", "Could not complete your scheduled ride request.");
    }
  };

  const sendChatMessage = (text) => {
    if (!currentRideId || !text.trim()) return;
    if (socketRef.current) {
      socketRef.current.emit('send-message', {
        rideId: currentRideId,
        text,
        senderId: "6a28fac827c86bf2fdbcd628" // passenger ID
      });
      setChatMessages((prev) => [...prev, { text, senderId: "6a28fac827c86bf2fdbcd628" }]);
      setChatInput('');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white', justifyContent: 'space-between' }}>
      <View style={{ height: Dimensions.get('window').height - 400 }}>
        <RouteMap 
          origin={originPlace} 
          destination={destinationPlace} 
          isDriving={isDriving} 
          setIsDriving={setIsDriving}
          driverLocation={driverPos}
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
      </View>

      <View style={{ height: 400 }}>
        {rideStatus === 'IDLE' || rideStatus === 'SEARCHING' ? (
          <View style={{ flex: 1 }}>
            {rideStatus === 'SEARCHING' ? (
              // 🌀 Concentric pulsing radar circle design
              <View style={styles.searchingPanel}>
                <View style={styles.radarCircleOuter}>
                  <View style={styles.radarCircleInner}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.searchingTitle}>Finding your driver...</Text>
                <Text style={styles.searchingSubtitle}>Connecting to nearby vehicles in Delhi</Text>
                <TouchableOpacity style={styles.cancelRequestBtn} onPress={handleCancelRide}>
                  <Text style={styles.cancelRequestBtnText}>Cancel Request ❌</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <UberTypes 
                pickupLocation={pickupLocation} 
                dropoffLocation={dropoffLocation} 
                triggerMovement={() => setIsDriving(true)}
                onRideCreated={handleRideCreated}
                onPressBookForLater={(vehicleType) => {
                  setSelectedVehicleForLater(vehicleType);
                  setShowDatePicker(true);
                }}
              />
            )}
          </View>
        ) : (
          // 🚖 Matched Driver Details Card
          <View style={styles.driverCard}>
            <View style={styles.driverInfoRow}>
              {matchedDriver?.profilePhoto ? (
                <Image source={{ uri: matchedDriver.profilePhoto }} style={styles.driverPhoto} />
              ) : (
                <View style={styles.placeholderPhoto}>
                  <Text style={styles.placeholderPhotoText}>👤</Text>
                </View>
              )}
              
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{matchedDriver?.fullname || 'Driver'}</Text>
                <Text style={styles.driverVehicle}>
                  {matchedDriver?.vehicle?.color || 'White'} {matchedDriver?.vehicle?.carModel || 'Maruti Suzuki Swift'}
                </Text>
                <Text style={styles.driverPlate}>Plate: {matchedDriver?.vehicle?.plateNumber || 'DL 3C AY 4412'}</Text>
              </View>
              
              <View style={styles.otpBadge}>
                <Text style={styles.otpBadgeLabel}>START CODE</Text>
                <Text style={styles.otpBadgeVal}>{startOtp}</Text>
              </View>
            </View>

            {/* Live Tracking / ETA Updates */}
            {etaInfo && (
              <View style={styles.etaBadge}>
                <Text style={styles.etaText}>
                  🟢 Driver is <Text style={{fontWeight:'800'}}>{etaInfo.distance} km</Text> away (approx. <Text style={{fontWeight:'800'}}>{etaInfo.eta} mins</Text>)
                </Text>
              </View>
            )}

            {/* Trip status text */}
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                STATUS: {rideStatus === 'ACCEPTED' ? 'Driver is on the way!' : 'Trip started - Enjoy your ride!'}
              </Text>
            </View>

            {/* Quick Presets Row */}
            <View style={styles.presetsRow}>
              <TouchableOpacity style={styles.presetBtn} onPress={() => sendChatMessage("I am waiting at the pickup spot.")}>
                <Text style={styles.presetBtnText}>Waiting Here</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={() => sendChatMessage("I have a red shirt.")}>
                <Text style={styles.presetBtnText}>Red Shirt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatIconBtn} onPress={() => setShowChat(true)}>
                <Text style={styles.chatIconBtnText}>💬 Chat</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelTripBtn} onPress={handleCancelRide}>
              <Text style={styles.cancelTripBtnText}>Cancel Ride ❌</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 📅 BOOK FOR LATER: CUSTOM DATE/TIME PICKER MODAL */}
      <Modal visible={showDatePicker} animationType="slide" transparent={true}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Schedule a Ride 📅</Text>
            <Text style={styles.pickerSub}>Select when you want to be picked up:</Text>

            {/* DAY SELECTOR */}
            <Text style={styles.sectionLabel}>Date:</Text>
            <View style={styles.pickerRow}>
              {['Today', 'Tomorrow', 'Day After'].map((day, idx) => (
                <TouchableOpacity 
                  key={day}
                  style={[styles.pickerOpt, selectedDayOffset === idx && styles.pickerOptActive]}
                  onPress={() => setSelectedDayOffset(idx)}
                >
                  <Text style={[styles.pickerOptText, selectedDayOffset === idx && styles.pickerOptTextActive]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* HOUR SELECTOR */}
            <Text style={styles.sectionLabel}>Time:</Text>
            <View style={styles.pickerRow}>
              <View style={styles.timeDropdownCol}>
                <Text style={styles.dropdownLabel}>Hour</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40 }}>
                  {['01','02','03','04','05','06','07','08','09','10','11','12'].map((hr) => (
                    <TouchableOpacity 
                      key={hr}
                      style={[styles.timeBtn, selectedHour === hr && styles.timeBtnActive]}
                      onPress={() => setSelectedHour(hr)}
                    >
                      <Text style={[styles.timeBtnText, selectedHour === hr && styles.timeBtnTextActive]}>{hr}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* MINUTES & AM/PM SELECTORS */}
            <View style={styles.pickerRow}>
              <View style={styles.timeDropdownCol}>
                <Text style={styles.dropdownLabel}>Minute</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 40 }}>
                  {['00', '15', '30', '45'].map((min) => (
                    <TouchableOpacity 
                      key={min}
                      style={[styles.timeBtn, selectedMinute === min && styles.timeBtnActive]}
                      onPress={() => setSelectedMinute(min)}
                    >
                      <Text style={[styles.timeBtnText, selectedMinute === min && styles.timeBtnTextActive]}>{min}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={{ flexDirection: 'row', gap: 6, alignSelf: 'flex-end', marginLeft: 16 }}>
                {['AM', 'PM'].map((ampm) => (
                  <TouchableOpacity 
                    key={ampm}
                    style={[styles.timeBtn, selectedAmPm === ampm && styles.timeBtnActive]}
                    onPress={() => setSelectedAmPm(ampm)}
                  >
                    <Text style={[styles.timeBtnText, selectedAmPm === ampm && styles.timeBtnTextActive]}>{ampm}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ACTION BUTTONS */}
            <TouchableOpacity style={styles.confirmScheduleBtn} onPress={handleScheduleRide}>
              <Text style={styles.confirmScheduleBtnText}>Confirm Scheduled Booking 📅</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closePickerBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.closePickerBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 💬 CHAT CONVERSATION MODAL */}
      <Modal visible={showChat} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Chat with Driver</Text>
            <TouchableOpacity onPress={() => setShowChat(false)} style={styles.closeChatBtn}>
              <Text style={styles.closeChatBtnText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.chatScroll} contentContainerStyle={{ paddingBottom: 20 }}>
            {chatMessages.length === 0 ? (
              <Text style={styles.emptyChatText}>No messages exchanged yet.</Text>
            ) : (
              chatMessages.map((msg, index) => {
                const isMe = msg.senderId === "6a28fac827c86bf2fdbcd628";
                return (
                  <View key={index} style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleDriver]}>
                    <Text style={[styles.msgText, { color: isMe ? '#FFFFFF' : '#0F172A' }]}>{msg.text}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatTextInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type your message..."
              placeholderTextColor="#64748B"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={() => sendChatMessage(chatInput)}>
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  },
  searchingPanel: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#000000',
    flex: 1,
    justifyContent: 'center',
  },
  radarCircleOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  radarCircleInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  searchingSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 24,
    textAlign: 'center',
  },
  cancelRequestBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  cancelRequestBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  driverCard: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  placeholderPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeholderPhotoText: {
    fontSize: 28,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  driverVehicle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  driverPlate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 2,
  },
  otpBadge: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
  },
  otpBadgeLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '800',
  },
  otpBadgeVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  etaBadge: {
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  etaText: {
    color: '#1E40AF',
    fontSize: 13,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 2,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  presetBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  chatIconBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  chatIconBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelTripBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 8,
  },
  cancelTripBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeChatBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  closeChatBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
  },
  chatScroll: {
    flex: 1,
    padding: 16,
  },
  emptyChatText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 100,
  },
  msgBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: '80%',
  },
  msgBubbleMe: {
    backgroundColor: '#3B82F6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  msgBubbleDriver: {
    backgroundColor: '#E2E8F0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
  },
  msgText: {
    fontSize: 14,
  },
  chatInputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  chatTextInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000000',
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  pickerSub: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3B82F6',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  pickerOpt: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pickerOptActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  pickerOptText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  pickerOptTextActive: {
    color: '#1E40AF',
    fontWeight: '700',
  },
  timeDropdownCol: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 4,
  },
  timeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBtnActive: {
    backgroundColor: '#3B82F6',
  },
  timeBtnText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  timeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  confirmScheduleBtn: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmScheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  closePickerBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  closePickerBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SearchResults;