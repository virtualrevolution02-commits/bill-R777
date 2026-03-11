import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Share,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useGarage } from "@/context/GarageContext";

function BillRow({
  label,
  price,
  bold,
}: {
  label: string;
  price: number;
  bold?: boolean;
}) {
  return (
    <View style={[styles.billRow, bold && styles.billRowBold]}>
      <Text style={[styles.billLabel, bold && styles.billLabelBold]}>
        {label}
      </Text>
      <Text style={[styles.billPrice, bold && styles.billPriceBold]}>
        ₹{price}
      </Text>
    </View>
  );
}

export default function BillScreen() {
  const insets = useSafeAreaInsets();
  const { cart, labourItems, grandTotal, cartTotal } = useGarage();

  const pdfButtonScale = useRef(new Animated.Value(1)).current;
  const waButtonScale = useRef(new Animated.Value(1)).current;

  const animateButton = (anim: Animated.Value, callback: () => void) => {
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.94,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const buildBillText = () => {
    let text = "R777 GARAGE BILL\n";
    text += "─────────────────\n\n";
    if (cart.length > 0) {
      text += "SPARE PARTS\n";
      cart.forEach((item) => {
        const line = `${item.name}`;
        const price = `₹${item.price * item.quantity}`;
        text += `${line.padEnd(20)}${price}\n`;
      });
      text += "\n";
    }
    if (labourItems.length > 0) {
      text += "LABOUR\n";
      labourItems.forEach((item) => {
        const line = item.name;
        const price = `₹${item.price}`;
        text += `${line.padEnd(20)}${price}\n`;
      });
      text += "\n";
    }
    text += "─────────────────\n";
    text += `${"TOTAL".padEnd(20)}₹${grandTotal}`;
    return text;
  };

  const handleDownloadPDF = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    animateButton(pdfButtonScale, () => {
      Alert.alert(
        "Bill Saved",
        "Your R777 Garage bill has been saved successfully.",
        [{ text: "OK" }]
      );
    });
  };

  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateButton(waButtonScale, () => {
      router.push("/whatsapp");
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? 67 : insets.top,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerR}>R777</Text>
          <Text style={styles.headerAccent}>
            <Text style={styles.headerGarage}>GARAGE</Text>
          </Text>
          <Text style={styles.headerBill}> BILL</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.billCard}>
          {cart.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Spare Parts</Text>
              {cart.map((item) => (
                <BillRow
                  key={item.id}
                  label={item.name + (item.quantity > 1 ? ` x${item.quantity}` : "")}
                  price={item.price * item.quantity}
                />
              ))}
            </>
          )}

          {labourItems.length > 0 && (
            <>
              <View style={styles.sectionGap} />
              <Text style={styles.sectionTitle}>Labour</Text>
              {labourItems.map((item) => (
                <BillRow key={item.id} label={item.name} price={item.price} />
              ))}
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>₹{grandTotal}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{cart.length}</Text>
            <Text style={styles.summaryKey}>Parts</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₹{cartTotal}</Text>
            <Text style={styles.summaryKey}>Parts Total</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₹{grandTotal}</Text>
            <Text style={styles.summaryKey}>Grand Total</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale: pdfButtonScale }], marginBottom: 10 }}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleDownloadPDF}
            activeOpacity={0.85}
          >
            <Feather name="download" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Download PDF</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: waButtonScale }] }}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleWhatsApp}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
            <Text style={styles.secondaryButtonText}>Send WhatsApp</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  headerR: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#E53935",
    letterSpacing: 2,
  },
  headerAccent: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#FFFFFF",
  },
  headerGarage: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  headerBill: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#A0A0A0",
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 16,
  },
  billCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 20,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#A0A0A0",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  sectionGap: {
    height: 16,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  billRowBold: {
    borderBottomWidth: 0,
  },
  billLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#FFFFFF",
  },
  billLabelBold: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  billPrice: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#FFC107",
  },
  billPriceBold: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#FFC107",
  },
  divider: {
    height: 1,
    backgroundColor: "#333333",
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#FFFFFF",
  },
  totalPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: "#FFFFFF",
  },
  summaryRow: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    gap: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#2A2A2A",
    marginVertical: 12,
  },
  summaryValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  summaryKey: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  primaryButton: {
    backgroundColor: "#E53935",
    borderRadius: 18,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  secondaryButton: {
    backgroundColor: "#1E1E1E",
    borderRadius: 18,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#25D366",
  },
  secondaryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});
