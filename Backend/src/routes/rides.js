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

// 🚖 2. POST Route: Process booking request, compute dynamic fare, and broadcast via WebSockets
router.post('/request-ride', async (req, res) => {
  const { passengerId, pickupLocation, dropoffLocation, vehicleType } = req.body;

  console.log(`\n🚖 [Ride Engine] New request received from Passenger ID: ${passengerId}`);

  try {
    const pickupLat = pickupLocation?.latitude;
    const pickupLon = pickupLocation?.longitude;
    const dropoffLat = dropoffLocation?.latitude;
    const dropoffLon = dropoffLocation?.longitude;
    
    const selectedVehicle = vehicleType || 'Velo Go'; 

    // 🧠 Step A: Dynamic Distance & Fare Matrix Engine Calculation
    const distanceKm = calculateDistance(pickupLat, pickupLon, dropoffLat, dropoffLon);
    console.log(`📏 Calculated Trip Distance: ${distanceKm.toFixed(2)} km`);

    let ratePerKm = 15; 
    if (selectedVehicle === 'Velo Plus') ratePerKm = 22;
    if (selectedVehicle === 'Velo XL') ratePerKm = 30;

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

    // 🎯 Step C: Target Allocation & Real-Time Broadcast Layer
    const io = req.app.get('io');

    if (io) {
      console.log(`📡 [Socket Engine] Broadcasting incoming trip booking request to driver network streams...`);
      
      io.to('drivers-room').emit('incoming-ride-request', {
        rideId: newRide._id,
        passengerId: newRide.passengerId,
        pickup: newRide.pickupLocation,
        dropoff: newRide.dropoffLocation,
        fare: newRide.fare,
        vehicleType: selectedVehicle
      });
    }

    return res.status(200).json({
      success: true,
      message: `Ride request posted for ₹${computedFare}. Searching for available local drivers...`,
      ride: newRide
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

// 📊 3. GET/POST Route: Get fare estimates for all tiers before booking
router.post('/estimate-fares', (req, res) => {
  const { pickupLocation, dropoffLocation } = req.body;

  try {
    const pickupLat = pickupLocation?.latitude;
    const pickupLon = pickupLocation?.longitude;
    const dropoffLat = dropoffLocation?.latitude;
    const dropoffLon = dropoffLocation?.longitude;

    const distanceKm = calculateDistance(pickupLat, pickupLon, dropoffLat, dropoffLon);

    const estimates = {
      "Velo Go": Math.round(50 + (distanceKm * 15)),   
      "Velo Plus": Math.round(50 + (distanceKm * 22)), 
      "Velo XL": Math.round(50 + (distanceKm * 30))    
    };

    return res.status(200).json({
      success: true,
      distance: distanceKm,
      estimates
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 🚗 4. GET Route: Fetch all active, available drivers to display as idle cars on the map
router.get('/nearby-drivers', async (req, res) => {
  try {
    const activeDrivers = await Driver.find({ isAvailable: true });
    console.log(`📡 [Ride Engine] Fetched ${activeDrivers.length} active idle drivers for the map view.`);
    
    return res.status(200).json({
      success: true,
      drivers: activeDrivers
    });
  } catch (error) {
    console.error("❌ Error fetching nearby drivers:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch background vehicles.',
      error: error.message 
    });
  }
});

// 🚖 5. POST Route: Simulate a driver accepting the active ride via WebSockets
router.post('/accept-ride', async (req, res) => {
  const { rideId, driverId } = req.body;

  try {
    // 1. Find the ride request document
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });

    // 2. Find the mock driver profile
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    // 3. Update the state mapping rules
    ride.status = 'ACCEPTED';
    ride.driverId = driver._id;
    await ride.save();

    // 4. Temporarily flag driver status as unavailable on the map view
    driver.isAvailable = false;
    await driver.save();

    // 5. 🔥 NOTIFY CLIENT REAL-TIME FLOW VIA WEB-SOCKETS INSTANTLY
    const io = req.app.get('io');
    if (io) {
      console.log(`✨ [Socket Engine] Notifying passenger that Driver ${driver.fullname} accepted trip ${rideId}`);
      
      // Target the specific passenger channel streaming matching this ride ID code setup
      io.emit(`ride-update-${rideId}`, {
        status: 'ACCEPTED',
        driver: {
          fullname: driver.fullname,
          phone: driver.phone,
          vehicle: driver.vehicleDetails || {
            carModel: driver.vehicle?.carModel || "Maruti Suzuki Swift",
            plateNumber: driver.vehicle?.plateNumber || "DL 3C AY 4412",
            color: driver.vehicle?.color || "White"
          }
        }
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Simulation: Ride accepted successfully!", 
      ride 
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 🏁 6. POST Route: Complete the ride and notify passenger via WebSockets
router.post('/complete-ride', async (req, res) => {
  const { rideId, driverId } = req.body;
  console.log(`\n🏁 [Ride Engine] Completing ride ID: ${rideId} for Driver ID: ${driverId}`);

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

    ride.status = 'COMPLETED';
    await ride.save();

    driver.isAvailable = true;
    await driver.save();

    // 📡 Notify passenger app in real-time
    const io = req.app.get('io');
    if (io) {
      console.log(`✨ [Socket Engine] Notifying passenger that Ride ${rideId} is COMPLETED`);
      io.emit(`ride-update-${rideId}`, {
        status: 'COMPLETED',
        fare: ride.fare
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride completed successfully!",
      ride
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;