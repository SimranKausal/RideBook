import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView, Modal, Alert, TextInput } from 'react-native';

export default function AccountScreen() {
  // Virtual States
  const [walletBalance, setWalletBalance] = useState(500);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showInboxModal, setShowInboxModal] = useState(false);
  
  const [topUpAmt, setTopUpAmt] = useState('');

  const handleTopUp = () => {
    const amt = parseFloat(topUpAmt);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please type a valid number to top up.");
      return;
    }
    setWalletBalance((prev) => prev + amt);
    setTopUpAmt('');
    Alert.alert("Success! 🎉", `Successfully added ₹${amt} to your Velo Wallet.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>SK</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>Simran Kaushal</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ 4.9 Rating</Text>
            </View>
          </View>
        </View>

        {/* 💳 Quick Balance display */}
        <View style={styles.balanceSummary}>
          <Text style={styles.balanceLabel}>Velo Wallet Balance</Text>
          <Text style={styles.balanceValue}>₹{walletBalance}</Text>
        </View>

        {/* Grid Panel Options */}
        <View style={styles.gridContainer}>
          
          {/* Option 1: Help */}
          <Pressable style={styles.gridCard} onPress={() => setShowHelpModal(true)}>
            <Text style={styles.cardIcon}>🙋</Text>
            <Text style={styles.cardTitle}>Help</Text>
            <Text style={styles.cardSub}>Support & FAQs</Text>
          </Pressable>

          {/* Option 2: Wallet */}
          <Pressable style={styles.gridCard} onPress={() => setShowWalletModal(true)}>
            <Text style={styles.cardIcon}>💳</Text>
            <Text style={styles.cardTitle}>Wallet</Text>
            <Text style={styles.cardSub}>Add & Manage Cash</Text>
          </Pressable>

          {/* Option 3: Safety */}
          <Pressable style={styles.gridCard} onPress={() => setShowSafetyModal(true)}>
            <Text style={styles.cardIcon}>🛡️</Text>
            <Text style={styles.cardTitle}>Safety</Text>
            <Text style={styles.cardSub}>SOS & Tips</Text>
          </Pressable>

          {/* Option 4: Inbox */}
          <Pressable style={styles.gridCard} onPress={() => setShowInboxModal(true)}>
            <Text style={styles.cardIcon}>📩</Text>
            <Text style={styles.cardTitle}>Inbox</Text>
            <Text style={styles.cardSub}>Alerts & Offers</Text>
          </Pressable>

        </View>

        {/* General Settings List */}
        <View style={styles.settingsList}>
          <Pressable style={styles.settingRow} onPress={() => Alert.alert("Settings", "Profile settings are up to date.")}>
            <Text style={styles.settingText}>⚙️ Manage Account</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </Pressable>
          <Pressable style={styles.settingRow} onPress={() => Alert.alert("Privacy", "Your data is secured with AES-256 encryption.")}>
            <Text style={styles.settingText}>🔒 Privacy & Legal</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </Pressable>
          <Pressable style={styles.logoutRow} onPress={() => Alert.alert("Log Out", "Use developer settings to log out.")}>
            <Text style={styles.logoutText}>🚪 Log Out</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* 💳 1. WALLET MODAL */}
      <Modal visible={showWalletModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Velo Wallet 💳</Text>
            <Text style={styles.modalDesc}>Add virtual funds to test online payments or view saved cards.</Text>
            
            <View style={styles.walletDetailCard}>
              <Text style={styles.walletDetailLabel}>CURRENT BALANCE</Text>
              <Text style={styles.walletDetailValue}>₹{walletBalance}</Text>
            </View>

            {/* Top Up input */}
            <TextInput
              value={topUpAmt}
              onChangeText={setTopUpAmt}
              placeholder="Enter amount (e.g. 500)"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              style={styles.topUpInput}
            />

            <Pressable style={styles.actionBtn} onPress={handleTopUp}>
              <Text style={styles.actionBtnText}>Add Money</Text>
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
            <Text style={styles.modalTitle}>Velo Safety Center 🛡️</Text>
            
            <ScrollView style={{ maxHeight: 200, marginVertical: 10 }}>
              <Text style={styles.safetyCheck}>🟢 **Confirm Start OTP**: Always verify the start code with the driver before starting the trip.</Text>
              <Text style={styles.safetyCheck}>🟢 **Share Live Status**: Tap the share button in active trips to send your location to loved ones.</Text>
              <Text style={styles.safetyCheck}>🟢 **Emergency Support**: Contact local authorities immediately in case of emergency (SOS Dial 112).</Text>
            </ScrollView>

            <Pressable style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} onPress={() => Alert.alert("SOS Triggered 🚨", "Simulating local emergency broadcast call.")}>
              <Text style={styles.actionBtnText}>🚨 Trigger SOS Emergency</Text>
            </Pressable>

            <Pressable style={styles.closeBtn} onPress={() => setShowSafetyModal(false)}>
              <Text style={styles.closeBtnText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 🙋 3. HELP/SUPPORT MODAL */}
      <Modal visible={showHelpModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Help & Support 🙋</Text>
            <Text style={styles.modalDesc}>How can we assist you today?</Text>

            <Pressable style={styles.helpRow} onPress={() => Alert.alert("Ticket Registered", "Our executive will contact you about your last ride query within 10 minutes.")}>
              <Text style={styles.helpRowText}>⚠️ Report an issue with my last ride</Text>
            </Pressable>
            <Pressable style={styles.helpRow} onPress={() => Alert.alert("Billing Help", "Razorpay payments auto-refund failed transactions within 3-5 days.")}>
              <Text style={styles.helpRowText}>💳 Payment and promo issues</Text>
            </Pressable>
            <Pressable style={styles.helpRow} onPress={() => Alert.alert("Safety Help", "We have a zero-tolerance policy on abuse.")}>
              <Text style={styles.helpRowText}>🛡️ General safety concerns</Text>
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
            <Text style={styles.modalTitle}>Velo Inbox 📩</Text>
            
            <ScrollView style={{ maxHeight: 200, marginVertical: 10 }}>
              <View style={styles.inboxCard}>
                <Text style={styles.inboxTitle}>🎟️ 50% Off Code Activated!</Text>
                <Text style={styles.inboxDesc}>Use promo code VELO50 during checkout to get half price on your next ride.</Text>
              </View>
              <View style={styles.inboxCard}>
                <Text style={styles.inboxTitle}>💳 Razorpay Integration Online</Text>
                <Text style={styles.inboxDesc}>We now support full UPI payments via Google Pay, PhonePe, and Paytm.</Text>
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
    backgroundColor: '#0F172A',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  ratingBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
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
    width: (width - 52) / 2, // Symmetric grid matching Services layout
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
  logoutRow: {
    paddingVertical: 16,
    marginTop: 10,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  
  // MODAL STYLING
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Slate-900 overlay backdrop
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
