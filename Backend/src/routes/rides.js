const express = require('express');
const router = express.Router();
const Ride = require('../models/ride'); // Matches your lowercase 'ride.js' file
const Driver = require('../models/Driver'); 
const { sendPushNotification } = require('../services/notificationService'); 

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
  const { passengerId, pickupLocation, dropoffLocation, vehicleType, scheduledTime } = req.body;

  const isScheduled = !!scheduledTime;
  console.log(`\n🚖 [Ride Engine] New request received from Passenger ID: ${passengerId} (Scheduled: ${isScheduled})`);

  try {
    const pickupLat = pickupLocation?.latitude;
    const pickupLon = pickupLocation?.longitude;
    const dropoffLat = dropoffLocation?.latitude;
    const dropoffLon = dropoffLocation?.longitude;
    
    const stopLat = req.body.stopLocation?.latitude || req.body.stopLocation?.details?.geometry?.location?.lat;
    const stopLon = req.body.stopLocation?.longitude || req.body.stopLocation?.details?.geometry?.location?.lng;
    
    const selectedVehicle = vehicleType || 'Velo Go'; 

    // 🧠 Step A: Dynamic Distance & Fare Matrix Engine Calculation
    let distanceKm = 0;
    if (stopLat && stopLon) {
      distanceKm = calculateDistance(pickupLat, pickupLon, stopLat, stopLon) +
                   calculateDistance(stopLat, stopLon, dropoffLat, dropoffLon);
      console.log(`📏 Calculated Trip Distance with Stop: ${distanceKm.toFixed(2)} km`);
    } else {
      distanceKm = calculateDistance(pickupLat, pickupLon, dropoffLat, dropoffLon);
      console.log(`📏 Calculated Trip Distance: ${distanceKm.toFixed(2)} km`);
    }

    let ratePerKm = 15; 
    if (selectedVehicle === 'Velo Plus') ratePerKm = 22;
    if (selectedVehicle === 'Velo XL') ratePerKm = 30;

    // ⚡ Calculate Surge Multiplier (Peak Hours or Weather)
    let surgeMultiplier = 1.0;
    const utcHour = new Date().getUTCHours();
    const indiaHour = (utcHour + 5.5) % 24; // India local hour (UTC + 5:30)
    
    if (indiaHour >= 17 && indiaHour <= 20) {
      surgeMultiplier = 1.3; // 1.3x during 5pm to 8pm
      console.log(`⚡ [Surge Engine] Peak Hours Surge Active (1.3x)`);
    }
    
    if (req.body.weather === 'rain') {
      surgeMultiplier = 1.5; // 1.5x during rain
      console.log(`🌧️ [Surge Engine] Weather Rain Surge Active (1.5x)`);
    }

    const computedFare = Math.round((50 + (distanceKm * ratePerKm)) * surgeMultiplier);
    console.log(`💰 Dynamic Fare Generated: ₹${computedFare} for tier [${selectedVehicle}]`);

    // Securely apply promo discount on server-side if provided
    let finalFare = computedFare;
    let discountAmount = 0;
    if (req.body.promoCode) {
      const code = req.body.promoCode.toUpperCase().trim();
      const promoDict = {
        'VELO50': { type: 'percent', value: 0.50 },
        'SAVE100': { type: 'flat', value: 100 },
        'WELCOME20': { type: 'percent', value: 0.20 }
      };
      if (promoDict[code]) {
        const promo = promoDict[code];
        if (promo.type === 'percent') {
          discountAmount = Math.round(computedFare * promo.value);
        } else if (promo.type === 'flat') {
          discountAmount = Math.min(computedFare, promo.value);
        }
        finalFare = Math.max(50, computedFare - discountAmount);
        console.log(`🎟️ [Promo Engine] Applied Code: ${code}. Fare reduced from ₹${computedFare} to ₹${finalFare}`);
      }
    }

    // Generate a random 4-digit start OTP
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();

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
      fare: finalFare,
      status: isScheduled ? 'SCHEDULED' : 'SEARCHING',
      scheduledTime: isScheduled ? new Date(scheduledTime) : null,
      startOtp: randomOtp,
      paymentMethod: req.body.paymentMethod || 'CASH',
      paymentStatus: req.body.paymentStatus || 'PENDING',
      razorpayOrderId: req.body.razorpayOrderId || null,
      razorpayPaymentId: req.body.razorpayPaymentId || null
    });

    await newRide.save();
    console.log(`💾 [Database] Saved ride with ID: ${newRide._id} (Status: ${newRide.status})`);

    // 🎯 Step C: Target Allocation & Real-Time Broadcast Layer
    const io = req.app.get('io');

    if (!isScheduled && io) {
      console.log(`📡 [Socket Engine] Broadcasting incoming trip booking request to driver network streams...`);
      
      io.to('drivers-room').emit('incoming-ride-request', {
        rideId: newRide._id,
        passengerId: newRide.passengerId,
        pickup: newRide.pickupLocation,
        dropoff: newRide.dropoffLocation,
        fare: newRide.fare,
        vehicleType: selectedVehicle,
        paymentMethod: newRide.paymentMethod
      });
    }

    return res.status(200).json({
      success: true,
      message: isScheduled 
        ? `Ride scheduled successfully for ${new Date(scheduledTime).toLocaleString()}.`
        : `Ride request posted for ₹${computedFare}. Searching for available local drivers...`,
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
  const { pickupLocation, dropoffLocation, weather } = req.body;

  try {
    const pickupLat = pickupLocation?.latitude;
    const pickupLon = pickupLocation?.longitude;
    const dropoffLat = dropoffLocation?.latitude;
    const dropoffLon = dropoffLocation?.longitude;

    const distanceKm = calculateDistance(pickupLat, pickupLon, dropoffLat, dropoffLon);

    // ⚡ Calculate Surge Multiplier
    let surgeMultiplier = 1.0;
    const utcHour = new Date().getUTCHours();
    const indiaHour = (utcHour + 5.5) % 24; // India local hour (UTC + 5:30)
    
    if (indiaHour >= 17 && indiaHour <= 20) {
      surgeMultiplier = 1.3;
    }
    if (weather === 'rain') {
      surgeMultiplier = 1.5;
    }

    const estimates = {
      "Velo Go": Math.round((50 + (distanceKm * 15)) * surgeMultiplier),   
      "Velo Plus": Math.round((50 + (distanceKm * 22)) * surgeMultiplier), 
      "Velo XL": Math.round((50 + (distanceKm * 30)) * surgeMultiplier)    
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

// 🎟️ Promo Validation Route
router.post('/validate-promo', (req, res) => {
  const { promoCode, fare } = req.body;
  if (!promoCode || !fare) {
    return res.status(400).json({ success: false, message: 'Missing promoCode or fare parameters.' });
  }

  const code = promoCode.toUpperCase().trim();
  
  const promoDict = {
    'VELO50': { type: 'percent', value: 0.50, desc: '50% off your ride' },
    'SAVE100': { type: 'flat', value: 100, desc: 'Flat ₹100 off' },
    'WELCOME20': { type: 'percent', value: 0.20, desc: '20% off your first ride' }
  };

  if (promoDict[code]) {
    const promo = promoDict[code];
    let discountAmount = 0;
    if (promo.type === 'percent') {
      discountAmount = Math.round(fare * promo.value);
    } else if (promo.type === 'flat') {
      discountAmount = Math.min(fare, promo.value);
    }
    
    const finalFare = Math.max(50, fare - discountAmount); // Minimum fare limit of ₹50
    
    return res.status(200).json({
      success: true,
      discountAmount,
      finalFare,
      description: promo.desc
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid Promo Code ❌'
    });
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

    // 📱 Dispatch push notification to passenger
    sendPushNotification(
      ride.passengerId, 
      "Ride Confirmed! 🚖", 
      `Your Velo ride has been accepted by ${driver.fullname}.`
    );

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

    // 📱 Dispatch push notification to passenger
    sendPushNotification(
      ride.passengerId, 
      "Trip Completed! 🎉", 
      "Thank you for riding with Velo. Tap to rate your trip."
    );

    return res.status(200).json({
      success: true,
      message: "Ride completed successfully!",
      ride
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 🚖 7. POST Route: Start a ride by verifying OTP
router.post('/start-ride', async (req, res) => {
  const { rideId, otp } = req.body;
  console.log(`🔑 [Start Ride] Verifying start OTP: ${otp} for Ride ID: ${rideId}`);

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });

    if (ride.startOtp !== otp) {
      console.log(`❌ [Start Ride] Mismatched OTP. Got ${otp}, expected ${ride.startOtp}`);
      return res.status(400).json({ success: false, message: "Invalid Start OTP. Please check passenger screen." });
    }

    ride.status = 'ON_TRIP';
    await ride.save();

    // Notify passenger app in real-time
    const io = req.app.get('io');
    if (io) {
      console.log(`✨ [Socket Engine] Notifying passenger that Ride ${rideId} is ON_TRIP`);
      io.emit(`ride-update-${rideId}`, {
        status: 'ON_TRIP'
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride started successfully! Proceed to destination.",
      ride
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ❌ 8. POST Route: Cancel an active ride request or booking
router.post('/cancel-ride', async (req, res) => {
  const { rideId, canceller } = req.body;
  console.log(`❌ [Ride Engine] Cancellation request for Ride ID: ${rideId} by: ${canceller}`);

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });

    ride.status = 'CANCELLED';
    await ride.save();

    // If a driver accepted it, make them available again
    if (ride.driverId) {
      await Driver.findByIdAndUpdate(ride.driverId, { isAvailable: true });
    }

    // Broadcast cancellation to socket listeners
    const io = req.app.get('io');
    if (io) {
      console.log(`✨ [Socket Engine] Notifying passengers & drivers that Ride ${rideId} is CANCELLED`);
      io.emit(`ride-update-${rideId}`, {
        status: 'CANCELLED'
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ride cancelled successfully.",
      ride
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 📊 9. GET Route: Fetch past trip history for a driver or passenger
router.get('/trips/history/:id', async (req, res) => {
  const entityId = req.params.id;
  console.log(`📊 [Ride Engine] Fetching trip history for Entity ID: ${entityId}`);

  try {
    const trips = await Ride.find({
      $or: [
        { passengerId: entityId },
        { driverId: entityId }
      ],
      status: 'COMPLETED'
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      trips
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ⭐️ 10. POST Route: Submit passenger rating for a completed ride and update Driver aggregate rating
router.post('/rate-driver', async (req, res) => {
  const { rideId, rating } = req.body;
  if (!rideId || !rating) {
    return res.status(400).json({ success: false, message: 'Missing rideId or rating parameters.' });
  }

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found.' });
    }

    if (!ride.driverId) {
      return res.status(400).json({ success: false, message: 'No driver associated with this ride.' });
    }

    // Update Driver aggregate rating
    const driver = await Driver.findById(ride.driverId);
    if (driver) {
      const oldCount = driver.ratingCount || 0;
      const oldRating = driver.rating || 5.0;
      
      const newCount = oldCount + 1;
      const newRating = parseFloat((((oldRating * oldCount) + parseFloat(rating)) / newCount).toFixed(1));
      
      driver.rating = newRating;
      driver.ratingCount = newCount;
      await driver.save();
      
      console.log(`⭐️ [Rating Engine] Rated Driver: ${driver.fullname}. New rating: ${newRating} (${newCount} reviews)`);
    }

    return res.status(200).json({
      success: true,
      message: 'Rating logged successfully.'
    });
  } catch (error) {
    console.error("❌ Rating Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;