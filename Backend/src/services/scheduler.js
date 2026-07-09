const mongoose = require('mongoose');
const Ride = require('../models/ride');

const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds
const DISPATCH_THRESHOLD_MINS = 5; // Dispatch if ride starts in next 5 minutes

function startRideScheduler(io) {
  console.log('⏰ [Scheduler Service] Background cron scheduler initialized.');

  setInterval(async () => {
    try {
      const now = new Date();
      // Calculate threshold: now + 5 minutes
      const dispatchThreshold = new Date(now.getTime() + DISPATCH_THRESHOLD_MINS * 60 * 1000);

      // Find rides that are 'SCHEDULED' and due to start within the threshold
      const dueRides = await Ride.find({
        status: 'SCHEDULED',
        scheduledTime: { $lte: dispatchThreshold }
      });

      if (dueRides.length === 0) return;

      console.log(`⏰ [Scheduler Service] Found ${dueRides.length} due scheduled ride(s) to dispatch!`);

      for (const ride of dueRides) {
        console.log(`⚡ [Scheduler Service] Dispatching Ride ID: ${ride._id}. Scheduled Time: ${ride.scheduledTime.toLocaleString()}`);

        // Update status to 'SEARCHING' to activate the matching loop
        ride.status = 'SEARCHING';
        await ride.save();

        if (io) {
          // 1. Notify Passenger App (via private room) that their scheduled ride is now searching
          console.log(`📡 [Scheduler Service] Alerting passenger room ride-room-${ride._id} of dispatch...`);
          io.to(`ride-room-${ride._id}`).emit(`ride-update-${ride._id}`, {
            status: 'SEARCHING',
            message: 'Your scheduled ride is now searching for nearby drivers!'
          });

          // 2. Alert all active drivers (via drivers-room stream) to match the booking
          console.log(`📡 [Scheduler Service] Broadcasting booking details to driver network...`);
          io.to('drivers-room').emit('incoming-ride-request', {
            rideId: ride._id,
            passengerId: ride.passengerId,
            pickup: ride.pickupLocation,
            dropoff: ride.dropoffLocation,
            fare: ride.fare,
            vehicleType: 'Velo Go' // default fallback tier
          });
        }
      }
    } catch (error) {
      console.error('❌ [Scheduler Service] Error executing background check:', error.message);
    }
  }, CHECK_INTERVAL_MS);
}

module.exports = { startRideScheduler };
