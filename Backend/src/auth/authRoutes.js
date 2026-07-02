const express = require('express');
const router = express.Router();
const axios = require('axios'); 
const User = require('../models/user'); 
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

module.exports = router;