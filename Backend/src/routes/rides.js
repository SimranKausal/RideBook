const express = require('express');
const router = express.Router();
const Ride = require('../models/ride'); // Matches your lowercase 'ride.js' file
const Driver = require('../models/Driver'); 

// 📐 1. Haversine Formula: Calculates straight-line distance in Kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 2.5; // Default fallback to 2.5km if GPS fails
    
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; 
    return distance;
}

// 🚖 2. POST Route: Process booking request, compute dynamic fare, and allocate driver
router.post('/request-ride', async (req, res) => {
  // Destructure incoming data safely
  const { passengerId, pickupLocation, dropoffLocation, vehicleType } = req.body;

  console.log(`\n🚖 [Ride Engine] New request received from Passenger ID: ${passengerId}`);

  try {
    // Safety check: Ensure structural coordinates exist so the app doesn't throw 'undefined'
    const pickupLat = pickupLocation?.latitude;
    const pickupLon = pickupLocation?.longitude;
    const dropoffLat = dropoffLocation?.latitude;
    const dropoffLon = dropoffLocation?.longitude;
    
    // Fallback default choice if vehicleType is missing from the payload
    const selectedVehicle = vehicleType || 'Velo Go'; 

    // 🧠 Step A: Dynamic Distance & Fare Matrix Engine Calculation
    const distanceKm = calculateDistance(pickupLat, pickupLon, dropoffLat, dropoffLon);
    console.log(`📏 Calculated Trip Distance: ${distanceKm.toFixed(2)} km`);

    let ratePerKm = 15; // Base price rate per km for Velo Go
    if (selectedVehicle === 'Velo Plus') ratePerKm = 22;
    if (selectedVehicle === 'Velo XL') ratePerKm = 30;

    // Base Booking Charge (e.g., 50 INR) + Distance pricing cost
    const computedFare = Math.round(50 + (distanceKm * ratePerKm));
    console.log(`💰 Dynamic Fare Generated: ₹${computedFare} for tier [${selectedVehicle}]`);

    // 📝 Step B: Instantiate and register the Ride Entry into MongoDB Atlas
    const newRide = new Ride({
      passengerId,
      pickupLocation: {
        address: pickupLocation?.address || "Unknown Location",
        latitude: pickupLat || 28.6448,
        longitude: pickupLon || 77.2403
      },
      dropoffLocation: {
        address: dropoffLocation?.address || "Unknown Destination",
        latitude: dropoffLat || 28.6304,
        longitude: dropoffLon || 77.2177
      },
      fare: computedFare,
      status: 'SEARCHING'
    });

    await newRide.save();
    console.log(`💾 [Database] Saved pending ride with ID: ${newRide._id}`);

    // 🎯 Step C: Target Allocation Matching Engine
    // Looks for a driver that is online/available
    const availableDriver = await Driver.findOne({ isAvailable: true });

    if (!availableDriver) {
      console.log(`⚠️ [Ride Engine] No drivers available in the area right now.`);
      return res.status(200).json({
        success: true,
        message: `Ride booked for ₹${computedFare}. Searching for online drivers...`,
        ride: newRide
      });
    }

    // 🔗 Step D: Handshake Lifecycle - Bind Passenger Trip to Available Driver
    newRide.driverId = availableDriver._id;
    newRide.status = 'ACCEPTED';
    await newRide.save();

    // Toggle driver state to false so they don't look available to other bookings
    availableDriver.isAvailable = false;
    await availableDriver.save();

    console.log(`✨ [Ride Engine] Trip ${newRide._id} matched with Driver: ${availableDriver.fullname}`);

    // 📲 Step E: Send success payload with real computed parameters back to client UI
    return res.status(200).json({
      success: true,
      message: 'Driver found and matched successfully!',
      ride: newRide,
      driver: {
        fullname: availableDriver.fullname,
        phone: availableDriver.phone,
        vehicle: availableDriver.vehicleDetails
      }
    });

  } catch (error) {
    console.error(`❌ [Ride Engine Fatal Crash]:`, error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error processing trip requests.',
      error: error.message 
    });
  }
});

module.exports = router;