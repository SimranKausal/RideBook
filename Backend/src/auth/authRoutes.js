const express = require('express');
const router = express.Router();
const axios = require('axios'); 
const User = require('../models/user'); 
const Driver = require('../models/Driver');
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY; 

// POST Route to send OTP

router.post('/send-otp', async (req, res) => {
  const { phoneNumber } = req.body; 
  console.log(`\n📲 [Send OTP] Incoming request for: ${phoneNumber}`);


  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${FIREBASE_API_KEY}`,
      { phoneNumber }
    );

    const sessionInfo = response.data.sessionInfo;
    console.log(`✅ [Send OTP] Firebase generated sessionInfo successfully.`);

    return res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully!', 
      sessionInfo 
    });
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    console.error(`❌ [Send OTP] Failed:`, errorMsg);
    return res.status(500).json({ 
      success: false, 
      error: errorMsg 
    });
  }
});

// POST Route to verify OTP
// POST Route to verify OTP
router.post('/verify-otp', async (req, res) => {
  const { sessionInfo, code, phoneNumber } = req.body;
  console.log(`\n🔑 [Verify OTP] Verifying code: ${code} for phone: ${phoneNumber}`);

  try {
    // Verify the code using Firebase REST API
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${FIREBASE_API_KEY}`,
      { sessionInfo, code }
    );

    const { localId, idToken } = response.data;
    console.log(`✨ [Verify OTP] Firebase authenticated! UID: ${localId}`);

    // Check if the user already exists in your MongoDB database using 'phone'
    let user = await User.findOne({ phone: phoneNumber });

    if (!user) {
      console.log(`👤 [Database] User not found. Creating new profile...`);
      
      // Only providing fields your schema strictly expects
      user = new User({
        firebaseUid: localId, 
        phone: phoneNumber    
      });
      
      await user.save();
      console.log(`💾 [Database] New user saved successfully with ID: ${user._id}`);
    } else {
      console.log(`👋 [Database] Existing user found with ID: ${user._id}`);
    }

    // ==========================================
    // ✅ FIX: ADD THE CONDITIONAL PROFILE CHECK HERE
    // ==========================================
    // Returns true ONLY if both strings exist and are not empty values
    const isProfileComplete = !!(user.fullname && user.email);
    console.log(`📋 [Profile Check Calculation] Is profile setup complete? -> ${isProfileComplete}`);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      userId: user._id,
      isProfileComplete: isProfileComplete, // 🔥 Send this crucial flag to the frontend!
      token: idToken 
    });

  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error(`❌ [Verify OTP] Authentication Failed:`, errorMessage);
    
    return res.status(400).json({ 
      success: false, 
      message: 'Verification failed', 
      error: errorMessage 
    });
  }
});

// PUT Route to complete user profile details
router.put('/update-profile', async (req, res) => {
  const { userId, fullname, email } = req.body;
  console.log(`\n👤 [Profile Update] Updating details for User ID: ${userId}`);

  // Quick validation check
  if (!userId || !fullname || !email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: userId, fullname, or email.' 
    });
  }

  try {
    // Find the user by MongoDB _id and update their information
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        fullname: fullname, 
        email: email 
      },
      { new: true } // This flag tells Mongoose to return the newly updated document
    );

    if (!updatedUser) {
      console.error(`❌ [Profile Update] User not found in database.`);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    console.log(`💾 [Database] Profile updated successfully for ${updatedUser.fullname}`);
    return res.status(200).json({
      success: true,
      message: 'Profile completed successfully!',
      user: updatedUser
    });

  } catch (error) {
    console.error(`❌ [Profile Update] Failed:`, error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error updating profile.', 
      error: error.message 
    });
  }
});

