import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; 
import styles from "./styles";
import { useNavigation } from '@react-navigation/native';

const HomeSearch = () => {
  const navigation = useNavigation();
  
  const goToSearch = () => {
    navigation.navigate("DestinationSearch");
  };

  return (
    <View style={styles.container}>
      {/* 🔍 Search Input Card Box */}
      <Pressable onPress={goToSearch} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
        <View style={styles.inputBox}>
          <Text style={styles.inputText}>Where to?</Text>
          
          <View style={styles.timeContainer}>
            <MaterialIcons name="schedule" size={18} color="#0F172A" />
            <Text style={styles.timeText}>Now</Text>
            <MaterialIcons name="keyboard-arrow-down" size={16} color="#0F172A" />
          </View>
        </View>
      </Pressable>

      {/* 🕒 Recent History Destination Row */}
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={'history'} size={22} color="#64748B" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.destinationText}>Spin Nightclub</Text>
          <Text style={styles.subText}>23, Albert Street, New Delhi</Text>
        </View>
      </View>
        
      {/* 🏠 Saved Home Destination Row */}
      <View style={styles.row}>
        <View style={[styles.iconContainer, styles.homeIconContainer]}>
          <MaterialIcons name={'home'} size={22} color="#3B82F6" />
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