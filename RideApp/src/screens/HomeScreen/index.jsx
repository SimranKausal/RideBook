import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import HomeMap from '../../components/HomeMap/index';
import HomeSearch from "../../components/HomeSearch";
import { useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';

const HomeScreen = () => {
  const navigation = useNavigation();

  const handleSavedPlaceShortcut = (placeType) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const originPlace = {
          data: { description: 'Current Location' },
          details: {
            geometry: {
              location: {
                lat: latitude,
                lng: longitude
              }
            }
          }
        };

        let destinationPlace = null;
        if (placeType === 'home') {
          destinationPlace = {
            data: { description: 'Home (Connaught Place)' },
            details: {
              geometry: {
                location: { lat: 28.6304, lng: 77.2177 }
              }
            }
          };
        } else {
          destinationPlace = {
            data: { description: 'Work (DLF Cyber City)' },
            details: {
              geometry: {
                location: { lat: 28.4952, lng: 77.0878 }
              }
            }
          };
        }

        // Navigate directly to estimates panel in SearchResults screen
        navigation.navigate('SearchResults', {
          originPlace,
          destinationPlace
        });
      },
      (error) => {
        Alert.alert("Location Error ❌", "Could not fetch current coordinates to start booking.");
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
  };

  return (
    <View style={styles.container}>
      
      {/* Floating Top Address Bar (Rapido style) */}
      <View style={styles.floatingAddressContainer}>
        <View style={styles.addressCapsule}>
          <View style={styles.greenDot} />
          <Text style={styles.addressText} numberOfLines={1}>
            Block-C, Sector 2, Noida, Uttar Pradesh
          </Text>
        </View>
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <HomeMap />
        
        {/* Floating Center Pin (Rapido style) */}
        <View style={styles.floatingCenterPin} pointerEvents="none">
          <View style={styles.pinBubble}>
            <Text style={styles.pinBubbleText}>Pickup Point</Text>
          </View>
          <View style={styles.pinPointerStem} />
          <View style={styles.pinTargetDot} />
        </View>
      </View>

      {/* Floating Saved Places Shortcuts Column */}
      <View style={styles.shortcutsColumn}>
        <TouchableOpacity 
          style={styles.shortcutCircle} 
          onPress={() => handleSavedPlaceShortcut('home')}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18 }}>🏠</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.shortcutCircle} 
          onPress={() => handleSavedPlaceShortcut('work')}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18 }}>💼</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Re-center Target Button */}
      <TouchableOpacity style={styles.recenterButton} activeOpacity={0.7}>
        <Text style={styles.recenterIcon}>🎯</Text>
      </TouchableOpacity>

      {/* Bottom Search Drawer */}
      <HomeSearch />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  floatingAddressContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  addressCapsule: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 10,
  },
  addressText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
  },
  floatingCenterPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -60, // Half of width (120/2)
    marginTop: -55,  // Offset height of bubble + stem
    alignItems: 'center',
    width: 120,
  },
  pinBubble: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  pinBubbleText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  pinPointerStem: {
    width: 2,
    height: 8,
    backgroundColor: '#10B981',
  },
  pinTargetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  shortcutsColumn: {
    position: 'absolute',
    bottom: 335, // Positioned exactly above the recenter button
    right: 20,
    gap: 10,
    zIndex: 5,
  },
  shortcutCircle: {
    backgroundColor: '#FFFFFF',
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 275, // Floats exactly above the bottom sheet height
    right: 20,
    backgroundColor: '#FFFFFF',
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 5,
  },
  recenterIcon: {
    fontSize: 20,
  },
});

export default HomeScreen;