import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SERVICES = [
  { id: '1', title: 'Bike', icon: '🏍️', tag: 'Fast & Solo', type: 'Velo Go' },
  { id: '2', title: 'Auto', icon: '🛺', tag: 'Eco Budget', type: 'Velo Go' },
  { id: '3', title: 'Velo Plus', icon: '🚗', tag: 'Premium Cab', type: 'Velo Plus' },
  { id: '4', title: 'Velo XL', icon: ' SUV', tag: 'Group Rides', type: 'Velo XL' }
];

export default function ServicesScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Title */}
        <Text style={styles.screenHeader}>Services</Text>

        {/* 🔍 Fake Search Bar */}
        <Pressable 
          onPress={() => navigation.navigate('Home')}
          style={styles.searchBar}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchText}>Where to?</Text>
        </Pressable>

        {/* Services Grid Title */}
        <Text style={styles.sectionTitle}>Go anywhere with Velo</Text>

        {/* Services Grid */}
        <View style={styles.gridContainer}>
          {SERVICES.map((service) => (
            <Pressable
              key={service.id}
              onPress={() => navigation.navigate('Home')}
              style={styles.gridCard}
            >
              <View style={styles.iconCircle}>
                <Text style={styles.serviceIcon}>{service.icon}</Text>
              </View>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceTag}>{service.tag}</Text>
            </Pressable>
          ))}
        </View>

        {/* Save Every Day Promotion Banner */}
        <Text style={styles.sectionTitle}>Special offers</Text>
        <View style={styles.promoBanner}>
          <View style={{ flex: 2 }}>
            <Text style={styles.promoTitle}>Velo Bike Discounts</Text>
            <Text style={styles.promoDesc}>Get up to ₹50 off on your first 3 bike rides this week.</Text>
            <Pressable style={styles.promoBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.promoBtnText}>Ride Now</Text>
            </Pressable>
          </View>
          <View style={styles.promoIconContainer}>
            <Text style={{ fontSize: 44 }}>⚡</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    color: '#64748B',
  },
  searchText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
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
    width: (width - 52) / 2, // Perfect side-by-side grid
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
    marginBottom: 14,
  },
  promoBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 12,
  },
  promoIconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
