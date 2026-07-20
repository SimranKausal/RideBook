const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  fullname: { type: String, default: "" },
  phone: { type: String, required: true, unique: true },
  email: { type: String, default: "" },
  vehicleDetails: {
    carModel: { type: String, default: "" },
    plateNumber: { type: String, default: "" },
    color: { type: String, default: "" }
  },
  currentLocation: {
    latitude: { type: Number, default: 28.6448 },  // Defaults near Daryaganj/Delhi
    longitude: { type: Number, default: 77.2403 }
  },
  isAvailable: { type: Boolean, default: true },     // Toggle for matching engine
  profilePhoto: { type: String, default: "avatar_1" }, // Selected driver avatar
  upiId: { type: String, default: "driverpay@paytm" }, // Payout UPI ID VPA
  rating: { type: Number, default: 5.0 },              // Average star rating
  ratingCount: { type: Number, default: 0 }           // Total ratings submitted
}, { timestamps: true });

module.exports = mongoose.models.Driver || mongoose.model('Driver', DriverSchema);