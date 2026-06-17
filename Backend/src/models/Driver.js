const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  vehicleDetails: {
    carModel: { type: String, required: true },    // e.g., "Suzuki WagonR"
    plateNumber: { type: String, required: true }, // e.g., "DL 1C XX 1234"
    color: { type: String, required: true }
  },
  currentLocation: {
    latitude: { type: Number, default: 28.6448 },  // Defaults near Daryaganj/Delhi
    longitude: { type: Number, default: 77.2403 }
  },
  isAvailable: { type: Boolean, default: true }     // Toggle for matching engine
}, { timestamps: true });

module.exports = mongoose.model('Driver', DriverSchema);