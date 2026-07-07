import React, { useRef, useEffect, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { StyleSheet, View, Text } from 'react-native';

const GOOGLE_MAPS_APIKEY = 'AIzaSyD2E5vl6LGlNgEeocvrFGGSQwA4LWTbspE';

const RouteMap = ({ origin, destination }) => {
  const mapRef = useRef(null);

  const [routeStrokeWidth, setRouteStrokeWidth] = useState(4);
  const [routeColor, setRouteColor] = useState('black');
  
  // 🏪 State for idle online drivers fetched from the DB
  const [idleDrivers, setIdleDrivers] = useState([]);

  const originLoc = origin?.details?.geometry?.location || origin?.geometry?.location;
  const destinationLoc = destination?.details?.geometry?.location || destination?.geometry?.location;

  const originCoordinate = originLoc ? { latitude: originLoc.lat, longitude: originLoc.lng } : null;
  const destinationCoordinate = destinationLoc ? { latitude: destinationLoc.lat, longitude: destinationLoc.lng } : null;

  // 📡 Fetch available idle drivers from backend database on layout boot
  useEffect(() => {
    const fetchMapCars = async () => {
      try {
        const response = await fetch('http://4.240.25.27:5000/api/rides/nearby-drivers');
        const data = await response.json();
        
        if (data.success) {
          setIdleDrivers(data.drivers);
          console.log(`🚘 [Map Engine] Successfully loaded ${data.drivers.length} high-contrast background cars.`);
        }
      } catch (error) {
        console.log("⚠️ Could not load background cars:", error.message);
      }
    };

    fetchMapCars();
  }, []);

  // Zoom/Center Camera Animation
  useEffect(() => {
    if (!originCoordinate || !destinationCoordinate) return;

    const centerLatitude = (originCoordinate.latitude + destinationCoordinate.latitude) / 2;
    const centerLongitude = (originCoordinate.longitude + destinationCoordinate.longitude) / 2;
    const latitudeDelta = Math.abs(originCoordinate.latitude - destinationCoordinate.latitude) * 1.8;
    const longitudeDelta = Math.abs(originCoordinate.longitude - destinationCoordinate.longitude) * 1.8;

    const region = {
      latitude: centerLatitude,
      longitude: centerLongitude,
      latitudeDelta: Math.max(latitudeDelta, 0.025),
      longitudeDelta: Math.max(longitudeDelta, 0.025),
    };

    const timer = setTimeout(() => { mapRef.current?.animateToRegion(region, 1000); }, 300);
    return () => clearTimeout(timer);
  }, [origin, destination]);

  // Pulse Highlight Animation
  useEffect(() => {
    if (!originCoordinate || !destinationCoordinate) return;
    setRouteStrokeWidth(4);
    setRouteColor('black');

    const animationSequence = [
      { width: 8, color: '#3b82f6' },
      { width: 4, color: 'black' },
      { width: 8, color: '#3b82f6' },
      { width: 4, color: 'black' },
    ];

    animationSequence.forEach((step, index) => {
      setTimeout(() => {
        setRouteStrokeWidth(step.width);
        setRouteColor(step.color);
      }, (index + 1) * 300);
    });
  }, [origin, destination]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude: originCoordinate?.latitude || 28.6139, 
        longitude: originCoordinate?.longitude || 77.2090,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      {originCoordinate && (
        <Marker coordinate={originCoordinate} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.pickupMarkerOuter}><View style={styles.pickupMarkerInner} /></View>
        </Marker>
      )}

      {destinationCoordinate && (
        <Marker coordinate={destinationCoordinate} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.destinationMarker} />
        </Marker>
      )}

      {/* 🚘 THE HIGH-CONTRAST IDLE DRIVERS LOOP FROM MONGO DB */}
      {idleDrivers.map((driver) => {
        if (!driver.currentLocation?.latitude || !driver.currentLocation?.longitude) return null;

        return (
          <Marker
            key={driver._id}
            coordinate={{
              latitude: driver.currentLocation.latitude,
              longitude: driver.currentLocation.longitude,
            }}
            title={driver.fullname}
            description={driver.vehicleDetails?.carModel || "Velo Driver"}
            flat={true}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            {/* Using a bright red car emoji so it stands out sharply against the map layout */}
            <Text style={{ fontSize: 26 }}>🚘</Text>
          </Marker>
        );
      })}

      {originCoordinate && destinationCoordinate && (
        <MapViewDirections
          origin={originCoordinate}
          destination={destinationCoordinate}
          apikey={GOOGLE_MAPS_APIKEY}
          strokeWidth={routeStrokeWidth}
          strokeColor={routeColor}
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: { width: '100%', height: '100%' },
  pickupMarkerOuter: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff', elevation: 5 },
  pickupMarkerInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  destinationMarker: { width: 14, height: 14, backgroundColor: '#000', borderWidth: 2, borderColor: '#fff', elevation: 5 }
});

export default RouteMap;