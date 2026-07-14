import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const DRIVER_SERVICES = [
  { id: '1', title: 'Vehicle Audit', icon: '🔍', tag: 'Check status', status: 'Compliant' },
  { id: '2', title: 'Fare Rates', icon: '💰', tag: 'Velo dynamic tiers', status: 'Active' },
  { id: '3', title: 'Driver Portal', icon: '🚖', tag: 'Support & docs', status: 'Updated' },
  { id: '4', title: 'Analytics', icon: '📈', tag: 'Trips & hours', status: 'Review' }
];

export default function DriverServicesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Title */}
        <Text style={styles.screenHeader}>Driver Services</Text>

        {/* Dynamic Rate Summary */}
        <View style={styles.rateSummary}>
          <Text style={styles.rateLabel}>Online Dynamic Multiplier</Text>
          <Text style={styles.rateValue}>1.0x - 1.5x Surge</Text>
        </View>

        {/* Services Grid Title */}
        <Text style={styles.sectionTitle}>Manage your vehicle & stats</Text>

        {/* Services Grid */}
        <View style={styles.gridContainer}>
          {DRIVER_SERVICES.map((service) => (
            <View key={service.id} style={styles.gridCard}>
              <View style={styles.iconCircle}>
                <Text style={styles.serviceIcon}>{service.icon}</Text>
              </View>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceTag}>{service.tag}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{service.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Promotion Banner */}
        <Text style={styles.sectionTitle}>Driver bonuses</Text>
        <View style={styles.promoBanner}>
          <View style={{ flex: 2 }}>
            <Text style={styles.promoTitle}>Complete 10 Trips</Text>
            <Text style={styles.promoDesc}>Earn an extra ₹500 bonus by completing 10 rides this week.</Text>
          </View>
          <View style={styles.promoIconContainer}>
            <Text style={{ fontSize: 44 }}>🎁</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  screenHeader: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  rateSummary: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  rateLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
    textTransform: 'uppercase',
  },
  rateValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2563EB',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  gridCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    width: (width - 52) / 2,
    alignItems: 'center',
  },
  iconCircle: {
    backgroundColor: '#FFFFFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  serviceIcon: {
    fontSize: 30,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  serviceTag: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '800',
  },
  promoBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  promoDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  promoIconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
