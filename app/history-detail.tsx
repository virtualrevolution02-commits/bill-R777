import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HistoryDetailScreen() {
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
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#FFC107" />
        <Text style={styles.loadingText}>Fetching record...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.infoRowTop}>
             <View style={styles.infoCol}>
                <Text style={styles.label}>Customer Name</Text>
                <Text style={styles.value}>{bill.customerName || "N/A"}</Text>
             </View>
             <MaterialCommunityIcons name="account-details-outline" size={24} color="#555" />
          </View>
          
          <View style={styles.dividerSmall} />
          
          <View style={styles.infoRowTop}>
             <View style={styles.infoCol}>
                <Text style={styles.label}>Vehicle Number</Text>
                <Text style={styles.value}>{bill.vehicleNumber || "N/A"}</Text>
             </View>
             <MaterialCommunityIcons name="car-cog" size={24} color="#555" />
          </View>
          
          <View style={styles.dividerSmall} />
          
          <View style={styles.infoRowTop}>
             <View style={styles.infoCol}>
               <Text style={styles.label}>Date & Time</Text>
               <Text style={styles.value}>{new Date(bill.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
             </View>
             <MaterialCommunityIcons name="calendar-clock" size={24} color="#555" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Items</Text>
        <View style={styles.card}>
          {bill.items?.cart?.map((item: any) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.itemText}>{item.name} (x{item.quantity})</Text>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          {bill.items?.labourItems?.map((item: any) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.itemText}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>
          ))}
          
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.subtotalPrice}>₹{bill.total}</Text>
          </View>
          {bill.advance > 0 && (
            <View style={[styles.row, { marginTop: 8 }]}>
              <Text style={styles.advanceLabel}>Advance Paid</Text>
              <Text style={styles.advancePrice}>-₹{bill.advance}</Text>
            </View>
          )}
          <View style={[styles.row, { marginTop: 12 }]}>
            <Text style={styles.finalTotal}>Final Balance</Text>
            <Text style={styles.finalTotalPrice}>₹{bill.finalBalance}</Text>
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
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
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
    color: "#FFFFFF",
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
    color: "#FFFFFF",
    paddingRight: 16,
  },
  itemPrice: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#FFC107",
  },
  divider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 16,
  },
  totalLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
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
    color: "#FFFFFF",
  },
  finalTotalPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#FFFFFF",
  },
});
