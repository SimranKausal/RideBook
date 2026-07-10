const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Ride = require('../models/ride');

// Initialize Razorpay client.
// Credentials will load from process.env, with standard test mode fallbacks for sandbox testing
const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_5V6lE4fGeocvrF';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'gP7S8ecovrFGGSwA4LWTbspE';

const razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET
});

// 💳 1. POST Route: Initialize order with Razorpay
router.post('/create-order', async (req, res) => {
  const { amount } = req.body;
  if (!amount) {
    return res.status(400).json({ success: false, message: 'Missing amount parameter.' });
  }

  // Razorpay works in paise (1 Rupee = 100 paise)
  const options = {
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: `receipt_${Date.now()}`
  };

  try {
    const order = await razorpay.orders.create(options);
    console.log(`💳 [Razorpay Engine] Generated Order ID: ${order.id} for ₹${amount}`);
    
    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: KEY_ID
    });
  } catch (error) {
    console.error("❌ Razorpay Order Creation Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 🛡️ 2. POST Route: Verify payment cryptographic signatures
router.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, rideId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Missing signature verification parameters.' });
  }

  try {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
      console.log(`✅ [Razorpay Engine] Cryptographic signature matched. Payment Verified: ${razorpay_payment_id}`);
      
      // Update Ride entry status in MongoDB
      if (rideId) {
        const ride = await Ride.findById(rideId);
        if (ride) {
          ride.paymentStatus = 'PAID';
          ride.paymentMethod = 'ONLINE';
          ride.razorpayOrderId = razorpay_order_id;
          ride.razorpayPaymentId = razorpay_payment_id;
          await ride.save();
          
          console.log(`📝 [Ride Engine] Ride ID: ${rideId} updated to paymentStatus: PAID`);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Payment verified and logged successfully.'
      });
    } else {
      console.log("❌ [Razorpay Engine] Cryptographic signature mismatch!");
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }
  } catch (error) {
    console.error("❌ Razorpay Verification Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
