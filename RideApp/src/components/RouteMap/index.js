import React, { useRef, useEffect, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { StyleSheet, View } from 'react-native';

const GOOGLE_MAPS_APIKEY = 'AIzaSyD2E5vl6LGlNgEeocvrFGGSQwA4LWTbspE';

const RouteMap = ({ origin, destination }) => {
  const mapRef = useRef(null);

  // States to control the highlight/pulse animation of the route line
  const [routeStrokeWidth, setRouteStrokeWidth] = useState(4);
  const [routeColor, setRouteColor] = useState('black');

  // Extract coordinates safely
  const originLoc = origin?.details?.geometry?.location || origin?.geometry?.location;
  const destinationLoc = destination?.details?.geometry?.location || destination?.geometry?.location;

  const originCoordinate = originLoc ? {
    latitude: originLoc.lat,
    longitude: originLoc.lng,
  } : null;

  const destinationCoordinate = destinationLoc ? {
    latitude: destinationLoc.lat,
    longitude: destinationLoc.lng,
  } : null;

  // 1. Zoom/Center Camera Animation
  useEffect(() => {
    if (!originCoordinate || !destinationCoordinate) return;

    const centerLatitude = (originCoordinate.latitude + destinationCoordinate.latitude) / 2;
    const centerLongitude = (originCoordinate.longitude + destinationCoordinate.longitude) / 2;
    const latitudeDelta = Math.abs(originCoordinate.latitude - destinationCoordinate.latitude) * 1.8;
    const longitudeDelta = Math.abs(originCoordinate.longitude - destinationCoordinate.longitude) * 1.8;

    const minLatDelta = 0.025;
    const minLngDelta = 0.025;

    const region = {
      latitude: centerLatitude,
      longitude: centerLongitude,
      latitudeDelta: Math.max(latitudeDelta, minLatDelta),
      longitudeDelta: Math.max(longitudeDelta, minLngDelta),
    };

    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(region, 1000); 
    }, 300);

    return () => clearTimeout(timer);
  }, [origin, destination]);

  // 2. Pulse Highlight Animation (Triggers when a new route is loaded)
  useEffect(() => {
    if (!originCoordinate || !destinationCoordinate) return;

    // Reset to default black/thin state
    setRouteStrokeWidth(4);
    setRouteColor('black');

    // Create a timed sequence to pulse the line:
    // Normal (4px) -> Thick & Blue (8px) -> Normal (4px) -> Thick & Blue (8px) -> Normal Black (4px)
    const animationSequence = [
      { width: 8, color: '#3b82f6' }, // Step 1: Grow thick & turn blue
      { width: 4, color: 'black' },   // Step 2: Shrink back to black
      { width: 8, color: '#3b82f6' }, // Step 3: Grow thick & blue again
      { width: 4, color: 'black' },   // Step 4: Settle back to static black
    ];

    animationSequence.forEach((step, index) => {
      setTimeout(() => {
        setRouteStrokeWidth(step.width);
        setRouteColor(step.color);
      }, (index + 1) * 300); // Triggers every 300ms
    });

  }, [origin, destination]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude: originCoordinate?.latitude || 37.78825,
        longitude: originCoordinate?.longitude || -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {/* 1. Custom Pickup Marker */}
      {originCoordinate && (
        <Marker coordinate={originCoordinate} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.pickupMarkerOuter}>
            <View style={styles.pickupMarkerInner} />
          </View>
        </Marker>
      )}

      {/* 2. Custom Destination Marker */}
      {destinationCoordinate && (
        <Marker coordinate={destinationCoordinate} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.destinationMarker} />
        </Marker>
      )}

      {/* 3. Animated Directions Polyline */}
      {originCoordinate && destinationCoordinate && (
        <MapViewDirections
          origin={originCoordinate}
          destination={destinationCoordinate}
          apikey={GOOGLE_MAPS_APIKEY}
          strokeWidth={routeStrokeWidth} // Controlled by pulse state
          strokeColor={routeColor}       // Controlled by pulse state
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  pickupMarkerOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickupMarkerInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  destinationMarker: {
    width: 14,
    height: 14,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }
});

export default RouteMap;