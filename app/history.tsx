import React, { useState } from "react";
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Platform, Alert, Animated } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGarage } from "@/context/GarageContext";
import { useFocusEffect } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "@/context/ThemeContext";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const [bills, setBills] = useState<any[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const { loadBill, businessDetails } = useGarage();

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

  const exportHistoryPDF = async () => {
    try {
      const stored = await AsyncStorage.getItem("offline_bills");
      if (!stored) {
        Alert.alert("Empty History", "No bills found to export.");
        return;
      }
      const parsed = JSON.parse(stored);
      parsed.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Inter', -apple-system, sans-serif; padding: 20px; color: #1a1a1a; background-color: #fff; line-height: 1.4; }
              .header-section { border-bottom: 3px solid #E53935; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
              .shop-info h1 { margin: 0; color: #E53935; font-size: 26px; letter-spacing: 2px; font-weight: 800; text-transform: uppercase; }
              .report-info { text-align: right; color: #000; font-size: 13px; font-weight: 700; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background-color: #f8f8f8; color: #666; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 1px; padding: 10px 8px; border-bottom: 2px solid #eee; text-align: left; }
              td { padding: 10px 8px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #333; }
              .currency { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
              .footer-totals { margin-top: 25px; border-top: 2px solid #1a1a1a; padding-top: 15px; display: flex; justify-content: flex-end; }
              .total-box { background-color: #fdf2f2; border: 1px solid #ffcfcf; padding: 15px 25px; border-radius: 10px; text-align: right; }
              .total-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 4px; font-weight: 700; letter-spacing: 0.5px; }
              .total-amount { font-size: 24px; color: #E53935; font-weight: 900; }
              .bill-row:nth-child(even) { background-color: #fafafa; }
              .summary-stats { display: flex; gap: 30px; margin-top: 30px; padding: 15px; background-color: #fafafa; border: 1px solid #eee; border-radius: 12px; }
              .stat-item { flex: 1; }
              .stat-key { font-size: 10px; color: #888; text-transform: uppercase; margin-bottom: 4px; font-weight: 800; letter-spacing: 0.5px; }
              .stat-val { font-size: 18px; color: #1a1a1a; font-weight: 800; }
            </style>
          </head>
          <body>
            <div class="header-section">
              <div class="shop-info">
                <h1>${businessDetails.shopName.toUpperCase()}</h1>
                <p style="font-size: 14px; margin-top: 5px; font-weight: 800; color: #000;">
                  ${businessDetails.ownerName} &bull; ${businessDetails.instagramId}
                </p>
                <div style="font-size: 12px; color: #333; margin-top: 5px; font-weight: 700;">
                  Cell: ${businessDetails.phoneNumbers}
                </div>
                <div style="font-size: 11px; color: #444; margin-top: 3px; font-weight: 500;">${businessDetails.shopAddress}</div>
              </div>
              <div class="report-info" style="color: #000; font-weight: 700;">
                Generated: ${new Date().toLocaleDateString('en-IN')}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 15%">DATE</th>
                  <th style="width: 12%">BILL ID</th>
                  <th>CUSTOMER</th>
                  <th style="width: 20%">VEHICLE NO</th>
                  <th class="currency" style="width: 15%">TOTAL (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${parsed.map((bill: any) => {
                  const billTotal = parseFloat((bill.total || 0).toString());
                  const d = new Date(bill.date);
                  return `
                    <tr class="bill-row">
                      <td>${d.toLocaleDateString('en-IN')}</td>
                      <td style="font-family: monospace;">${bill.id.toString().padStart(3, '0')}</td>
                      <td style="font-weight: 500;">${bill.customerName || '—'}</td>
                      <td style="font-family: monospace; font-weight: 600; color: #555;">${bill.vehicleNumber || '—'}</td>
                      <td class="currency">₹${billTotal.toLocaleString('en-IN')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="summary-stats">
              <div class="stat-item">
                <div class="stat-key">Total Vehicles</div>
                <div class="stat-val">${parsed.length}</div>
              </div>
              <div class="stat-item">
                <div class="stat-key">Labour Volume</div>
                <div class="stat-val">₹${parsed.reduce((acc: number, b: any) => {
                  const bi = b.items || b;
                  return acc + (bi.labourItems || bi.labour || []).reduce((s: number, i: any) => s + parseFloat(i.price || 0), 0);
                }, 0).toLocaleString('en-IN')}</div>
              </div>
              <div class="stat-item">
                <div class="stat-key">Parts Volume</div>
                <div class="stat-val">₹${parsed.reduce((acc: number, b: any) => {
                  const bi = b.items || b;
                  return acc + (bi.cart || bi.parts || []).reduce((s: number, i: any) => s + (parseFloat(i.price || 0) * (i.quantity || 1)), 0);
                }, 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div class="footer-totals">
              <div class="total-box">
                <div class="total-label">GRAND TOTAL</div>
                <div class="total-amount">₹${parsed.reduce((acc: number, bill: any) => {
                  const billItems = bill.items || bill;
                  const parts = (billItems.cart || billItems.parts || []).reduce((s: number, i: any) => s + (parseFloat(i.price || 0) * (i.quantity || 1)), 0);
                  const labour = (billItems.labourItems || billItems.labour || []).reduce((s: number, i: any) => s + parseFloat(i.price || 0), 0);
                  return acc + parts + labour;
                }, 0).toLocaleString('en-IN')}</div>
              </div>
            </div>
            
            <div style="margin-top: 60px; text-align: center; color: #aaa; font-size: 10px;">
              Generated via ${businessDetails.shopName.toUpperCase()} Dashboard &bull; All rights reserved
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (err) {
      console.error(err);
      Alert.alert("Export Error", "Failed to generate PDF history.");
    }
  };

  const handleEditBill = (bill: any) => {
    loadBill(bill);
    router.navigate("/home");
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.card }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Service History</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.accent }]} onPress={exportHistoryPDF} activeOpacity={0.8}>
          <MaterialCommunityIcons name="file-download-outline" size={24} color="#FFF" />
        </TouchableOpacity>
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
                  <Feather name="trending-up" size={24} color={colors.secondary} />
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
                  <Feather name="trash-2" size={24} color={colors.text} />
                </Animated.View>
              </TouchableOpacity>
            );
          };

          return (
            <View style={[styles.swipeContainer, { backgroundColor: colors.primary }]}>
              <Swipeable renderRightActions={renderRightActions} containerStyle={styles.swipeableWrapper} overshootRight={false}>
                <View style={[styles.billCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity 
                    style={styles.billCardClickable}
                    onPress={() => router.push({ pathname: "/history-detail", params: { billId: item.id } })}
                    activeOpacity={0.9}
                  >
                    <View style={styles.billHeader}>
                      <Text style={[styles.customerName, { color: colors.text }]}>{item.customerName || "Unknown Customer"}</Text>
                      <Text style={[styles.billNumberText, { color: colors.secondary, backgroundColor: isDark ? "rgba(255, 193, 7, 0.1)" : "rgba(255, 152, 0, 0.1)" }]}>{item.id.toString().padStart(3, '0')}</Text>
                    </View>
                    <View style={styles.billSubHeader}>
                      <Text style={[styles.vehicleNumber, { color: colors.subtext }]}>{item.vehicleNumber || "N/A"}</Text>
                      <Text style={[styles.billDate, { color: colors.subtext }]}>{new Date(item.date).toLocaleDateString()}</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <View style={[styles.billFooter, { borderTopColor: colors.border }]}>
                    <Text style={[styles.billTotal, { color: colors.text }]}>₹{item.finalBalance}</Text>
                    <View style={styles.footerActions}>
                      <TouchableOpacity 
                        style={[styles.editButton, { backgroundColor: isDark ? "rgba(255, 193, 7, 0.1)" : "rgba(255, 152, 0, 0.1)", borderColor: isDark ? "rgba(255, 193, 7, 0.2)" : "rgba(255, 152, 0, 0.2)" }]}
                        onPress={() => handleEditBill(item)}
                      >
                        <Feather name="edit-2" size={14} color={colors.secondary} />
                        <Text style={[styles.editButtonText, { color: colors.secondary }]}>Edit Bill</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => router.push({ pathname: "/history-detail", params: { billId: item.id } })}>
                        <Feather name="chevron-right" size={20} color={colors.subtext} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
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
            <View style={[styles.sectionHeader, { backgroundColor: isDark ? "#161616" : "#E0E0E0", borderColor: colors.border }]}>
              <Text style={[styles.sectionDate, { color: colors.text }]}>{displayDate}</Text>
              <View style={[styles.countBadge, { backgroundColor: isDark ? "rgba(255, 193, 7, 0.1)" : "rgba(255, 152, 0, 0.1)", borderColor: colors.border }]}>
                <Text style={[styles.countText, { color: colors.secondary }]}>{section.data.length} {section.data.length === 1 ? 'bill' : 'bills'}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="clock" size={48} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>No history found</Text>
          </View>
        }
      />
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
    zIndex: 10,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  todaySummary: {
    marginTop: 8,
    marginBottom: 4,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.1,
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
    color: colors.text,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.accent,
    zIndex: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: -16,
  },
  sectionDate: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.text,
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
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  billCardClickable: {
    marginBottom: 0,
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
    color: colors.text,
    flex: 1,
  },
  billNumberText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: "#FFC107",
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  billSubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  billDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#888888",
  },
  vehicleNumber: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#AAAAAA",
  },
  billFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  billTotal: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: colors.text,
  },
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.2)",
  },
  editButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFC107",
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
