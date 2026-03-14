import React, { useState } from "react";
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [bills, setBills] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadBills();
    }, [])
  );

  const loadBills = async () => {
    try {
      const stored = await AsyncStorage.getItem("offline_bills");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sort newest first
        parsed.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        const grouped: { [key: string]: any[] } = {};
        const dateKeys: string[] = [];
        
        parsed.forEach((bill: any) => {
          const d = new Date(bill.date);
          const dateKey = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
          
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
            dateKeys.push(dateKey);
          }
          grouped[dateKey].push(bill);
        });

        const sections = dateKeys.map(dateKey => ({
          dateString: dateKey,
          data: grouped[dateKey]
        }));

        setBills(sections);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={{ width: 40 }} />
      </View>

      <SectionList
        sections={bills}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.billCard}
            onPress={() => router.push({ pathname: "/history-detail", params: { billId: item.id } })}
          >
            <View style={styles.billHeader}>
              <Text style={styles.customerName}>{item.customerName || "Unknown Customer"}</Text>
              <Text style={styles.billDate}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.vehicleNumber}>{item.vehicleNumber || "N/A"}</Text>
            
            <View style={styles.billFooter}>
              <Text style={styles.billTotal}>Total: ₹{item.finalBalance}</Text>
              <Feather name="chevron-right" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section }) => {
          const today = new Date();
          const todayKey = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayKey = `${yesterday.getDate().toString().padStart(2, '0')}/${(yesterday.getMonth() + 1).toString().padStart(2, '0')}/${yesterday.getFullYear()}`;

          let displayDate = section.dateString;
          if (section.dateString === todayKey) displayDate = `Today (${section.dateString})`;
          else if (section.dateString === yesterdayKey) displayDate = `Yesterday (${section.dateString})`;

          return (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionDate}>{displayDate}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{section.data.length} {section.data.length === 1 ? 'bill' : 'bills'}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="clock" size={48} color="#444" />
            <Text style={styles.emptyText}>No history found</Text>
          </View>
        }
      />
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sectionDate: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#888888",
  },
  countBadge: {
    backgroundColor: "#2C2C2C",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#FFC107",
  },
  billCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  customerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  billDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#888888",
  },
  vehicleNumber: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#FFC107",
    marginBottom: 12,
  },
  billFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 12,
  },
  billTotal: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    gap: 16,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: "#888888",
  },
});
