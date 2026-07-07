const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver', // We will create this model next
    default: null   // Null until a driver accepts the ride
  },
  pickupLocation: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  dropoffLocation: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  fare: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['SEARCHING', 'ACCEPTED', 'ON_TRIP', 'COMPLETED', 'CANCELLED'],
    default: 'SEARCHING'
  },
  startOtp: {
    type: String,
    default: ""
  },
  messages: [{
    senderId: { type: String },
    text: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Ride', RideSchema);