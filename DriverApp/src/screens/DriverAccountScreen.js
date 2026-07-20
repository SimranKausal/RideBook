import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Modal, Alert, TextInput, Dimensions } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function DriverAccountScreen() {
  const navigation = useNavigation();
  // States
  const [walletBalance, setWalletBalance] = useState(1500); // Driver starts with earnings!
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showInboxModal, setShowInboxModal] = useState(false);
  
  const [cashoutAmt, setCashoutAmt] = useState('');
  
  const [driverName, setDriverName] = useState('Amit Kumar');
  const [driverVehicle, setDriverVehicle] = useState('White Maruti Swift');
  const [driverRating, setDriverRating] = useState('4.88');
  const [savedUpiId, setSavedUpiId] = useState('driverpay@paytm');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [inputUpi, setInputUpi] = useState('');
  
  const driverId = "6a34d1819c65dd2c4eb29403"; // Dynamic test ID matching baseline driver

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const localUpi = await AsyncStorage.getItem('driverUpiId');
        if (localUpi) {
          setSavedUpiId(localUpi);
        }

        const localDriverId = await AsyncStorage.getItem('driverId') || driverId;
        const response = await axios.get(`http://4.240.25.27:5000/api/auth/driver/profile/${localDriverId}`);
        if (response.data.success && response.data.driver) {
          const d = response.data.driver;
          setDriverName(d.fullname || 'Amit Kumar');
          if (d.vehicleDetails) {
            setDriverVehicle(`${d.vehicleDetails.color || 'White'} ${d.vehicleDetails.carModel || 'Swift'}`);
          }
          setDriverRating(d.rating || '4.88');
          if (!localUpi && d.upiId) {
            setSavedUpiId(d.upiId);
          }
        }
      } catch (err) {
        console.log("Error fetching driver profile:", err.message);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveUpi = async () => {
    if (!inputUpi.trim()) {
      Alert.alert("Missing UPI ID", "Please type a valid UPI ID (e.g. yourname@paytm).");
      return;
    }

    const cleanUpi = inputUpi.trim();
    try {
      await AsyncStorage.setItem('driverUpiId', cleanUpi);
      setSavedUpiId(cleanUpi);

      const localDriverId = await AsyncStorage.getItem('driverId') || driverId;
      await axios.put(`http://4.240.25.27:5000/api/auth/driver/update-profile`, {
        driverId: localDriverId,
        fullname: driverName,
        email: 'driver@velo.com',
        vehicleDetails: {
          carModel: 'Swift',
          plateNumber: 'DL 3C AY 4412',
          color: 'White'
        },
        upiId: cleanUpi
      });

      setShowUpiModal(false);
      setInputUpi('');
      Alert.alert("UPI ID Saved! ✅", `Your QR codes will now direct passenger payments to ${cleanUpi}.`);
    } catch (err) {
      console.log("Error saving UPI ID:", err.message);
      Alert.alert("Saved Locally", `Your UPI ID has been set to ${cleanUpi}.`);
      setShowUpiModal(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log Out 🚪",
      "Are you sure you want to log out of Velo Driver?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('driverId');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (err) {
              console.log("Logout error:", err.message);
            }
          }
        }
      ]
    );
  };

  const handleCashout = () => {
    const amt = parseFloat(cashoutAmt);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please type a valid number to cash out.");
      return;
    }
    if (amt > walletBalance) {
      Alert.alert("Insufficient Balance", "You cannot cash out more than your current earnings.");
      return;
    }
    setWalletBalance((prev) => prev - amt);
    setCashoutAmt('');
    Alert.alert("Cashout Sent! 💸", `Successfully transferred ₹${amt} to your registered Bank Account.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card Header (Uber style mirroring passenger app) */}
        <View style={styles.profileHeader}>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{driverName}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ {driverRating}</Text>
            </View>
            <Text style={styles.vehicleText}>{driverVehicle}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        </View>

        {/* 💳 Quick Earnings summary */}
        <View style={styles.balanceSummary}>
          <Text style={styles.balanceLabel}>Total Driver Earnings</Text>
          <Text style={styles.balanceValue}>₹{walletBalance}</Text>
        </View>

        {/* Grid Panel Options */}
        <View style={styles.gridContainer}>
          
          {/* Option 1: Help */}
          <Pressable style={styles.gridCard} onPress={() => setShowHelpModal(true)}>
            <Text style={styles.cardIcon}>🙋</Text>
            <Text style={styles.cardTitle}>Help</Text>
            <Text style={styles.cardSub}>Driver Support</Text>
          </Pressable>

          {/* Option 2: Wallet */}
          <Pressable style={styles.gridCard} onPress={() => setShowWalletModal(true)}>
            <Text style={styles.cardIcon}>💳</Text>
            <Text style={styles.cardTitle}>Wallet</Text>
            <Text style={styles.cardSub}>Cashout Earnings</Text>
          </Pressable>

          {/* Option 3: Safety */}
          <Pressable style={styles.gridCard} onPress={() => setShowSafetyModal(true)}>
            <Text style={styles.cardIcon}>🛡️</Text>
            <Text style={styles.cardTitle}>Safety</Text>
            <Text style={styles.cardSub}>SOPs & SOS</Text>
          </Pressable>

          {/* Option 4: Inbox */}
          <Pressable style={styles.gridCard} onPress={() => setShowInboxModal(true)}>
            <Text style={styles.cardIcon}>📩</Text>
            <Text style={styles.cardTitle}>Inbox</Text>
            <Text style={styles.cardSub}>System Alerts</Text>
          </Pressable>

        </View>

        {/* Settings options list */}
        <View style={styles.settingsList}>
          <Pressable style={styles.settingRow} onPress={() => { setInputUpi(savedUpiId); setShowUpiModal(true); }}>
            <Text style={styles.settingText}>📱 Payout UPI ID Settings ({savedUpiId})</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </Pressable>
          <Pressable style={styles.settingRow} onPress={() => Alert.alert("Vehicle Info", `Compliant: ${driverVehicle}`)}>
            <Text style={styles.settingText}>🚗 Vehicle Registration</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </Pressable>
          <Pressable style={styles.settingRow} onPress={() => Alert.alert("Documents", "Aadhaar, License & RC verified.")}>
            <Text style={styles.settingText}>📄 Legal Documents</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </Pressable>
          <Pressable style={styles.settingRow} onPress={handleLogout}>
            <Text style={[styles.settingText, { color: '#EF4444' }]}>🚪 Log Out</Text>
            <Text style={[styles.arrowIcon, { color: '#EF4444' }]}>›</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* 📱 PAYOUT UPI ID MODAL */}
      <Modal visible={showUpiModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Payout UPI ID Settings 📱</Text>
            <Text style={styles.modalDesc}>
              Enter your personal UPI ID (Google Pay, PhonePe, Paytm) so passenger QR codes deposit money directly into your bank account:
            </Text>

            <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '700', marginBottom: 4, alignSelf: 'flex-start', textTransform: 'uppercase' }}>
              Current Receiving UPI ID:
            </Text>
            <Text style={{ fontSize: 16, color: '#38BDF8', fontWeight: '800', marginBottom: 16, alignSelf: 'flex-start' }}>
              {savedUpiId}
            </Text>

            <TextInput
              value={inputUpi}
              onChangeText={setInputUpi}
              placeholder="e.g. 9876543210@paytm or name@okicici"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              style={styles.modalInput}
            />

            <Pressable style={styles.modalBtnPrimary} onPress={handleSaveUpi}>
              <Text style={styles.modalBtnPrimaryText}>Save & Update UPI ID ✅</Text>
            </Pressable>

            <Pressable style={styles.modalBtnSecondary} onPress={() => setShowUpiModal(false)}>
              <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 💳 1. WALLET/EARNINGS MODAL */}
      <Modal visible={showWalletModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Driver Earnings Portal 💳</Text>
            <Text style={styles.modalDesc}>Cash out your collected digital fares instantly to your bank.</Text>
            
            <View style={styles.walletDetailCard}>
              <Text style={styles.walletDetailLabel}>TOTAL EARNED</Text>
              <Text style={styles.walletDetailValue}>₹{walletBalance}</Text>
            </View>

            {/* Cashout input */}
            <TextInput
              value={cashoutAmt}
              onChangeText={setCashoutAmt}
              placeholder="Enter amount to Cashout"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              style={styles.topUpInput}
            />

            <Pressable style={styles.actionBtn} onPress={handleCashout}>
              <Text style={styles.actionBtnText}>Cash Out to Bank</Text>
            </Pressable>

            <Pressable style={styles.closeBtn} onPress={() => setShowWalletModal(false)}>
              <Text style={styles.closeBtnText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 🛡️ 2. SAFETY MODAL */}
      <Modal visible={showSafetyModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Driver Safety SOPs 🛡️</Text>
            
            <ScrollView style={{ maxHeight: 200, marginVertical: 10 }}>
              <Text style={styles.safetyCheck}>🟢 **Verify OTP Code**: Do not start driving until you verify the passenger's 4-digit code in the app.</Text>
              <Text style={styles.safetyCheck}>🟢 **Speed Regulations**: Maintain city speed limits (maximum 50 km/h) for safety compliance.</Text>
              <Text style={styles.safetyCheck}>🟢 **Safe Stops**: Stop vehicle in designated safe parking spots during pickup or drops.</Text>
            </ScrollView>

            <Pressable style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} onPress={() => Alert.alert("SOS Alert Broadcasted 🚨", "Relaying emergency status to dispatcher central room.")}>
              <Text style={styles.actionBtnText}>🚨 Dispatch SOS Alert</Text>
            </Pressable>

            <Pressable style={styles.closeBtn} onPress={() => setShowSafetyModal(false)}>
              <Text style={styles.closeBtnText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 🙋 3. HELP MODAL */}
      <Modal visible={showHelpModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Driver Support 🙋</Text>
            
            <Pressable style={styles.helpRow} onPress={() => Alert.alert("Report Registered", "Support agent will review details of the ride.")}>
              <Text style={styles.helpRowText}>⚠️ Passenger refused to pay / incorrect fare</Text>
            </Pressable>
            <Pressable style={styles.helpRow} onPress={() => Alert.alert("Help Registered", "Network team is updating maps routing coordinates.")}>
              <Text style={styles.helpRowText}>🗺️ Maps routing navigation issues</Text>
            </Pressable>
            <Pressable style={styles.helpRow} onPress={() => Alert.alert("Support Details", "Driver help hotline: +91 1800 221 4412")}>
              <Text style={styles.helpRowText}>📞 Call Velo Driver Hotline</Text>
            </Pressable>

            <Pressable style={styles.closeBtn} onPress={() => setShowHelpModal(false)}>
              <Text style={styles.closeBtnText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 📩 4. INBOX MODAL */}
      <Modal visible={showInboxModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Driver Notifications 📩</Text>
            
            <ScrollView style={{ maxHeight: 200, marginVertical: 10 }}>
              <View style={styles.inboxCard}>
                <Text style={styles.inboxTitle}>🏆 Weekly Incentive Peak hours</Text>
                <Text style={styles.inboxDesc}>Get 1.5x surge bonuses on all completed rides in Noida between 5:00 PM and 8:00 PM today.</Text>
              </View>
              <View style={styles.inboxCard}>
                <Text style={styles.inboxTitle}>🔧 System Maintenance</Text>
                <Text style={styles.inboxDesc}>Velo server updates completed. Dynamic fare computation calculations are fully online.</Text>
              </View>
            </ScrollView>

            <Pressable style={styles.closeBtn} onPress={() => setShowInboxModal(false)}>
              <Text style={styles.closeBtnText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    backgroundColor: '#E2E8F0',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  avatarText: {
    color: '#64748B',
    fontSize: 38,
    fontWeight: '900',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
  },
  vehicleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
  },
  ratingBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  balanceSummary: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#10B981',
    marginTop: 6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    width: (width - 52) / 2,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  settingsList: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  arrowIcon: {
    fontSize: 20,
    color: '#94A3B8',
  },
  
  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 380,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  walletDetailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  walletDetailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  walletDetailValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10B981',
    marginTop: 4,
  },
  topUpInput: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  closeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },
  safetyCheck: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 12,
  },
  helpRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  helpRowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  inboxCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  inboxTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  inboxDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  }
});
