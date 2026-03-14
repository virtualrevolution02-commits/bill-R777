import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({
    totalBills: 0,
    totalEarnings: 0,
    todayBills: 0,
    todayEarnings: 0,
  });

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      const stored = await AsyncStorage.getItem("offline_bills");
      if (stored) {
        const parsed = JSON.parse(stored);
        const today = new Date();
        const todayKey = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        
        let totalEarnings = 0;
        let todayBills = 0;
        let todayEarnings = 0;

        parsed.forEach((bill: any) => {
          const amount = parseFloat(bill.finalBalance) || 0;
          totalEarnings += amount;
          
          const d = new Date(bill.date);
          const dateKey = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
          
          if (dateKey === todayKey) {
            todayBills++;
            todayEarnings += amount;
          }
        });

        setStats({
          totalBills: parsed.length,
          totalEarnings,
          todayBills,
          todayEarnings,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryGrid}>
          <View style={styles.statCardFull}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Lifetime Earnings</Text>
              <MaterialCommunityIcons name="wallet-outline" size={24} color="#FFC107" />
            </View>
            <Text style={styles.largeValue}>₹{stats.totalEarnings.toLocaleString()}</Text>
            <View style={styles.divider} />
            <Text style={styles.subLabel}>From {stats.totalBills} vehicles serviced</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Today</Text>
              <Text style={styles.statValue}>₹{stats.todayEarnings.toLocaleString()}</Text>
              <Text style={styles.statSubText}>{stats.todayBills} vehicles</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avg / Vehicle</Text>
              <Text style={styles.statValue}>
                ₹{stats.totalBills > 0 ? Math.round(stats.totalEarnings / stats.totalBills).toLocaleString() : 0}
              </Text>
              <Text style={styles.statSubText}>Per service</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Feather name="check-circle" size={18} color="#4CAF50" />
            <Text style={styles.infoText}>Data synced from your local history</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="shield" size={18} color="#2196F3" />
            <Text style={styles.infoText}>Your financial records are kept private</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
    backgroundColor: "#0F0F0F",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 20,
  },
  summaryGrid: {
    gap: 16,
  },
  statCardFull: {
    backgroundColor: "#1E1E1E",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2C2C2C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: "#A0A0A0",
  },
  largeValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    color: "#FFFFFF",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 16,
  },
  subLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#666",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#A0A0A0",
    marginBottom: 8,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#FFC107",
    marginBottom: 4,
  },
  statSubText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#666",
  },
  infoSection: {
    marginTop: 40,
    gap: 16,
    paddingHorizontal: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#888",
  },
});