// GET Route to fetch user profile details dynamically
router.get('/profile/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({
      success: true,
      user: {
        fullname: user.fullname,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error(`❌ [Profile Fetch] Failed:`, error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
});

// ==========================================
// 🚖 DRIVER ENDPOINTS
// ==========================================

// 1. POST Route to verify Driver OTP
router.post('/driver/verify-otp', async (req, res) => {
  const { sessionInfo, code, phoneNumber } = req.body;
  console.log(`\n🔑 [Driver Verify OTP] Verifying code: ${code} for phone: ${phoneNumber}`);

  try {
    // Verify the code using Firebase REST API
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${FIREBASE_API_KEY}`,
      { sessionInfo, code }
    );

    const { localId, idToken } = response.data;
    console.log(`✨ [Driver Verify OTP] Firebase authenticated! UID: ${localId}`);

    // Check if the driver exists in MongoDB using 'phone'
    let driver = await Driver.findOne({ phone: phoneNumber });

    if (!driver) {
      console.log(`👤 [Database] Driver not found. Creating new driver profile...`);
      driver = new Driver({
        phone: phoneNumber,
        fullname: '', // Empty until profile complete
        email: '',
        vehicleDetails: {
          carModel: '',
          plateNumber: '',
          color: ''
        }
      });
      await driver.save();
      console.log(`💾 [Database] New driver saved successfully with ID: ${driver._id}`);
    } else {
      console.log(`👋 [Database] Existing driver found with ID: ${driver._id}`);
    }

    // Check if profile is complete (needs fullname, email, and carModel)
    const isProfileComplete = !!(driver.fullname && driver.email && driver.vehicleDetails?.carModel);
    console.log(`📋 [Profile Check] Is driver setup complete? -> ${isProfileComplete}`);

    return res.status(200).json({
      success: true,
      message: 'Driver authentication successful',
      driverId: driver._id,
      isProfileComplete: isProfileComplete,
      token: idToken
    });

  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error(`❌ [Driver Verify OTP] Authentication Failed:`, errorMessage);
    return res.status(400).json({
      success: false,
      message: 'Verification failed',
      error: errorMessage
    });
  }
});

// 2. PUT Route to update Driver profile details
router.put('/driver/update-profile', async (req, res) => {
  const { driverId, fullname, email, vehicleDetails, profilePhoto } = req.body;
  console.log(`\n👤 [Driver Profile Update] Updating details for Driver ID: ${driverId}`);

  if (!driverId || !fullname || !email || !vehicleDetails) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: driverId, fullname, email, or vehicleDetails.'
    });
  }

  try {
    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      {
        fullname,
        email,
        vehicleDetails,
        profilePhoto: profilePhoto || "avatar_1"
      },
      { new: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    console.log(`💾 [Database] Driver profile updated for ${updatedDriver.fullname}`);
    return res.status(200).json({
      success: true,
      message: 'Driver profile completed successfully!',
      driver: updatedDriver
    });

  } catch (error) {
    console.error(`❌ [Driver Profile Update] Failed:`, error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error updating driver profile.',
      error: error.message
    });
  }
});

// 3. PUT Route to update Driver location and availability
router.put('/driver/update-location', async (req, res) => {
  const { driverId, latitude, longitude, isAvailable } = req.body;
  console.log(`\n📍 [Driver Location Update] Updating location for Driver ID: ${driverId}`);

  if (!driverId) {
    return res.status(400).json({ success: false, message: 'Missing driverId.' });
  }

  try {
    const updateData = {};
    if (latitude !== undefined && longitude !== undefined) {
      updateData.currentLocation = { latitude, longitude };
    }
    if (isAvailable !== undefined) {
      updateData.isAvailable = isAvailable;
    }

    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      updateData,
      { new: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    // 📡 Live ETA & Distance Broadcast Layer
    if (latitude !== undefined && longitude !== undefined) {
      const Ride = mongoose.model('Ride');
      const activeRide = await Ride.findOne({
        driverId: driverId,
        status: { $in: ['ACCEPTED', 'ON_TRIP'] }
      });

      if (activeRide) {
        const pickupLat = activeRide.pickupLocation.latitude;
        const pickupLon = activeRide.pickupLocation.longitude;
        
        // Haversine calculation
        const R = 6371; // earth radius in km
        const dLat = (pickupLat - latitude) * Math.PI / 180;
        const dLon = (pickupLon - longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(latitude * Math.PI / 180) * Math.cos(pickupLat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; 
        const eta = Math.max(1, Math.round((distance / 30) * 60)); // 30 km/h speed assumption

        const io = req.app.get('io');
        if (io) {
          console.log(`📡 [Live Tracking] Relaying live ETA: ${distance.toFixed(1)} km, ${eta} mins to Ride: ${activeRide._id}`);
          io.emit(`ride-update-${activeRide._id}`, {
            status: activeRide.status,
            etaUpdate: {
              distance: parseFloat(distance.toFixed(1)),
              eta: eta,
              driverLocation: { latitude, longitude }
            }
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Location and status updated successfully!',
      driver: updatedDriver
    });

  } catch (error) {
    console.error(`❌ [Driver Location Update] Failed:`, error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error updating location.',
      error: error.message
    });
  }
});

// GET Route to fetch driver profile details dynamically
router.get('/driver/profile/:driverId', async (req, res) => {
  const { driverId } = req.params;
  try {
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }
    return res.status(200).json({
      success: true,
      driver: {
        fullname: driver.fullname,
        email: driver.email,
        phone: driver.phone,
        vehicleDetails: driver.vehicleDetails,
        rating: driver.rating || 4.88
      }
    });
  } catch (error) {
    console.error(`❌ [Driver Profile Fetch] Failed:`, error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching driver profile.' });
  }
});

module.exports = router;