import React from 'react';
import { View, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import cars from "../../assets/data/cars";

const HomeMap = () => {

  const getImage = (type) => {
    if (type === 'Velo Go') {
      return require('../../assets/images/veloGo.jpeg');
    }

    if (type === 'Velo Plus') {
      return require('../../assets/images/veloPlus.jpeg');
    }

    if (type === 'Velo XL') {
      return require('../../assets/images/velo-XL.jpeg');
    }

    if (type === 'top-UberX') {
      return require('../../assets/images/top-UberX.png');
    }

    if (type === 'top-UberXL') {
      return require('../../assets/images/top-UberXL.png');
    }

    if (type === 'top-Comfort') {
      return require('../../assets/images/top-Comfort.png');
    }

    return require('../../assets/images/veloGo.jpeg');
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#bec7ff",
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <MapView
        style={{ width: '100%', height: '100%' }}
        initialRegion={{
        latitude: 28.6139,
        longitude: 77.2090,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
        }}
      >
        {cars.map((car) => (
          <Marker
            key={car.id}
            coordinate={{
              latitude: car.latitude,
              longitude: car.longitude,
            }}
          >
            <Image
              source={getImage(car.type)}
              style={{
                height: 50,
                width: 50,
                resizeMode: 'contain',
                transform:[{
                  rotate:`${car.heading}deg`
                }]
              }}
            />
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

export default HomeMap;