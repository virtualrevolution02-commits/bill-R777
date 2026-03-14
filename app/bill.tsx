import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useGarage } from "@/context/GarageContext";
import ViewShot from "react-native-view-shot";

function BillRow({
  label,
  price,
  bold,
  onPriceChange,
  onRemove,
}: {
  label: string;
  price: number;
  bold?: boolean;
  onPriceChange?: (newPrice: string) => void;
  onRemove?: () => void;
}) {
  const renderRightActions = (progress: any, dragX: any) => {
    if (!onRemove) return null;
    const trans = dragX.interpolate({
      inputRange: [-60, -20, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        style={styles.deleteActionRow}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onRemove();
        }}
        activeOpacity={0.8}
      >
        <Animated.View style={{ opacity: trans, transform: [{ scale: trans }] }}>
          <Feather name="trash-2" size={20} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const rowContent = (
    <View style={[
      styles.billRow,
      bold && styles.billRowBold
    ]}>
      <Text style={[styles.billLabel, bold && styles.billLabelBold]}>
        {label}
      </Text>
      <View style={styles.priceContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        {onPriceChange ? (
          <TextInput
            style={[styles.billPriceInput, bold && styles.billPriceBold]}
            value={price.toString()}
            onChangeText={onPriceChange}
            keyboardType="numeric"
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.billPrice, bold && styles.billPriceBold]}>
            {price}
          </Text>
        )}
      </View>
    </View>
  );

  if (!onRemove) {
    return rowContent;
  }

  return (
    <View style={styles.swipeContainerRow}>
      <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
        <View style={styles.swipeInnerRow}>
          {rowContent}
        </View>
      </Swipeable>
    </View>
  );
}

export default function BillScreen() {
  const insets = useSafeAreaInsets();
  const {
    cart,
    labourItems,
    grandTotal,
    updatePartPrice,
    updateLabourPrice,
    removeFromCart,
    removeLabour,
    finalizeBill,
    advanceAmount,
    setAdvanceAmount,
    finalBalance,
    customerName,
    setCustomerName,
    vehicleNumber,
    setVehicleNumber,
    resetGarage,
  } = useGarage();

  const [isGenerating, setIsGenerating] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

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

  const handleNewBill = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Start New Bill",
      "Are you sure you want to clear current items and start a fresh bill?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Fresh",
          style: "destructive",
          onPress: () => {
            animateButton(pdfButtonScale, () => {
              resetGarage();
              router.replace("/home");
            });
          }
        }
      ]
    );
  };

  const handleWhatsApp = async () => {
    if (!customerName.trim() || !vehicleNumber.trim()) {
      Alert.alert("Details Required", "Please enter customer name and vehicle number before proceeding.");
      return;
    }

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // 1. Save bill (offline first)
      await finalizeBill();

      // Give UI a moment to settle for the capture (ensure no blinking cursors etc)
      await new Promise(resolve => setTimeout(resolve, 300));

      // 2. Capture the bill image
      let uri = "";
      if (viewShotRef.current?.capture) {
        uri = await viewShotRef.current.capture();
      }

      if (!uri) {
        throw new Error("Capture failed");
      }

      // 4. Navigate to whatsapp screen
      animateButton(waButtonScale, () => {
        setIsGenerating(false);
        router.navigate({
          pathname: "/whatsapp",
          params: { billImageUri: uri }
        });
      });
    } catch (err) {
      setIsGenerating(false);
      console.error("WhatsApp navigation failed:", err);
      Alert.alert(
        "Auto-save failed during WhatsApp navigation.",
        "Failed to save bill or capture image. Please check your data and try again."
      );
    }
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
        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => {
            Alert.alert(
              "Exit Bill",
              "Are you sure you want to exit? This will clear current bill data.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Exit",
                  style: "destructive",
                  onPress: () => {
                    resetGarage();
                    router.replace("/home");
                  }
                }
              ]
            );
          }}
        >
          <Feather name="home" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ViewShot
          ref={viewShotRef}
          options={{ format: "jpg", quality: 0.9, result: "tmpfile" }}
          style={{ backgroundColor: "#0F0F0F" }}
        >
          <View style={styles.billCard}>
            <View style={styles.customerInfoContainer}>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              <View style={styles.infoInputRow}>
                <Feather name="user" size={16} color="#A0A0A0" style={styles.infoIcon} />
                <TextInput
                  style={styles.infoInput}
                  placeholder="Customer Name"
                  placeholderTextColor="#666"
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>
              <View style={styles.infoInputRow}>
                <MaterialCommunityIcons name="car-info" size={16} color="#A0A0A0" style={styles.infoIcon} />
                <TextInput
                  style={styles.infoInput}
                  placeholder="Vehicle Number (e.g. MH 12 AB 1234)"
                  placeholderTextColor="#666"
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.sectionGap} />

            {cart.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Spare Parts</Text>
                {cart.map((item) => (
                  <BillRow
                    key={item.id}
                    label={item.name + (item.quantity > 1 ? ` x${item.quantity}` : "")}
                    price={item.price * item.quantity}
                    onPriceChange={(newPrice) => {
                      const priceNum = parseInt(newPrice) || 0;
                      updatePartPrice(item.id, Math.floor(priceNum / item.quantity));
                    }}
                    onRemove={() => {
                      Alert.alert(
                        "Remove Part",
                        `Are you sure you want to remove ${item.name}?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => removeFromCart(item.id)
                          }
                        ]
                      );
                    }}
                  />
                ))}
              </>
            )}

            <View style={styles.sectionGap} />
            <Text style={styles.sectionTitle}>Advance Payment</Text>
            <BillRow
              label="Advance Received"
              price={advanceAmount}
              onPriceChange={(newPrice) => {
                setAdvanceAmount(parseInt(newPrice) || 0);
              }}
            />

            {labourItems.length > 0 && (
              <>
                <View style={styles.sectionGap} />
                <Text style={styles.sectionTitle}>Labour</Text>
                {labourItems.map((item) => (
                  <BillRow
                    key={item.id}
                    label={item.name}
                    price={item.price}
                    onPriceChange={(newPrice) => {
                      updateLabourPrice(item.id, parseInt(newPrice) || 0);
                    }}
                    onRemove={() => {
                      Alert.alert(
                        "Remove Labour",
                        `Are you sure you want to remove ${item.name}?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => removeLabour(item.id)
                          }
                        ]
                      );
                    }}
                  />
                ))}
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.subtotalPrice}>₹{grandTotal}</Text>
            </View>

            {advanceAmount > 0 && (
              <View style={[styles.totalRow, { marginTop: 8 }]}>
                <Text style={styles.advanceLabel}>Advance</Text>
                <Text style={styles.advancePrice}>-₹{advanceAmount}</Text>
              </View>
            )}

            <View style={[styles.totalRow, { marginTop: 12 }]}>
              <Text style={styles.totalLabel}>Final Balance</Text>
              <Text style={styles.totalPrice}>₹{finalBalance}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.billFooter}>
              <View style={styles.footerContactRow}>
                <Feather name="user" size={14} color="#A0A0A0" />
                <Text style={styles.footerText}>Ragu</Text>
                <Text style={styles.footerDot}>•</Text>
                <Feather name="instagram" size={14} color="#A0A0A0" />
                <Text style={styles.footerText}>@dr._duker</Text>
              </View>
              <View style={styles.footerContactRow}>
                <Feather name="phone" size={14} color="#A0A0A0" />
                <Text style={styles.footerText}>8526808766, 8438597688</Text>
              </View>
              <View style={styles.footerContactRow}>
                <Feather name="map-pin" size={14} color="#A0A0A0" />
                <Text style={styles.footerText}>No 2B Vijaya Mangalam Sandagatai Road, Erode-638856</Text>
              </View>
            </View>
          </View>
        </ViewShot>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{cart.length}</Text>
            <Text style={styles.summaryKey}>Parts</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₹{grandTotal}</Text>
            <Text style={styles.summaryKey}>Subtotal</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>₹{finalBalance}</Text>
            <Text style={styles.summaryKey}>Balance</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale: pdfButtonScale }], marginBottom: 10 }}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#333' }]}
            onPress={handleNewBill}
            activeOpacity={0.85}
          >
            <Feather name="file-plus" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>New Bill</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: waButtonScale }] }}>
          <TouchableOpacity
            style={[styles.secondaryButton, isGenerating && { opacity: 0.7 }]}
            onPress={handleWhatsApp}
            activeOpacity={0.85}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#25D366" size="small" />
            ) : (
              <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
            )}
            <Text style={styles.secondaryButtonText}>
              {isGenerating ? "GENERATING..." : "NEXT →"}
            </Text>
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
  exitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A1F1F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(229, 57, 53, 0.3)",
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
  customerInfoContainer: {
    marginBottom: 8,
  },
  infoInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121212",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  infoIcon: {
    marginRight: 10,
  },
  infoInput: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
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
  swipeContainerRow: {
    backgroundColor: "#E53935",
  },
  swipeInnerRow: {
    backgroundColor: "#1E1E1E",
  },
  deleteActionRow: {
    width: 60,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 15,
  },
  billRowBold: {
    borderBottomWidth: 0,
  },
  billLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#FFFFFF",
    flex: 1,
    marginRight: 12,
  },
  billLabelBold: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  currencySymbol: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#FFC107",
  },
  billPrice: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#FFC107",
  },
  billPriceBold: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  billPriceInput: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: "#FFC107",
    minWidth: 60,
    textAlign: "right",
    padding: 0,
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
    fontSize: 18,
    color: "#FFFFFF",
  },
  subtotalPrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#A0A0A0",
  },
  advanceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#E53935",
  },
  advancePrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#E53935",
  },
  totalPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
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
  customAddContainer: {
    marginTop: 16,
    alignItems: "flex-start",
  },
  glassButtonWrapper: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  glassButtonBlur: {
    padding: 12,
  },
  glassButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: "#FFFFFF",
  },
  typeSelector: {
    flexDirection: "row",
    backgroundColor: "#121212",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: "#2C2C2C",
  },
  typeButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#666666",
  },
  typeButtonTextActive: {
    color: "#FFFFFF",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#A0A0A0",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#121212",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#FFFFFF",
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  submitCustomButton: {
    backgroundColor: "#E53935",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitCustomButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  billFooter: {
    marginTop: 8,
    gap: 6,
    alignItems: "center",
  },
  footerContactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#A0A0A0",
    textAlign: "center",
  },
  footerDot: {
    color: "#A0A0A0",
    fontSize: 12,
    marginHorizontal: 4,
  },
});
