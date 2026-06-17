import { View, Dimensions } from 'react-native';
import UberTypes from "../../components/UberTypes";
import RouteMap from "../../components/RouteMap";
import { useRoute } from "@react-navigation/native";

const SearchResults = () => {
  const route = useRoute();
  
  // Extract origin and destination from route parameters
  const { originPlace, destinationPlace } = route.params || {};

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <View style={{ height: Dimensions.get('window').height - 400 }}>
        {/* Pass the locations down as props */}
        <RouteMap origin={originPlace} destination={destinationPlace} />
      </View>

      <View style={{ height: 400 }}>
        <UberTypes />
      </View>
    </View>
  );
};

export default SearchResults;