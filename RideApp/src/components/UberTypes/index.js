import React, { useState } from 'react'
import { View, Text, Pressable, Alert, TextInput, ScrollView } from 'react-native'
import UberTypeRow from '../UberTypeRow'
import typesdata from "../../assets/data/types"
import axios from 'axios'
import RazorpayCheckout from 'react-native-razorpay'

// 📐 1. Haversine Formula (Dynamic layout)
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
};

// 💰 2. Frontend estimate calculator matching the backend logic completely
const getFrontendEstimate = (type, pickup, dropoff, stop) => {
  if (!pickup || !dropoff) return 50;

  const getLatLng = (loc) => {
    if (!loc) return null;
    if (loc.latitude) return { lat: loc.latitude, lng: loc.longitude };
    if (loc.details?.geometry?.location) return { lat: loc.details.geometry.location.lat, lng: loc.details.geometry.location.lng };
    if (loc.geometry?.location) return { lat: loc.geometry.location.lat, lng: loc.geometry.location.lng };
    return null;
  };

  const p = getLatLng(pickup);
  const d = getLatLng(dropoff);
  const s = getLatLng(stop);

  if (!p || !d) return 50;

  let distanceKm = 0;
  if (s) {
    distanceKm = calculateHaversineDistance(p.lat, p.lng, s.lat, s.lng) + 
                 calculateHaversineDistance(s.lat, s.lng, d.lat, d.lng);
  } else {
    distanceKm = calculateHaversineDistance(p.lat, p.lng, d.lat, d.lng);
  }
  
  let ratePerKm = 15; // Velo Go
  if (type === 'Velo Plus') ratePerKm = 22;
  if (type === 'Velo XL') ratePerKm = 30;

  return Math.round(50 + (distanceKm * ratePerKm));
};

