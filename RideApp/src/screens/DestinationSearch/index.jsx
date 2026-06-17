import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import PlaceRow from "./PlaceRow";

// ✅ CRITICAL: Required for GooglePlacesAutocomplete to access location services
navigator.geolocation = require('@react-native-community/geolocation');

const homePlace = {
  description: 'Home',
  geometry: { location: { lat: 48.8152937, lng: 2.4597668 } },
};
const workPlace = {
  description: 'Work',
  geometry: { location: { lat: 48.8496818, lng: 2.2940881 } },
};

const DestinationSearch = () => {
  const [originPlace, setOriginPlace] = useState(null);
  const [destinationPlace, setDestinationPlace] = useState(null);
  
  const originRef = useRef(null);
  const destinationRef = useRef(null);
  const navigation = useNavigation();
    
  useEffect(() => {
    if (originPlace && destinationPlace) {
      navigation.navigate('SearchResults', {
        originPlace,
        destinationPlace
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
            
            {/* Input 1: WHERE FROM */}
            <GooglePlacesAutocomplete
              ref={originRef}
              placeholder='Where from?'
              onPress={(data, details = null) => {
                setOriginPlace({ data, details });
                destinationRef.current?.focus();
              }}
              enablePoweredByContainer={false}
              userLocation={true}
              currentLocation={true}
              currentLocationLabel='Current Location'
              minLength={2}
              fetchDetails={true}
              nearbyPlacesAPI="GooglePlacesSearch"  
              enableHighAccuracyLocation={true} 
              predefinedPlaces={[homePlace, workPlace]}  
              GooglePlacesDetailsQuery={{ fields: "geometry,name,formatted_address" }}
              keyboardShouldPersistTaps="handled"
              debounce={400}
              query={{
                key: 'AIzaSyD2E5vl6LGlNgEeocvrFGGSQwA4LWTbspE',
                language: 'en',
              }}
              renderRow={(data) => <PlaceRow data={data} />}
              styles={{
                container: localStyles.autocompleteContainer,
                textInput: localStyles.textInput,
                listView: [localStyles.listView, { top: 92 }], 
                row: localStyles.listRow,
                separator: localStyles.rowSeparator,
              }}
            />
            
            {/* Input 2: WHERE TO */}
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
              predefinedPlaces={[homePlace, workPlace]} 
              keyboardShouldPersistTaps="handled"
              debounce={400}
              query={{
                key: 'AIzaSyD2E5vl6LGlNgEeocvrFGGSQwA4LWTbspE',
                language: 'en',
              }}
              renderRow={(data) => <PlaceRow data={data} />}
              fetchDetails={true}
              minLength={2}
              styles={{
                container: localStyles.autocompleteContainer,
                textInput: localStyles.textInput,
                listView: [localStyles.listView, { top: 40 }], 
                row: localStyles.listRow,
                separator: localStyles.rowSeparator,
              }}
            />

          </View>
        </View>
      </View>
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
  }
});

export default DestinationSearch;