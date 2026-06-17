import { View, Text, Image } from 'react-native';
import styles from "./styles";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const UberTypeRow = (props) => {
  const {type} = props;

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

  return (
    <View style={styles.container}>

      <Image style={styles.image} source={getImage()} />

      <View style={styles.middleContainer}>
        <Text style={styles.type}>{type.type}
         
          <MaterialIcons name={'person'} size={23} /> 3
        </Text>

        <Text style={styles.time}>8:03pm Dropoff</Text>
      </View>

      <View style={styles.rightContainer}>
        <MaterialIcons name={"sell"} size={25} color={'#42d742'} />
        <Text style={styles.price}> est.₹{type.price}</Text>
      </View>

    </View>
  );
};

export default UberTypeRow;