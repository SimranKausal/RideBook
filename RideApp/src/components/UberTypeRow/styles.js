import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    // Premium shadow for iOS/Android
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  image: {
    width: 60,
    height: 48,
    resizeMode: 'contain',
  },
  middleContainer: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  type: {
    fontWeight: '800',
    fontSize: 16,
    color: '#0F172A',
  },
  capacity: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  time: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  price: {
    fontWeight: '800',
    fontSize: 15,
    color: '#065F46',
  },
});

export default styles;