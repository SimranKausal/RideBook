import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Alert } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import PlaceRow from "./PlaceRow";

// ✅ CRITICAL: Required for GooglePlacesAutocomplete to access location services
navigator.geolocation = require('@react-native-community/geolocation');

// Realistic coordinates centered in New Delhi / Gurugram
const homePlace = {
  description: 'Home',
  geometry: { location: { lat: 28.6304, lng: 77.2177 } },
};
const workPlace = {
  description: 'Work',
  geometry: { location: { lat: 28.4952, lng: 77.0878 } },
};

const savedPlaces = [
  { id: '1', icon: '🏠', title: 'Home', address: 'Connaught Place, New Delhi', latitude: 28.6304, longitude: 77.2177 },
  { id: '2', icon: '💼', title: 'Work', address: 'DLF Cyber City, Gurugram', latitude: 28.4952, longitude: 77.0878 },
];

const DestinationSearch = () => {
  const [originPlace, setOriginPlace] = useState(null);
  const [destinationPlace, setDestinationPlace] = useState(null);
  const [activeInput, setActiveInput] = useState('origin'); // origin, stop, or destination
  const [stopPlace, setStopPlace] = useState(null);
  const [showStopInput, setShowStopInput] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setCurrentCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => console.log('Location fetch error for autocomplete bias:', error.message),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
  }, []);
  
  const originRef = useRef(null);
  const stopRef = useRef(null);
  const destinationRef = useRef(null);
  const navigation = useNavigation();

  // Queries GPS and autofills origin input
  const handleGetCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const place = {
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
        setOriginPlace(place);
        originRef.current?.setAddressText('Current Location');
        destinationRef.current?.focus();
        setActiveInput('destination');
      },
      (error) => {
        Alert.alert("Location Error ❌", "Could not fetch your current location. Please verify location services are enabled.");
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Handles clicking Home or Work saved places list row
  const handleSelectSavedPlace = (place) => {
    const formattedPlace = {
      data: { description: place.address },
      details: {
        geometry: {
          location: {
            lat: place.latitude,
            lng: place.longitude
          }
        }
      }
    };
    
    if (activeInput === 'origin') {
      setOriginPlace(formattedPlace);
      originRef.current?.setAddressText(place.title);
      if (showStopInput) {
        stopRef.current?.focus();
        setActiveInput('stop');
      } else {
        destinationRef.current?.focus();
        setActiveInput('destination');
      }
    } else if (activeInput === 'stop') {
      setStopPlace(formattedPlace);
      stopRef.current?.setAddressText(place.title);
      destinationRef.current?.focus();
      setActiveInput('destination');
    } else {
      setDestinationPlace(formattedPlace);
      destinationRef.current?.setAddressText(place.title);
    }
  };
    
  useEffect(() => {
    if (originPlace && destinationPlace) {
      navigation.navigate('SearchResults', {
        originPlace,
        destinationPlace,
        stopPlace
      });
    }
  }, [originPlace, destinationPlace]);

  return (
    <SafeAreaView style={localStyles.container}>
      {/* 1. Sleek Top Header Card */}
      <View style={localStyles.headerCard}>
        
        {/* Back Arrow Button */}
        <TouchableOpacity 
          style={localStyles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={localStyles.backArrowIcon}>←</Text>
        </TouchableOpacity>

        {/* Search Grid */}
        <View style={localStyles.searchGrid}>
          
          {/* Left Decorative Track */}
          <View style={localStyles.leftTrack}>
            <View style={localStyles.originDot} />
            <View style={localStyles.connectingLine} />
            <View style={localStyles.destinationSquare} />
          </View>

          {/* Autocomplete Input Container */}
          <View style={localStyles.inputsContainer}>
            
            {/* Input 1: WHERE FROM (Z-Index focus wrapper) */}
            <View style={{ zIndex: activeInput === 'origin' ? 100 : 1, position: 'relative' }}>
              <GooglePlacesAutocomplete
                ref={originRef}
                placeholder='Where from?'
                onPress={(data, details = null) => {
                  setOriginPlace({ data, details });
                  destinationRef.current?.focus();
                  setActiveInput('destination');
                }}
                enablePoweredByContainer={false}
                userLocation={true}
                currentLocation={true}
                currentLocationLabel='Current Location'
                minLength={2}
                fetchDetails={true}
                nearbyPlacesAPI="GooglePlacesSearch"  
                enableHighAccuracyLocation={true} 
                GooglePlacesDetailsQuery={{ fields: "geometry,name,formatted_address" }}
                keyboardShouldPersistTaps="handled"
                debounce={400}
                textInputProps={{
                  onFocus: () => setActiveInput('origin')
                }}
                query={{
                  key: 'AIzaSyD2E5vl6LGlNgEeocvrFGGSQwA4LWTbspE',
                  language: 'en',
                  components: 'country:in',
                  location: currentCoords ? `${currentCoords.latitude},${currentCoords.longitude}` : '28.6139,77.2090',
                  radius: '50000',
                }}
                renderRow={(data) => <PlaceRow data={data} />}
                styles={{
                  container: localStyles.autocompleteContainer,
                  textInput: localStyles.textInput,
                  listView: [localStyles.listView, { top: 44 }], 
                  row: localStyles.listRow,
                  separator: localStyles.rowSeparator,
                }}
              />
            </View>

            {/* ➕ Add Stop trigger button */}
            {!showStopInput && (
              <TouchableOpacity 
                style={localStyles.addStopTrigger}
                onPress={() => {
                  setShowStopInput(true);
                  setActiveInput('stop');
                }}
              >
                <Text style={localStyles.addStopTriggerText}>➕ Add Stop along route</Text>
              </TouchableOpacity>
            )}

            {/* 🛑 Input Middle Stop (conditional) */}
            {showStopInput && (
              <View style={{ zIndex: activeInput === 'stop' ? 100 : 1, position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <GooglePlacesAutocomplete
                    ref={stopRef}
                    placeholder='Add Stop...'
                    onPress={(data, details = null) => {
                      setStopPlace({ data, details });
                      destinationRef.current?.focus();
                      setActiveInput('destination');
                    }}
                    enablePoweredByContainer={false}
                    minLength={2}
                    fetchDetails={true}
                    nearbyPlacesAPI="GooglePlacesSearch"  
                    debounce={400}
                    textInputProps={{
                      onFocus: () => setActiveInput('stop')
                    }}
                    query={{
                      key: 'AIzaSyD2E5vl6LGlNgEeocvrFGGSQwA4LWTbspE',
                      language: 'en',
                      components: 'country:in',
                      location: currentCoords ? `${currentCoords.latitude},${currentCoords.longitude}` : '28.6139,77.2090',
                      radius: '50000',
                    }}
                    renderRow={(data) => <PlaceRow data={data} />}
                    styles={{
                      container: localStyles.autocompleteContainer,
                      textInput: localStyles.textInput,
                      listView: [localStyles.listView, { top: 44 }], 
                      row: localStyles.listRow,
                      separator: localStyles.rowSeparator,
                    }}
                  />
                </View>
                <TouchableOpacity 
                  style={localStyles.removeStopBtn}
                  onPress={() => {
                    setShowStopInput(false);
                    setStopPlace(null);
                    setActiveInput('destination');
                  }}
                >
                  <Text style={{ fontSize: 18, color: '#EF4444', fontWeight: '800', marginLeft: 8 }}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Input 2: WHERE TO (Z-Index focus wrapper) */}
            <View style={{ zIndex: activeInput === 'destination' ? 100 : 1, position: 'relative' }}>
              <GooglePlacesAutocomplete
                ref={destinationRef}
                placeholder='Where to?'
                onPress={(data, details = null) => {
                  setDestinationPlace({ data, details });
                }}
                enablePoweredByContainer={false}
                userLocation={true}
                currentLocation={true}
                currentLocationLabel='Current Location'
                nearbyPlacesAPI="GooglePlacesSearch"  
                enableHighAccuracyLocation={true} 
                keyboardShouldPersistTaps="handled"
                debounce={400}
                textInputProps={{
                  onFocus: () => setActiveInput('destination')
                }}
                query={{
                  key: 'AIzaSyD2E5vl6LGlNgEeocvrFGGSQwA4LWTbspE',
                  language: 'en',
                  components: 'country:in',
                  location: currentCoords ? `${currentCoords.latitude},${currentCoords.longitude}` : '28.6139,77.2090',
                  radius: '50000',
                }}
                renderRow={(data) => <PlaceRow data={data} />}
                fetchDetails={true}
                minLength={2}
                styles={{
                  container: localStyles.autocompleteContainer,
                  textInput: localStyles.textInput,
                  listView: [localStyles.listView, { top: 44 }], 
                  row: localStyles.listRow,
                  separator: localStyles.rowSeparator,
                }}
              />
            </View>

          </View>
        </View>
      </View>

      {/* 2. Scrollable Saved Places and Geolocation shortcuts panel */}
      <ScrollView style={{ flex: 1, padding: 16 }} keyboardShouldPersistTaps="handled">
        {/* Use Current Location Button */}
        <TouchableOpacity 
          style={localStyles.currentLocationBtn}
          onPress={handleGetCurrentLocation}
          activeOpacity={0.7}
        >
          <Text style={localStyles.currentLocationIcon}>📍</Text>
          <Text style={localStyles.currentLocationText}>Use Current Location</Text>
        </TouchableOpacity>

        {/* Saved Places Section */}
        <Text style={localStyles.sectionTitle}>Saved Places</Text>
        
        {savedPlaces.map((place) => (
          <TouchableOpacity 
            key={place.id}
            style={localStyles.savedPlaceRow}
            onPress={() => handleSelectSavedPlace(place)}
            activeOpacity={0.7}
          >
            <Text style={localStyles.savedPlaceIcon}>{place.icon}</Text>
            <View style={localStyles.savedPlaceTextContainer}>
              <Text style={localStyles.savedPlaceTitle}>{place.title}</Text>
              <Text style={localStyles.savedPlaceAddress}>{place.address}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', 
  },
  headerCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 20,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backArrowIcon: {
    fontSize: 24,
    color: '#000',
    fontWeight: '300',
  },
  searchGrid: {
    flexDirection: 'row',
  },
  leftTrack: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
    paddingVertical: 18, 
  },
  originDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8f8f8f',
  },
  connectingLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#cbcbcb',
    marginVertical: 4,
  },
  destinationSquare: {
    width: 6,
    height: 6,
    backgroundColor: '#000',
  },
  inputsContainer: {
    flex: 1,
    gap: 12,
  },
  autocompleteContainer: {
    flex: 0,
  },
  textInput: {
    backgroundColor: '#f3f3f3', 
    height: 40,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#000',
  },
  listView: {
    position: 'absolute',
    left: -48, 
    right: -16, 
    backgroundColor: '#fff',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    height: 800, 
    zIndex: 999,
  },
  listRow: {
    paddingHorizontal: 20, 
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  rowSeparator: {
    height: 1,
    backgroundColor: '#f1f1f1',
    marginLeft: 20, 
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  currentLocationIcon: {
    fontSize: 18,
    color: '#3B82F6',
    marginRight: 12,
  },
  currentLocationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  savedPlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  savedPlaceIcon: {
    fontSize: 18,
    color: '#64748B',
    marginRight: 12,
    backgroundColor: '#F1F5F9',
    width: 32,
    height: 32,
    borderRadius: 16,
    textAlign: 'center',
    lineHeight: 32,
  },
  savedPlaceTextContainer: {
    flex: 1,
  },
  savedPlaceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  savedPlaceAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addStopTrigger: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  addStopTriggerText: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 12,
  },
  removeStopBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
});

export default DestinationSearch;