import React from 'react';
import { View, Text, Pressable } from 'react-native';
import styles from "./styles";
import { useNavigation } from '@react-navigation/native';

const HomeSearch = () => {
  const navigation = useNavigation();
  
  const goToSearch = () => {
    navigation.navigate("DestinationSearch");
  };

  return (
    <View style={styles.container}>
      {/* Slide Indicator Bar */}
      <View style={styles.slideIndicator} />

      {/* 🔍 Search Input Card Box */}
      <Pressable onPress={goToSearch} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
        <View style={styles.inputBox}>
          <Text style={styles.inputText}>Where to?</Text>
          
          <View style={styles.timeContainer}>
            <Text style={{ fontSize: 14 }}>🕒</Text>
            <Text style={styles.timeText}>Now</Text>
            <Text style={{ fontSize: 12, color: '#0F172A' }}>▼</Text>
          </View>
        </View>
      </Pressable>

      {/* 🕒 Recent History Destination Row */}
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Text style={{ fontSize: 16 }}>🕒</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.destinationText}>Spin Nightclub</Text>
          <Text style={styles.subText}>23, Albert Street, New Delhi</Text>
        </View>
      </View>
        
      {/* 🏠 Saved Home Destination Row */}
      <View style={styles.row}>
        <View style={[styles.iconContainer, styles.homeIconContainer]}>
          <Text style={{ fontSize: 16 }}>🏠</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.destinationText}>Home</Text>
          <Text style={styles.subText}>Pocket C-8, Vasant Kunj, New Delhi</Text>
        </View>
      </View>
    </View>
  );
};

export default HomeSearch;