const UberTypes = (props) => {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedType, setSelectedType] = useState(typesdata[0]?.type || 'Velo Go');

  // 🎟️ Promo Code States
  const [promoText, setPromoText] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [discountAmt, setDiscountAmt] = useState(0);
  const [appliedPromoDesc, setAppliedPromoDesc] = useState('');

  // 💳 Payment states
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH or ONLINE

  // Hits the backend validate-promo endpoint
  const handleApplyPromo = async () => {
    if (isPromoApplied) {
      // Clear promo
      setIsPromoApplied(false);
      setPromoText('');
      setDiscountAmt(0);
      setAppliedPromoDesc('');
      return;
    }

    if (!promoText.trim()) {
      Alert.alert("Empty Code ⚠️", "Please enter a promo code first.");
      return;
    }

    const currentEstimate = getFrontendEstimate(selectedType, props.pickupLocation, props.dropoffLocation, props.stopLocation);

    try {
      const response = await axios.post('http://4.240.25.27:5000/api/rides/validate-promo', {
        promoCode: promoText,
        fare: currentEstimate
      });

      if (response.data.success) {
        setIsPromoApplied(true);
        setDiscountAmt(response.data.discountAmount);
        setAppliedPromoDesc(response.data.description);
        Alert.alert("Promo Applied! 🎉", `Discount: -₹${response.data.discountAmount}\n${response.data.description}`);
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Invalid Promo Code ❌";
      Alert.alert("Failed", msg);
    }
  };

  const requestRideAllocation = async (orderId, paymentId) => {
    const ridePayload = {
      passengerId: "6a28fac827c86bf2fdbcd628", 
      pickupLocation: props.pickupLocation, 
      dropoffLocation: props.dropoffLocation, 
      stopLocation: props.stopLocation,
      vehicleType: selectedType,
      promoCode: isPromoApplied ? promoText : null,
      paymentMethod,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      paymentStatus: paymentMethod === 'ONLINE' ? 'PAID' : 'PENDING'
    };

    try {
      console.log(`🚖 Requesting allocation for: ${selectedType} (Payment: ${paymentMethod})`);
      const response = await axios.post('http://4.240.25.27:5000/api/rides/request-ride', ridePayload);

      if (response.data.success) {
        const { ride, driver } = response.data; 
        
        // Bubble the generated ride ID up to the parent SearchResults container
        if (props.onRideCreated) {
          props.onRideCreated(ride);
        }
        
        if (props.triggerMovement) {
          props.triggerMovement();
        }
        
        if (driver) {
          Alert.alert(
            "Velo Match Confirmed! 🎉",
            `Driver: ${driver.fullname}\nVehicle: ${driver.vehicle?.color || ''} ${driver.vehicle?.carModel || ''}\n\nPrice: ₹${ride.fare}`
          );
        } else {
          Alert.alert(
            "Booking Registered! ⏳",
            `Searching for available local drivers...\n\nPrice: ₹${ride.fare}`
          );
        }
      }
    } catch (error) {
      console.error("❌ Ride Request Error:", error.message);
      Alert.alert("Booking Engine Error", "Could not complete your ride request.");
    } finally {
      setIsSearching(false);
    }
  };

  const confirm = async () => {
    if (!props.pickupLocation || !props.dropoffLocation) {
      Alert.alert("Missing Locations", "Please select a pickup and destination first.");
      return;
    }

    const currentEstimate = getFrontendEstimate(selectedType, props.pickupLocation, props.dropoffLocation, props.stopLocation);
    const finalFare = Math.max(50, currentEstimate - discountAmt);

    setIsSearching(true);

    if (paymentMethod === 'ONLINE') {
      try {
        console.log(`💳 [Billing Engine] Initializing online order for ₹${finalFare}`);
        // Step 1: Hit backend to create Razorpay Order
        const orderResponse = await axios.post('http://4.240.25.27:5000/api/payments/create-order', {
          amount: finalFare
        });

        if (orderResponse.data.success) {
          const { orderId, keyId } = orderResponse.data;

          // Step 2: Trigger Razorpay checkout sheet
          const options = {
            description: `Velo Trip - ${selectedType}`,
            image: 'https://cdn.razorpay.com/logos/BUV4ws3thSgVH5_medium.png',
            currency: 'INR',
            key: keyId,
            amount: Math.round(finalFare * 100),
            name: 'Velo Cab Services',
            order_id: orderId,
            prefill: {
              email: 'passenger@velo.com',
              contact: '9999999999',
              name: 'Passenger'
            },
            theme: { color: '#0F172A' }
          };

          RazorpayCheckout.open(options).then(async (data) => {
            console.log("✅ Razorpay payment succeeded:", data.razorpay_payment_id);
            
            // Step 3: Verify signature on server
            try {
              const verifyResponse = await axios.post('http://4.240.25.27:5000/api/payments/verify-payment', {
                razorpay_order_id: data.razorpay_order_id,
                razorpay_payment_id: data.razorpay_payment_id,
                razorpay_signature: data.razorpay_signature
              });

              if (verifyResponse.data.success) {
                // Verified successfully, register allocation!
                requestRideAllocation(orderId, data.razorpay_payment_id);
              } else {
                Alert.alert("Payment Failed ❌", "Verification signature invalid.");
                setIsSearching(false);
              }
            } catch (err) {
              Alert.alert("Verification Error", "Failed to check signatures on server.");
              setIsSearching(false);
            }
          }).catch(async (error) => {
            // Fallback for Mock Mode testing in case the Razorpay sheet cannot open with the mock order ID!
            if (orderId && orderId.startsWith('order_mock_')) {
              console.log("ℹ️ [Mock Mode] Bypassing Razorpay Checkout sheet crash for test order");
              try {
                const verifyResponse = await axios.post('http://4.240.25.27:5000/api/payments/verify-payment', {
                  razorpay_order_id: orderId,
                  razorpay_payment_id: `pay_mock_${Date.now()}`
                });
                if (verifyResponse.data.success) {
                  requestRideAllocation(orderId, `pay_mock_${Date.now()}`);
                  return;
                }
              } catch (err) {
                console.log("Mock verification failed", err);
              }
            }

            console.log("❌ Razorpay checkout cancelled:", error?.description || "Payment cancelled");
            Alert.alert("Payment Cancelled ⚠️", "Transaction was aborted by the user.");
            setIsSearching(false);
          });
        }
      } catch (error) {
        console.error("Order ID fetch failed:", error.message);
        Alert.alert("Gateway Error ❌", "Could not initialize payment order.");
        setIsSearching(false);
      }
    } else {
      // CASH payment (bypass SDK checkouts)
      requestRideAllocation(null, null);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 15 }}>
      {typesdata.map((item) => {
        const isCurrentSelection = item.type === selectedType;
        const dynamicPrice = getFrontendEstimate(item.type, props.pickupLocation, props.dropoffLocation, props.stopLocation);
        const modifiedItem = { ...item, price: dynamicPrice };
        
        return (
          <Pressable 
            key={item.id} 
            onPress={() => setSelectedType(item.type)}
            style={{
              marginVertical: 1,
            }}
          >
            <UberTypeRow type={modifiedItem} isSelected={isCurrentSelection} />
          </Pressable>
        );
      })}

      {/* 🏷️ RECOMMENDED PROMO CODES LIST */}
      <View style={{ marginHorizontal: 10, marginTop: 6, marginBottom: 2 }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Recommended Offers
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Pressable 
            onPress={() => {
              setPromoText('VELO50');
              Alert.alert("Code Selected 🎟️", "Tap 'Apply' to apply the 50% discount to your ride!");
            }}
            style={{
              backgroundColor: '#EFF6FF',
              borderColor: '#BFDBFE',
              borderWidth: 1,
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              alignItems: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E40AF' }}>VELO50</Text>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#3B82F6', marginTop: 2 }}>50% OFF (First 5 Rides)</Text>
          </Pressable>

          <Pressable 
            onPress={() => {
              setPromoText('SAVE100');
              Alert.alert("Code Selected 🎟️", "Tap 'Apply' to apply the flat ₹100 discount to your ride!");
            }}
            style={{
              backgroundColor: '#ECFDF5',
              borderColor: '#A7F3D0',
              borderWidth: 1,
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              alignItems: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#065F46' }}>SAVE100</Text>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#059669', marginTop: 2 }}>Flat ₹100 OFF (Min ₹150)</Text>
          </Pressable>

          <Pressable 
            onPress={() => {
              setPromoText('WELCOME20');
              Alert.alert("Code Selected 🎟️", "Tap 'Apply' to apply the 20% new user discount to your ride!");
            }}
            style={{
              backgroundColor: '#FDF2F8',
              borderColor: '#FBCFE8',
              borderWidth: 1,
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              alignItems: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#9D174D' }}>WELCOME20</Text>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#DB2777', marginTop: 2 }}>20% OFF (New User Welcome)</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* 🎟️ PROMO CODE CARD BLOCK */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        marginHorizontal: 10,
        marginVertical: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}>
        <TextInput
          placeholder="Promo Code (e.g. VELO50)"
          placeholderTextColor="#64748B"
          autoCapitalize="characters"
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: '700',
            color: '#0F172A',
            padding: 4,
          }}
          value={promoText}
          onChangeText={setPromoText}
          editable={!isPromoApplied}
        />
        <Pressable 
          onPress={handleApplyPromo}
          style={{
            backgroundColor: '#0F172A',
            borderRadius: 6,
            paddingVertical: 8,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>
            {isPromoApplied ? "Clear" : "Apply"}
          </Text>
        </Pressable>
      </View>

      {isPromoApplied && (
        <Text style={{
          color: '#16A34A',
          fontSize: 12,
          fontWeight: '700',
          marginLeft: 14,
          marginBottom: 6,
        }}>
          🎉 Applied: {appliedPromoDesc} (Discount: -₹{discountAmt})
        </Text>
      )}

      {/* 💳 PAYMENT METHOD TOGGLE SELECTOR */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        marginHorizontal: 10,
        marginVertical: 4,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>
          Payment Method
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable 
            onPress={() => setPaymentMethod('CASH')}
            style={{
              backgroundColor: paymentMethod === 'CASH' ? '#0F172A' : '#FFFFFF',
              borderColor: paymentMethod === 'CASH' ? '#0F172A' : '#CBD5E1',
              borderWidth: 1,
              borderRadius: 6,
              paddingVertical: 6,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ 
              color: paymentMethod === 'CASH' ? '#FFFFFF' : '#0F172A', 
              fontSize: 12, 
              fontWeight: '800' 
            }}>
              💵 Cash
            </Text>
          </Pressable>

          <Pressable 
            onPress={() => setPaymentMethod('ONLINE')}
            style={{
              backgroundColor: paymentMethod === 'ONLINE' ? '#0F172A' : '#FFFFFF',
              borderColor: paymentMethod === 'ONLINE' ? '#0F172A' : '#CBD5E1',
              borderWidth: 1,
              borderRadius: 6,
              paddingVertical: 6,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ 
              color: paymentMethod === 'ONLINE' ? '#FFFFFF' : '#0F172A', 
              fontSize: 12, 
              fontWeight: '800' 
            }}>
              💳 Pay Online
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginVertical: 8 }}>
        <Pressable 
          onPress={confirm} 
          disabled={isSearching}
          style={{
            flex: 4,
            backgroundColor: isSearching ? '#555555' : '#000000',
            padding: 15,
            marginRight: 8,
            alignItems: 'center',
            borderRadius: 10
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: '700' }}>
            {isSearching ? "Searching..." : `Confirm ${selectedType}`}
          </Text>
        </Pressable>

        <Pressable 
          onPress={() => props.onPressBookForLater(selectedType)} 
          disabled={isSearching}
          style={{
            flex: 1,
            backgroundColor: '#F1F5F9',
            borderColor: '#CBD5E1',
            borderWidth: 1.5,
            padding: 15,
            alignItems: 'center',
            borderRadius: 10
          }}
        >
          <Text style={{ fontSize: 18 }}>📅</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default UberTypes;