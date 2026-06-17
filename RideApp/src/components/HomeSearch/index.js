import { View, Text, Pressable } from 'react-native';
// Add this import line:
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; 
import styles from "./styles";
import { useNavigation } from '@react-navigation/native';


const HomeSearch = () => {
  const navigation = useNavigation();
  const goToSearch = ()=>{
    console.warn("Search")
    navigation.navigate("DestinationSearch")
  }
  return (
    <View>
      <Pressable onPress = {goToSearch}>
       <View style={styles.inputBox}>
        <Text style={styles.inputText}>Where to?</Text>
        <View style={styles.timeContainer}>
          <MaterialIcons name="schedule" size={24} color="#adacac" />
          <Text>Now</Text>
          <MaterialIcons name="keyboard-arrow-down" size={16} />
         </View>
       </View>
       </Pressable>
       <View style = {styles.row}>
       <View style = {styles.iconContainer}>
      <MaterialIcons name={'history'} size={20}></MaterialIcons>
       </View>
       <Text style = {styles.destinationText}> Spin NightClub</Text>
       </View>
        
       <View style={styles.row}>
       <View style={[styles.iconContainer,{backgroundColor:'#218cff'}]}>
        <MaterialIcons name={'home'} size={16} ></MaterialIcons>
       </View>
       <Text style = {styles.destinationText}>Spin Nightclub</Text>
      </View>

    </View>
  );
}

export default HomeSearch;