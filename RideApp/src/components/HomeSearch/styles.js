import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    // Soft drop shadow for premium elevation
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 10,
  },
  inputBox: {
    backgroundColor: '#F1F5F9', // Light Slate-100
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0', // Slate-200
  },
  inputText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A', // Deep Slate-900
    letterSpacing: 0.5,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
    // Tiny shadow for the time pill
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9', // Divider color
  },
  iconContainer: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 50,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeIconContainer: {
    backgroundColor: '#EFF6FF', // Light blue background for Home
  },
  destinationText: {
    fontWeight: '600',
    fontSize: 15,
    color: '#1E293B', // Slate-800
  },
  subText: {
    fontSize: 12,
    color: '#64748B', // Slate-500
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  }
});

export default styles;