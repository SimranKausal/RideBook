import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';

export default function CustomDrawer(props) {
  return (
    <DrawerContentScrollView {...props}>
      
      {/* HEADER SECTION */}
      <View style={{ backgroundColor: '#212121', padding: 15 }}>

        {/* USER ROW */}
        <View style={styles.userRow}>
          <View style={styles.profileCircle} />

          <View>
            <Text style={styles.name}>Vadim Savin</Text>
            <Text style={styles.rating}>5.00 ★</Text>
          </View>
        </View>

        {/* MESSAGES */}
        <View style={styles.messageContainer}>
          <Pressable onPress={() => console.warn("Messages")}>
            <Text style={styles.menuText}>Messages</Text>
          </Pressable>
        </View>

        {/* DO MORE */}
        <Pressable onPress={() => console.warn("Do more with your account")}>
          <Text style={styles.menuText}>Do more with your account</Text>
        </Pressable>

        {/* MAKE MONEY */}
        <Pressable onPress={() => console.warn("Make Money Driving")}>
          <Text style={styles.menuTextWhite}>Make Money Driving</Text>
        </Pressable>

      </View>

      {/* DEFAULT DRAWER ITEMS */}
      <DrawerItemList {...props} />

    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    backgroundColor: '#cacaca',   // ✅ fixed spelling (was backroundColor)
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  name: {
    color: 'white',
    fontSize: 18,
  },
  rating: {
    color: 'lightgrey',
    fontSize: 14,
  },
  messageContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderTopWidth: 1,
    borderTopColor: '#919191',
    paddingVertical: 5,
    marginVertical: 10,
  },
  menuText: {
    color: '#dddddd',
    paddingVertical: 5,
  },
  menuTextWhite: {
    color: 'white',
    paddingVertical: 5,
  },
});