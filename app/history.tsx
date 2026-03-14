import React, { useState } from "react";
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Platform, Alert, Animated } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [bills, setBills] = useState<any[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);

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
        const today = new Date();
        const todayKey = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        let todayCount = 0;
        
        parsed.forEach((bill: any) => {
          const d = new Date(bill.date);
          const dateKey = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
          
          if (dateKey === todayKey) todayCount++;

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
        setTodayTotal(todayCount);
      } else {
        setBills([]);
        setTodayTotal(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBill = (id: string) => {
    Alert.alert(
      "Delete Bill",
      "Are you sure you want to delete this bill?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem("offline_bills");
              if (stored) {
                let parsed = JSON.parse(stored);
                parsed = parsed.filter((bill: any) => bill.id !== id);
                await AsyncStorage.setItem("offline_bills", JSON.stringify(parsed));
                loadBills();
              }
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Failed to delete the bill.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={{ width: 40 }} />
      </View>

      <SectionList
        sections={bills}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={true}
        ListHeaderComponent={
          todayTotal > 0 ? (
            <View style={styles.todaySummary}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryLabel}>Today&apos;s Total Bills</Text>
                  <Text style={styles.summaryValue}>{todayTotal}</Text>
                </View>
                <View style={styles.summaryIconContainer}>
                  <Feather name="trending-up" size={24} color="#FFC107" />
                </View>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const renderRightActions = (progress: any, dragX: any) => {
            const trans = dragX.interpolate({
              inputRange: [-80, -20, 0],
              outputRange: [1, 0.5, 0],
              extrapolate: 'clamp',
            });
            return (
              <TouchableOpacity
                style={styles.deleteAction}
                onPress={() => handleDeleteBill(item.id)}
                activeOpacity={0.8}
              >
                <Animated.View style={{ opacity: trans, transform: [{ scale: trans }] }}>
                  <Feather name="trash-2" size={24} color="#FFFFFF" />
                </Animated.View>
              </TouchableOpacity>
            );
          };

          return (
            <View style={styles.swipeContainer}>
              <Swipeable renderRightActions={renderRightActions} containerStyle={styles.swipeableWrapper} overshootRight={false}>
                <TouchableOpacity 
                  style={styles.billCard}
                  onPress={() => router.push({ pathname: "/history-detail", params: { billId: item.id } })}
                  activeOpacity={0.9}
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
              </Swipeable>
            </View>
          );
        }}
        renderSectionHeader={({ section }) => {
          const today = new Date();
          const todayKey = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayKey = `${yesterday.getDate().toString().padStart(2, '0')}/${(yesterday.getMonth() + 1).toString().padStart(2, '0')}/${yesterday.getFullYear()}`;

          let displayDate = section.dateString;
          if (section.dateString === todayKey) displayDate = `Today, ${section.dateString}`;
          else if (section.dateString === yesterdayKey) displayDate = `Yesterday, ${section.dateString}`;

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
    backgroundColor: "#0F0F0F",
    zIndex: 10,
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
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  todaySummary: {
    marginTop: 8,
    marginBottom: 4,
  },
  summaryCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2C2C2C",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  summaryInfo: {
    gap: 4,
  },
  summaryLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#A0A0A0",
  },
  summaryValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: "#FFFFFF",
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#161616",
    zIndex: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: -16,
  },
  sectionDate: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  countBadge: {
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.2)",
  },
  countText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#FFC107",
  },
  swipeContainer: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#E53935",
  },
  swipeableWrapper: {
    borderRadius: 16,
  },
  deleteAction: {
    width: 80,
    height: "100%",
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  billCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2C2C2C",
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
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
    marginBottom: 14,
  },
  billFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
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
