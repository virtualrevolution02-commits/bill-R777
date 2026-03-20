import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/ThemeContext";

export default function HistoryDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const { billId } = useLocalSearchParams();
  const [bill, setBill] = useState<any>(null);

  useEffect(() => {
    const loadBill = async () => {
      try {
        const stored = await AsyncStorage.getItem("offline_bills");
        if (stored) {
          const parsed = JSON.parse(stored);
          const found = parsed.find((b: any) => b.id === billId);
          if (found) setBill(found);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadBill();
  }, [billId]);

  if (!bill) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={[styles.loadingText, { color: colors.subtext }]}>Fetching record...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Bill {bill.id.toString().padStart(3, '0')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.infoRowTop}>
             <View style={styles.infoCol}>
                <Text style={[styles.label, { color: colors.subtext }]}>Customer Name</Text>
                <Text style={[styles.value, { color: colors.text }]}>{bill.customerName || "N/A"}</Text>
             </View>
             <MaterialCommunityIcons name="account-details-outline" size={24} color={colors.subtext} />
          </View>
          
          <View style={[styles.dividerSmall, { backgroundColor: colors.border }]} />
          
          <View style={styles.infoRowTop}>
             <View style={styles.infoCol}>
                <Text style={[styles.label, { color: colors.subtext }]}>Vehicle Number</Text>
                <Text style={[styles.value, { color: colors.text }]}>{bill.vehicleNumber || "N/A"}</Text>
             </View>
             <MaterialCommunityIcons name="car-cog" size={24} color={colors.subtext} />
          </View>
          
          <View style={[styles.dividerSmall, { backgroundColor: colors.border }]} />
          
          <View style={styles.infoRowTop}>
             <View style={styles.infoCol}>
               <Text style={[styles.label, { color: colors.subtext }]}>Date & Time</Text>
               <Text style={[styles.value, { color: colors.text }]}>{new Date(bill.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
             </View>
             <MaterialCommunityIcons name="calendar-clock" size={24} color={colors.subtext} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>Items</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {bill.items?.cart?.map((item: any) => (
            <View key={item.id} style={styles.row}>
              <Text style={[styles.itemText, { color: colors.text }]}>{item.name} (x{item.quantity})</Text>
              <Text style={[styles.itemPrice, { color: colors.secondary }]}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          {bill.items?.labourItems?.map((item: any) => (
            <View key={item.id} style={styles.row}>
              <Text style={[styles.itemText, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.itemPrice, { color: colors.secondary }]}>₹{item.price}</Text>
            </View>
          ))}
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.row}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Subtotal</Text>
            <Text style={[styles.subtotalPrice, { color: colors.subtext }]}>₹{bill.total}</Text>
          </View>
          {bill.advance > 0 && (
            <View style={[styles.row, { marginTop: 8 }]}>
              <Text style={[styles.advanceLabel, { color: colors.primary }]}>Advance Paid</Text>
              <Text style={[styles.advancePrice, { color: colors.primary }]}>-₹{bill.advance}</Text>
            </View>
          )}
          <View style={[styles.row, { marginTop: 12 }]}>
            <Text style={[styles.finalTotal, { color: colors.text }]}>Final Balance</Text>
            <Text style={[styles.finalTotalPrice, { color: colors.text }]}>₹{bill.finalBalance}</Text>
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
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#666",
    marginTop: 12,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#A0A0A0",
    marginBottom: 4,
  },
  value: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.text,
  },
  infoRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoCol: {
    flex: 1,
  },
  dividerSmall: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    marginVertical: 14,
  },
  gap: {
    height: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#A0A0A0",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  itemText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.text,
    paddingRight: 16,
  },
  itemPrice: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#FFC107",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  totalLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.text,
  },
  subtotalPrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#A0A0A0",
  },
  advanceLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: "#E53935",
  },
  advancePrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#E53935",
  },
  finalTotal: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: colors.text,
  },
  finalTotalPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: colors.text,
  },
});
