import React from 'react';
import { View, StyleSheet } from 'react-native';
import HomeMap from '../../components/HomeMap/index';
import HomeSearch from "../../components/HomeSearch";

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <HomeMap />
      </View>
      <HomeSearch />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate-900 matching
  },
  mapContainer: {
    flex: 1,
  },
});

export default HomeScreen;