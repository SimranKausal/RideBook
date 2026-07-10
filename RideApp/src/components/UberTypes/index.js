import React, { useState } from 'react'
import { View, Text, Pressable, Alert } from 'react-native'
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
const getFrontendEstimate = (type, pickup, dropoff) => {
  if (!pickup?.latitude || !dropoff?.latitude) return 50;

  const distanceKm = calculateHaversineDistance(
    pickup.latitude, 
    pickup.longitude, 
    dropoff.latitude, 
    dropoff.longitude
  );
  
  let ratePerKm = 15; // Velo Go
  if (type === 'Velo Plus') ratePerKm = 22;
  if (type === 'Velo XL') ratePerKm = 30;

  return Math.round(50 + (distanceKm * ratePerKm));
};

const UberTypes = (props) => {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedType, setSelectedType] = useState(typesdata[0]?.type || 'Velo Go');

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
      vehicleType: selectedType 
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
        const dynamicPrice = getFrontendEstimate(item.type, props.pickupLocation, props.dropoffLocation);
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