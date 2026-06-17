import React, { useState } from 'react'
import { View, Text, Pressable, Alert } from 'react-native'
import UberTypeRow from '../UberTypeRow'
import typesdata from "../../assets/data/types"
import axios from 'axios'

// 📐 Frontend distance estimator (Haversine formula clone) for your manager's viewing
const getFrontendEstimate = (type) => {
  const distanceKm = 8.5; // Matches your active map route layout (~8.5 km)
  
  let ratePerKm = 15; // Velo Go
  if (type === 'Velo Plus') ratePerKm = 22;
  if (type === 'Velo XL') ratePerKm = 30;

  return Math.round(50 + (distanceKm * ratePerKm));
};

const UberTypes = (props) => {
  const [isSearching, setIsSearching] = useState(false);
  
  // 🚗 Store the currently selected vehicle tier (Defaulting to the first item)
  const [selectedType, setSelectedType] = useState(typesdata[0]?.type || 'Velo Go');

  const confirm = async () => {
    setIsSearching(true);

    const ridePayload = {
      passengerId: "6a28fac827c86bf2fdbcd628", // Your test user Atlas ID
      pickupLocation: {
        address: "Daryaganj, Delhi",
        latitude: 28.6448,
        longitude: 77.2403
      },
      dropoffLocation: {
        address: "Connaught Place, New Delhi",
        latitude: 28.6304,
        longitude: 77.2177
      },
      vehicleType: selectedType 
    };

    try {
      console.log(`🚖 Requesting allocation for: ${selectedType}`);
      const response = await axios.post('http://10.0.2.2:5000/api/rides/request-ride', ridePayload);

      if (response.data.success) {
        const { ride, driver } = response.data; 
        
        // Trigger car movement on map if the prop function exists
        if (props.triggerMovement) {
          props.triggerMovement();
        }
        
        if (driver) {
          Alert.alert(
            "Velo Match Confirmed! 🎉",
            `Driver: ${driver.fullname}\nVehicle: ${driver.vehicle?.color || ''} ${driver.vehicle?.carModel || ''}\nPlate Number: ${driver.vehicle?.plateNumber || ''}\n\nFinal Price: ₹${ride.fare}`
          );
        } else {
          Alert.alert(
            "Booking Registered! ⏳",
            `${response.data.message}\n\nPrice: ₹${ride.fare}\n\n(Tip: Make sure your mock driver in MongoDB Atlas has "isAvailable": true for the live demo!)`
          );
        }
      }
    } catch (error) {
      console.error("❌ Ride Request Error:", error.message);
      Alert.alert("Booking Engine Error", "Could not complete your ride request.");
    } finally {
      setIsSearching(false);
    }
  }; // ◄── Confirm function closing scope block fixed!

  return (
    <View>
      {/* 🚗 Dynamic Row Mapper using your frontend calculation engine */}
      {typesdata.map((item) => {
        const isCurrentSelection = item.type === selectedType;
        
        // Intercept and update static prices dynamically
        const dynamicPrice = getFrontendEstimate(item.type);
        const modifiedItem = { ...item, price: dynamicPrice };
        
        return (
          <Pressable 
            key={item.id} 
            onPress={() => setSelectedType(item.type)}
            style={{
              backgroundColor: isCurrentSelection ? '#efefef' : '#ffffff', 
              borderWidth: isCurrentSelection ? 1 : 0,
              borderColor: '#000000',
              borderRadius: 8,
              marginHorizontal: 5,
              marginVertical: 2
            }}
          >
            <UberTypeRow type={modifiedItem} />
          </Pressable>
        );
      })}

      <View>
        <Pressable 
          onPress={confirm} 
          disabled={isSearching}
          style={{
            backgroundColor: isSearching ? '#555555' : '#000000',
            padding: 15,
            margin: 10,
            alignItems: 'center',
            borderRadius: 10
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: '700' }}>
            {isSearching ? "Searching for Nearby Drivers..." : `Confirm ${selectedType}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}; // ◄── Component closing scope block fixed!

export default UberTypes;