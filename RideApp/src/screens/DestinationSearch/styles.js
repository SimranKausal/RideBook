import { StyleSheet } from "react-native";

const styles = StyleSheet.create({

  // Whole screen (optional)
  container: {
    padding: 10,
    flex: 1,
    backgroundColor: '#fff',
  },

  // Input box (if used)
  textInput: {
    backgroundColor: '#dfdcdc',
    height: 50,
    margin: 5,
    paddingHorizontal: 15,
    borderRadius: 8,
  },

  // 🔥 MAIN ROW (VERY IMPORTANT)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },

  // Icon circle
  iconContainer: {
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 25,
    marginRight: 12,
  },

  // 🔥 TEXT WRAPPER (VERY IMPORTANT)
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  // Main place name
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',   // ensures visibility
  },

  // Address / secondary text
  subText: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },

});

export default styles;