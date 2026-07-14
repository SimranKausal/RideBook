import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';

export default function DriverHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  
  // Driver dummy ID matching the baseline driver
  const driverId = "6a34d1819c65dd2c4eb29403";

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`http://4.240.25.27:5000/api/rides/trips/history/${driverId}`);
        if (response.data.success) {
          setTrips(response.data.trips);
        }
      } catch (error) {
        console.log('Error fetching driver history:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loaderText}>Loading your completed rides...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {trips.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You haven't completed any rides yet.</Text>
            </View>
          ) : (
            trips.map((trip) => (
              <View key={trip._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.fare}>Earnings: ₹{trip.fare}</Text>
                  <Text style={styles.date}>{new Date(trip.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.routeContainer}>
                  <Text style={styles.label}>📍 PICKUP</Text>
                  <Text style={styles.address}>{trip.pickupLocation?.address || 'Pickup'}</Text>
                  <View style={styles.line} />
                  <Text style={styles.label}>🏁 DROPOFF</Text>
                  <Text style={styles.address}>{trip.dropoffLocation?.address || 'Dropoff'}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  fare: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  date: {
    fontSize: 13,
    color: '#64748B',
  },
  routeContainer: {
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3B82F6',
  },
  address: {
    fontSize: 13,
    color: '#0F172A',
  },
  line: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
});
