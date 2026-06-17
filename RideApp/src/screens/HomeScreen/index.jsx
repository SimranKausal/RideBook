import { View, Text , Dimensions} from 'react-native'
import HomeMap from '../../components/HomeMap/index'
import HomeSearch from "../../components/HomeSearch"

const HomeScreen = () => {
  return (
    <View>
    <View style = {{height: Dimensions.get('window').height-400}}>
      <HomeMap/>
      </View>
      <HomeSearch/>
    </View>
  )
}
export default HomeScreen;