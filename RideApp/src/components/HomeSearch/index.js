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
      {/* Drawer slide indicator bar */}
      <View style={styles.slideIndicator} />

      {/* 🔍 Search Input Capsule */}
      <Pressable onPress={goToSearch} style={styles.searchBarCapsule}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchText}>Where do you want to go?</Text>
      </Pressable>

      {/* Section Title */}
      <Text style={styles.sectionTitle}>Everything In Minutes</Text>

      {/* Grid Row 1 */}
      <View style={styles.gridRow}>
        {/* Card 1: Cab Booking */}
        <Pressable onPress={goToSearch} style={styles.gridCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardSub}>Quick book</Text>
            <Text style={styles.cardTitle}>Velo Cab</Text>
          </View>
          <Text style={styles.cardGraphic}>🚖</Text>
        </Pressable>

        {/* Card 2: Metro Tickets */}
        <Pressable onPress={goToSearch} style={styles.gridCard}>
          <View style={styles.cardHeader}>
            <View style={styles.offersBadge}>
              <Text style={styles.offersBadgeText}>% Offers</Text>
            </View>
            <Text style={styles.cardTitle}>Metro tickets</Text>
          </View>
          <Text style={styles.cardGraphic}>🚇</Text>
        </Pressable>
      </View>

      {/* Grid Row 2 */}
      <View style={styles.gridRow}>
        {/* Card 3: Parcel Delivery */}
        <Pressable onPress={goToSearch} style={styles.gridCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardSub}>Send anything</Text>
            <Text style={styles.cardTitle}>Parcel</Text>
          </View>
          <Text style={styles.cardGraphic}>📦</Text>
        </Pressable>

        {/* Card 4: Eco-Rickshaws */}
        <Pressable onPress={goToSearch} style={styles.gridCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardSub}>Eco ride</Text>
            <Text style={styles.cardTitle}>E-rickshaw</Text>
          </View>
          <Text style={styles.cardGraphic}>🛺</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default HomeSearch;