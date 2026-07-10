import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from "./styles";

const UberTypeRow = (props) => {
  const { type, isSelected } = props;

  const getImage = () => {
    if (type.type === 'Velo Go') {
      return require('../../assets/images/veloGo.jpeg');
    }
    if (type.type === 'Velo Plus') {
      return require('../../assets/images/veloPlus.jpeg');
    }
    if (type.type === 'Velo XL') {
      return require('../../assets/images/velo-XL.jpeg');
    }
    if (type.type === 'top-UberX') {
      return require('../../assets/images/top-UberX.png');
    }
    if (type.type === 'top-UberXL') {
      return require('../../assets/images/top-UberXL.png');
    }
    if (type.type === 'top-Comfort') {
      return require('../../assets/images/top-Comfort.png');
    }

    return require('../../assets/images/veloGo.jpeg'); // fallback
  };
  const getCapacity = () => {
    if (type.type.includes('XL')) return { seats: 6, bags: 4 };
    if (type.type.includes('Plus')) return { seats: 4, bags: 3 };
    return { seats: 4, bags: 2 };
  };

  const info = getCapacity();

  return (
    <View style={[
      styles.container,
      isSelected && { borderColor: '#3B82F6', backgroundColor: '#F8FAFC', borderWidth: 1.5 }
    ]}>
      
      <Image style={styles.image} source={getImage()} />

      <View style={styles.middleContainer}>
        <View style={styles.typeRow}>
          <Text style={styles.type}>{type.type}</Text>
          <Text style={styles.capacity}>👤 {info.seats}</Text>
        </View>
        <Text style={styles.time}>🧳 {info.bags} Bags max • Nearby Dropoff</Text>
      </View>
      <View style={styles.rightContainer}>
        <View style={[
          styles.priceBadge,
          isSelected && { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }
        ]}>
          <Text style={[
            styles.price,
            isSelected && { color: '#1E40AF' }
          ]}>₹{type.price}</Text>
        </View>
      </View>

    </View>
  );
};

export default UberTypeRow;