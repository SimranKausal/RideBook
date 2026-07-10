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
  const { originPlace, destinationPlace, stopPlace } = route.params || {};

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

  // ⭐️ Star Rating states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);

  // 🛡️ Driver Profile details modal state
  const [showDriverProfile, setShowDriverProfile] = useState(false);

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
          setShowRatingModal(true);
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

  // Submits 1-5 star review to backend rate-driver endpoint
  const handleSubmitRating = async () => {
    try {
      const response = await fetch('http://4.240.25.27:5000/api/rides/rate-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: currentRideId,
          rating: selectedRating
        })
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert("Thank you! ❤️", "Your feedback helps keep the Velo community safe and friendly.");
      }
    } catch (error) {
      console.log("Error submitting rating:", error.message);
    } finally {
      setShowRatingModal(false);
      navigation.navigate('HomeScreen');
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
          waypoints={stopPlace?.details?.geometry?.location || stopPlace?.geometry?.location ? [{
            latitude: (stopPlace?.details?.geometry?.location || stopPlace?.geometry?.location).lat,
            longitude: (stopPlace?.details?.geometry?.location || stopPlace?.geometry?.location).lng
          }] : []}
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
                stopLocation={stopPlace}
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
          // 🚖 Matched Driver Details Card (Tap to view profile details)
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => setShowDriverProfile(true)}
            style={styles.driverCard}
          >
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
                  {matchedDriver?.vehicleDetails?.color || matchedDriver?.vehicle?.color || 'White'} {matchedDriver?.vehicleDetails?.carModel || matchedDriver?.vehicle?.carModel || 'Maruti Swift'}
                </Text>
                <Text style={styles.driverPlate}>Plate: {matchedDriver?.vehicleDetails?.plateNumber || matchedDriver?.vehicle?.plateNumber || 'DL 3C AY 4412'}</Text>
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

      {/* 🛡️ DRIVER PROFILE MODAL */}
      <Modal visible={showDriverProfile} animationType="slide" transparent={true}>
        <View style={styles.profileOverlay}>
          <View style={styles.profileCard}>
            <View style={styles.profileHandleBar} />
            
            <Text style={styles.profileTitleText}>Driver Profile Details</Text>
            
            {matchedDriver ? (
              <View style={styles.profileBody}>
                {matchedDriver.profilePhoto ? (
                  <Image source={{ uri: matchedDriver.profilePhoto }} style={styles.profileDriverPhotoLarge} />
                ) : (
                  <View style={[styles.profileDriverPhotoLarge, { backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 32 }}>👤</Text>
                  </View>
                )}
                <Text style={styles.profileDriverNameLarge}>{matchedDriver.fullname || 'Driver'}</Text>
                
                {/* Rating display */}
                <View style={styles.profileRatingRow}>
                  <Text style={{ fontSize: 16, color: '#FBBF24' }}>★</Text>
                  <Text style={styles.profileRatingText}>
                    {matchedDriver.rating ? matchedDriver.rating.toFixed(1) : '5.0'} ({matchedDriver.ratingCount || 0} reviews)
                  </Text>
                </View>

                <View style={styles.dividerLine} />

                {/* Quick stats grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>1.2K</Text>
                    <Text style={styles.statLabel}>Trips</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>2 Yrs</Text>
                    <Text style={styles.statLabel}>Active</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>99%</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                </View>

                <View style={styles.dividerLine} />

                {/* Vehicle details */}
                <Text style={styles.vehicleLabel}>Vehicle Details</Text>
                <View style={styles.vehiclePanel}>
                  <Text style={styles.vehicleModelText}>
                    🚗 {matchedDriver.vehicleDetails?.color || matchedDriver.vehicle?.color || 'White'} {matchedDriver.vehicleDetails?.carModel || matchedDriver.vehicle?.carModel || 'Maruti Swift'}
                  </Text>
                  <View style={styles.plateBadgeLarge}>
                    <Text style={styles.plateTextLarge}>{matchedDriver.vehicleDetails?.plateNumber || matchedDriver.vehicle?.plateNumber || 'DL 3C AY 4412'}</Text>
                  </View>
                </View>

                <View style={styles.dividerLine} />

                {/* Specialty badges */}
                <Text style={styles.badgesLabel}>Specialty Badges</Text>
                <View style={styles.badgesContainer}>
                  <View style={styles.badgeItem}><Text style={styles.badgeText}>🛡️ Safe Driver</Text></View>
                  <View style={styles.badgeItem}><Text style={styles.badgeText}>💬 Friendly</Text></View>
                  <View style={styles.badgeItem}><Text style={styles.badgeText}>⚡ Fast Pickups</Text></View>
                </View>
              </View>
            ) : (
              <Text style={{ color: 'white', marginVertical: 20 }}>No driver matched yet.</Text>
            )}

            <TouchableOpacity style={styles.closeProfileBtn} onPress={() => setShowDriverProfile(false)}>
              <Text style={styles.closeProfileBtnText}>Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ⭐️ RATE YOUR DRIVER MODAL */}
      <Modal visible={showRatingModal} animationType="slide" transparent={true}>
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingCard}>
            <Text style={styles.ratingHeaderText}>Rate Your Ride ⭐️</Text>
            
            {matchedDriver ? (
              <View style={styles.ratingDriverInfo}>
                {matchedDriver.profilePhoto ? (
                  <Image source={{ uri: matchedDriver.profilePhoto }} style={styles.ratingDriverPhoto} />
                ) : (
                  <View style={[styles.ratingDriverPhoto, { backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 24 }}>👤</Text>
                  </View>
                )}
                <Text style={styles.ratingDriverName}>{matchedDriver.fullname || 'Driver'}</Text>
                <Text style={styles.ratingDriverCar}>{matchedDriver.vehicle?.color} {matchedDriver.vehicle?.carModel}</Text>
              </View>
            ) : (
              <Text style={styles.ratingSubText}>How was your trip with Velo?</Text>
            )}

            {/* Stars selection row */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => setSelectedRating(star)}
                  style={styles.starTouch}
                >
                  <Text style={[
                    styles.starIcon,
                    star <= selectedRating ? styles.starIconActive : styles.starIconInactive
                  ]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Feedback tag badges */}
            <Text style={styles.feedbackLabel}>What went well?</Text>
            <View style={styles.feedbackRow}>
              {['Safe Driving', 'Clean Car', 'Polite', 'Great Music'].map((tag) => (
                <View key={tag} style={styles.feedbackTag}>
                  <Text style={styles.feedbackTagText}>✓ {tag}</Text>
                </View>
              ))}
            </View>

            {/* Submit buttons */}
            <TouchableOpacity style={styles.submitRatingBtn} onPress={handleSubmitRating}>
              <Text style={styles.submitRatingBtnText}>Submit Rating & Close</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipRatingBtn} onPress={() => {
              setShowRatingModal(false);
              navigation.navigate('HomeScreen');
            }}>
              <Text style={styles.skipRatingBtnText}>Skip</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  pickerSub: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 1,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  pickerOpt: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  pickerOptActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  pickerOptText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  pickerOptTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  timeDropdownCol: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 6,
  },
  timeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1E293B',
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  timeBtnActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  timeBtnText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  timeBtnTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  confirmScheduleBtn: {
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmScheduleBtnText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  closePickerBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  closePickerBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  ratingCard: {
    width: '100%',
    backgroundColor: '#0F172A', // Slate-900 matching
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  ratingHeaderText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  ratingDriverInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingDriverPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#38BDF8',
    marginBottom: 8,
  },
  ratingDriverName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ratingDriverCar: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  ratingSubText: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  starTouch: {
    padding: 4,
  },
  starIcon: {
    fontSize: 40,
    fontWeight: '900',
  },
  starIconActive: {
    color: '#FBBF24', // Amber-400 gold stars
  },
  starIconInactive: {
    color: '#334155', // Slate-700 gray stars
  },
  feedbackLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  feedbackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  feedbackTag: {
    backgroundColor: '#1E293B',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  feedbackTagText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  submitRatingBtn: {
    backgroundColor: '#38BDF8',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitRatingBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  skipRatingBtn: {
    paddingVertical: 8,
  },
  skipRatingBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  profileOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'flex-end',
  },
  profileCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    padding: 24,
    maxHeight: '85%',
  },
  profileHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  profileTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  profileBody: {
    alignItems: 'center',
  },
  profileDriverPhotoLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#38BDF8',
    marginBottom: 10,
  },
  profileDriverNameLarge: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  profileRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 16,
  },
  profileRatingText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    color: '#38BDF8',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  vehicleLabel: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  vehiclePanel: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  vehicleModelText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  plateBadgeLarge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  plateTextLarge: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 11,
  },
  badgesLabel: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    width: '100%',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  badgeItem: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  badgeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  closeProfileBtn: {
    backgroundColor: '#1E293B',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  closeProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default SearchResults;