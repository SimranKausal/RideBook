import React, { useState } from 'react'
import { View, Text, Pressable, Alert, TextInput } from 'react-native'
import UberTypeRow from '../UberTypeRow'
import typesdata from "../../assets/data/types"
import axios from 'axios'

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

  const confirm = async () => {
    if (!props.pickupLocation || !props.dropoffLocation) {
      Alert.alert("Missing Locations", "Please select a pickup and destination first.");
      return;
    }

    setIsSearching(true);

    const ridePayload = {
      passengerId: "6a28fac827c86bf2fdbcd628", 
      pickupLocation: props.pickupLocation, 
      dropoffLocation: props.dropoffLocation, 
      stopLocation: props.stopLocation,
      vehicleType: selectedType,
      promoCode: isPromoApplied ? promoText : null
    };

    try {
      console.log(`🚖 Requesting allocation for: ${selectedType}`);
      const response = await axios.post('http://4.240.25.27:5000/api/rides/request-ride', ridePayload);

      if (response.data.success) {
        const { ride, driver } = response.data; 
        
        // 🔥 CRITICAL: Bubble the generated ride ID up to the parent SearchResults container
        if (props.onRideCreated) {
          props.onRideCreated(ride);
        }
        
        if (props.triggerMovement) {
          props.triggerMovement();
        }
        
        if (driver) {
          Alert.alert(
            "Velo Match Confirmed! 🎉",
            `Driver: ${driver.fullname}\nVehicle: ${driver.vehicle?.color || ''} ${driver.vehicle?.carModel || ''}\nPlate Number: ${driver.vehicle?.plateNumber || ''}\n\nFinal Price: Rupee ${ride.fare}`
          );
        } else {
          // ✨ Cleaned and polished for your Manager Presentation!
          Alert.alert(
            "Booking Registered! ⏳",
            `Searching for available local drivers...\n\nPrice: Rupee ${ride.fare}`
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

  return (
    <View>
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
    </View>
  );
};

export default UberTypes;