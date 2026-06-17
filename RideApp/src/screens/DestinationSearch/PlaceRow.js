import { View, Text } from 'react-native';
import styles from './styles';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const PlaceRow = ({ data }) => {
  console.log("ROW DATA:", JSON.stringify(data, null, 2));

  // ✅ Safe base text source
  const rawText =
    data?.description ||
    data?.name ||
    data?.vicinity ||
    "";

  const lowerText = rawText.toLowerCase();

  // ✅ Detect types safely
  const isHome = lowerText === "home";
  const isWork = lowerText === "work";
  const isCurrentLocation = rawText === "Current Location";

  // ✅ Default icon
  let iconName = "location-on";

  // ✅ MAIN TEXT (covers ALL cases)
  let mainText =
    data?.structured_formatting?.main_text ||
    data?.description ||
    data?.name ||
    data?.vicinity ||
    "Unknown place";

  // ✅ SECONDARY TEXT
  let secondaryText =
    data?.structured_formatting?.secondary_text ||
    "";

  // ✅ Special cases
  if (isCurrentLocation) {
    iconName = "my-location";
    mainText = "Current Location";
    secondaryText = "";
  } else if (isHome) {
    iconName = "home";
    mainText = "Home";
  } else if (isWork) {
    iconName = "work";
    mainText = "Work";
  }

  return (
    <View style={styles.row}>
      <View style={styles.iconContainer}>
        <MaterialIcons name={iconName} size={25} color="#555" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.locationText}>
          {mainText}
        </Text>

        {secondaryText ? (
          <Text style={styles.subText}>
            {secondaryText}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default PlaceRow;