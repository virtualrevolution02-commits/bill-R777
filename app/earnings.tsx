import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@/context/ThemeContext";

export default function EarningsScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({
    totalBills: 0,
    totalEarnings: 0,
    totalSpare: 0,
    totalLabour: 0,
    todayBills: 0,
    todayEarnings: 0,
    todaySpare: 0,
    todayLabour: 0,
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
        let totalSpare = 0;
        let totalLabour = 0;
        let todayBills = 0;
        let todayEarnings = 0;
        let todaySpare = 0;
        let todayLabour = 0;

        parsed.forEach((bill: any) => {
          const cart = bill.items?.cart || [];
          const labour = bill.items?.labourItems || [];
          
          const billSpare = cart.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
          const billLabour = labour.reduce((sum: number, item: any) => sum + parseFloat(item.price), 0);
          
          totalEarnings += (billSpare + billLabour);
          totalSpare += billSpare;
          totalLabour += billLabour;
          
          const d = new Date(bill.date);
          const dateKey = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
          
          if (dateKey === todayKey) {
            todayBills++;
            todayEarnings += (billSpare + billLabour);
            todaySpare += billSpare;
            todayLabour += billLabour;
          }
        });

        setStats({
          totalBills: parsed.length,
          totalEarnings,
          totalSpare,
          totalLabour,
          todayBills,
          todayEarnings,
          todaySpare,
          todayLabour,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Earnings Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryGrid}>
          <View style={[styles.statCardFull, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardLabel, { color: colors.subtext }]}>Lifetime Earnings</Text>
              <MaterialCommunityIcons name="wallet-outline" size={24} color={colors.secondary} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={[styles.largeValue, { color: colors.text }]}>₹{stats.totalEarnings.toLocaleString()}</Text>
              <View style={[styles.countBadge, { borderColor: colors.border }]}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.secondary }}>{stats.totalBills} Bills</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={[styles.breakdownLabel, { color: colors.subtext }]}>Labour</Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>₹{stats.totalLabour.toLocaleString()}</Text>
              </View>
              <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />
              <View style={styles.breakdownItem}>
                <Text style={[styles.breakdownLabel, { color: colors.subtext }]}>Spares</Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>₹{stats.totalSpare.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>Today&apos;s Earnings</Text>
          </View>

          <View style={styles.cardGroup}>
            <View style={[styles.statCardCategory, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.categoryIcon, { backgroundColor: isDark ? "#161616" : "#F5F5F5", borderColor: colors.border }]}>
                <Feather name="tool" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.categoryLabel, { color: colors.subtext }]}>Labour Income</Text>
                <Text style={[styles.categoryValue, { color: colors.text }]}>₹{stats.todayLabour.toLocaleString()}</Text>
              </View>
            </View>

            <View style={[styles.statCardCategory, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.categoryIcon, { backgroundColor: isDark ? "#161616" : "#F5F5F5", borderColor: colors.border }]}>
                <Feather name="settings" size={20} color={colors.secondary} />
              </View>
              <View>
                <Text style={[styles.categoryLabel, { color: colors.subtext }]}>Spares Income</Text>
                <Text style={[styles.categoryValue, { color: colors.text }]}>₹{stats.todaySpare.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Total Today</Text>
              <Text style={[styles.statValue, { color: colors.secondary }]}>₹{stats.todayEarnings.toLocaleString()}</Text>
              <Text style={[styles.statSubText, { color: colors.subtext }]}>{stats.todayBills} vehicles</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>Completed Total</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalBills}</Text>
              <Text style={[styles.statSubText, { color: colors.subtext }]}>In Lifetime</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Feather name="check-circle" size={18} color={isDark ? "#4CAF50" : "#2E7D32"} />
            <Text style={[styles.infoText, { color: colors.subtext }]}>Data synced from your local history</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="shield" size={18} color={isDark ? "#2196F3" : "#1976D2"} />
            <Text style={[styles.infoText, { color: colors.subtext }]}>Your financial records are kept private</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: colors.text,
  },
  scrollContent: {
    padding: 20,
  },
  summaryGrid: {
    gap: 16,
  },
  statCardFull: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 20,
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
    color: colors.text,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  breakdownValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: colors.text,
  },
  breakdownDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 20,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: -8,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#A0A0A0",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardGroup: {
    gap: 12,
  },
  statCardCategory: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#A0A0A0",
    marginBottom: 2,
  },
  categoryValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
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
  countBadge: {
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statSubText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#666",
  },
  infoSection: {
    marginTop: 30,
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
