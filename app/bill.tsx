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
  Image,
} from "react-native";
import Reanimated, { FadeInDown } from "react-native-reanimated";
import * as FileSystem from "expo-file-system";
import { Swipeable } from "react-native-gesture-handler";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import * as Haptics from "expo-haptics";
import ViewShot from "react-native-view-shot";
import { useTheme } from "@/context/ThemeContext";
import { useGarage } from "@/context/GarageContext";

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
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
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
      <Text style={[styles.billLabel, bold && styles.billLabelBold, { color: colors.text }]}>
        {label}
      </Text>
      <View style={styles.priceContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        {onPriceChange ? (
          <TextInput
            style={[styles.billPriceInput, bold && styles.billPriceBold, { color: colors.secondary }]}
            value={price.toString()}
            onChangeText={onPriceChange}
            keyboardType="numeric"
            selectTextOnFocus
          />
        ) : (
          <Text style={[styles.billPrice, bold && styles.billPriceBold, { color: colors.secondary }]}>
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
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const {
    cart,
    labourItems,
    cartTotal,
    labourTotal,
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
    lastMeter,
    setLastMeter,
    nextMeter,
    setNextMeter,
    resetGarage,
    currentBillId,
    nextBillNumber,
    businessDetails,
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

  const handleDownloadPDF = async () => {
    if (!customerName.trim() || !vehicleNumber.trim()) {
      Alert.alert("Details Required", "Please enter customer name and vehicle number before proceeding.");
      return;
    }

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let logoBase64 = '';
    if (businessDetails.shopLogo) {
      try {
        logoBase64 = await FileSystem.readAsStringAsync(businessDetails.shopLogo, {
          encoding: 'base64',
        });
      } catch (e) {
        console.warn("Failed to read logo for PDF:", e);
      }
    }

    try {
      // 1. Save bill
      await finalizeBill();
      
      const billId = currentBillId || nextBillNumber.toString();

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Inter', -apple-system, sans-serif; padding: 20px; color: #1a1a1a; background-color: #fff; line-height: 1.4; }
              .header { text-align: center; border-bottom: 3px solid #E53935; padding-bottom: 10px; margin-bottom: 15px; }
              .header h1 { margin: 0; color: #E53935; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; }
              .header p { margin: 2px 0; font-size: 13px; color: #555; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
              .bill-info { display: flex; justify-content: space-between; margin-bottom: 15px; background-color: #fcfcfc; border: 1px solid #f0f0f0; padding: 12px; border-radius: 10px; }
              .info-col { flex: 1; }
              .info-label { font-size: 9px; color: #555; text-transform: uppercase; margin-bottom: 2px; font-weight: 800; letter-spacing: 0.5px; }
              .info-val { font-size: 14px; font-weight: 700; color: #000; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background-color: #f8f8f8; border-bottom: 2px solid #eee; padding: 10px 8px; text-align: left; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
              td { padding: 8px; border-bottom: 1px solid #f6f6f6; font-size: 13px; color: #333; }
              .currency { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
              .totals-container { margin-top: 20px; border-top: 2px solid #1a1a1a; padding-top: 10px; }
              .total-row { display: flex; justify-content: flex-end; margin-bottom: 6px; align-items: center; }
              .total-label { width: 180px; text-align: right; font-size: 13px; color: #666; font-weight: 600; }
              .total-val { width: 120px; text-align: right; font-size: 15px; font-weight: 700; color: #1a1a1a; }
              .grand-total { border-top: 1px solid #eee; padding-top: 8px; margin-top: 4px; }
              .grand-total .total-label { color: #000; font-weight: 800; font-size: 14px; }
              .grand-total .total-val { color: #E53935; font-size: 22px; font-weight: 900; }
              .balance-row { background-color: #f1f8f1; border: 1px solid #e1eee1; padding: 8px; border-radius: 8px; margin-top: 8px; }
              .balance-row .total-label { color: #1b5e20; font-weight: 700; }
              .balance-row .total-val { color: #1b5e20; font-size: 18px; font-weight: 800; }
              .footer-signature { margin-top: 40px; display: flex; justify-content: space-between; padding: 0 40px; }
              .sig-line { width: 160px; border-top: 2px solid #ddd; text-align: center; padding-top: 6px; font-size: 10px; color: #666; font-weight: 700; text-transform: uppercase; }
            </style>
          </head>
          <body>
            <div class="header-section" style="border-bottom: 3px solid #E53935; padding-bottom: 12px; margin-bottom: 15px; position: relative; min-height: 45px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 4px;">
              ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" style="width: 32px; height: 32px; border-radius: 4px; position: absolute; left: 0; top: 0;" />` : ''}
              <div style="width: 100%; box-sizing: border-box; padding: 0 60px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <h1 style="margin: 0; color: #E53935; font-size: 34px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; text-align: center; width: 100%; white-space: nowrap; line-height: 1.1;">${(businessDetails.shopName || 'MOTORCYCLE HUB').toUpperCase()}</h1>
                ${businessDetails.shopDescription ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #555; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: center; width: 100%; white-space: nowrap;">${businessDetails.shopDescription}</p>` : ''}
                ${(businessDetails.ownerName || businessDetails.instagramId) ? `
                  <div style="margin-top: 4px; font-size: 12px; color: #000; font-weight: 800; text-align: center; width: 100%;">
                    ${businessDetails.ownerName}${ (businessDetails.ownerName && businessDetails.instagramId) ? ' &bull; ' : '' }${businessDetails.instagramId}
                  </div>
                ` : ''}
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px; color: #555; font-weight: 600;">
              ${businessDetails.shopAddress ? `<div>${businessDetails.shopAddress}</div>` : '<div></div>'}
              ${businessDetails.phoneNumbers ? `<div>Cell: ${businessDetails.phoneNumbers}</div>` : '<div></div>'}
            </div>

            <div class="bill-info">
              <div class="info-col">
                <div class="info-label">Customer Details</div>
                <div class="info-val">${customerName}</div>
                <div class="info-val" style="margin-top: 4px; color: #555;">${vehicleNumber}</div>
              </div>
              <div class="info-col" style="text-align: right;">
                <div class="info-label">Invoice</div>
                <div class="info-val">${billId.toString().padStart(3, '0')}</div>
                <div class="info-label" style="margin-top: 10px;">Date</div>
                <div class="info-val">${new Date().toLocaleDateString('en-IN')}</div>
              </div>
            </div>

            <div style="display: flex; gap: 40px; margin-bottom: 25px; padding: 0 15px;">
              <div>
                <div class="info-label">Odometer (Current)</div>
                <div class="info-val">${lastMeter || '0'} KM</div>
              </div>
              <div>
                <div class="info-label">Next Service Due</div>
                <div class="info-val">${nextMeter || '—'} KM</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="currency" style="width: 60px;">Qty</th>
                  <th class="currency" style="width: 100px;">Price</th>
                  <th class="currency" style="width: 120px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${cart.map(item => `
                  <tr>
                    <td style="font-weight: 500;">${item.name}</td>
                    <td class="currency">${item.quantity || 1}</td>
                    <td class="currency">₹${parseFloat(item.price.toString()).toLocaleString('en-IN')}</td>
                    <td class="currency">₹${(parseFloat(item.price.toString()) * (item.quantity || 1)).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
                ${labourItems.map(item => `
                  <tr>
                    <td style="font-weight: 500; font-style: italic; color: #555;">Labour: ${item.name}</td>
                    <td class="currency">1</td>
                    <td class="currency">₹${parseFloat(item.price.toString()).toLocaleString('en-IN')}</td>
                    <td class="currency">₹${parseFloat(item.price.toString()).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals-container">
              <div class="total-row">
                <div class="total-label">Spare Parts Subtotal:</div>
                <div class="total-val">₹${cartTotal.toLocaleString('en-IN')}</div>
              </div>
              <div class="total-row">
                <div class="total-label">Labour Subtotal:</div>
                <div class="total-val">₹${labourTotal.toLocaleString('en-IN')}</div>
              </div>
              <div class="total-row grand-total">
                <div class="total-label">GRAND TOTAL:</div>
                <div class="total-val">₹${grandTotal.toLocaleString('en-IN')}</div>
              </div>
              <div class="total-row">
                <div class="total-label">Advance Payment:</div>
                <div class="total-val">₹${advanceAmount.toLocaleString('en-IN')}</div>
              </div>
              <div class="total-row balance-row">
                <div class="total-label">AMOUNT PAYABLE:</div>
                <div class="total-val">₹${finalBalance.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div class="footer-signature">
              <div class="sig-line">Customer Signature</div>
              <div class="sig-line">Authorized Signature</div>
            </div>

            <p style="margin-top: 60px; text-align: center; color: #aaa; font-size: 11px;">
              Thank you for choosing ${(businessDetails.shopName || 'MOTORCYCLE HUB').toUpperCase()}! Ride safe and visit us again.
            </p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      setIsGenerating(false);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      Alert.alert("Export Error", "Failed to generate PDF bill.");
    }
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
          backgroundColor: colors.background,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerBill, { color: colors.subtext, fontSize: 18, fontFamily: "Inter_700Bold" }]}>BILL</Text>
        </View>
        <TouchableOpacity
          style={[styles.exitButton, { backgroundColor: isDark ? "#2A1F1F" : "#FFE0E0" }]}
          onPress={() => {
            Alert.alert(
              "Exit Bill",
              "Are you sure you want to return to Home?",
              [
                { text: "Stay", style: "cancel" },
                { 
                  text: "Exit", 
                  style: "destructive", 
                  onPress: () => router.replace("/home") 
                }
              ]
            );
          }}
        >
          <Feather name="home" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <ViewShot
          ref={viewShotRef}
          options={{ format: "jpg", quality: 0.9, result: "tmpfile" }}
          style={{ backgroundColor: colors.background }}
        >
          <Reanimated.View 
            entering={FadeInDown.springify().damping(22).mass(0.8)}
            style={[styles.billCard, { backgroundColor: colors.card }]}
          >
                <View style={[styles.shopHeader, { borderBottomColor: colors.border, paddingBottom: 10, paddingTop: 5 }]}>
                  <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 50 }}>
                    {businessDetails.shopLogo && (
                      <Image 
                        source={{ uri: businessDetails.shopLogo }} 
                        style={[styles.billLogo, { position: 'absolute', left: 0, top: 0, width: 32, height: 32, marginTop: 0, marginRight: 0 }]} 
                        resizeMode="contain" 
                      />
                    )}
                    <View style={{ alignItems: 'center', paddingHorizontal: 60 }}>
                       <Text 
                        style={[styles.shopTitle, { textAlign: 'center', fontSize: 32, lineHeight: 36 }]} 
                        numberOfLines={1} 
                        adjustsFontSizeToFit
                      >
                        {(businessDetails.shopName || 'MOTORCYCLE HUB').toUpperCase()}
                      </Text>
                      {businessDetails.shopDescription ? (
                        <Text style={[styles.shopSubtitle, { color: colors.subtext, textAlign: 'center', width: '100%', marginTop: 0 }]} numberOfLines={1} adjustsFontSizeToFit>{businessDetails.shopDescription}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
                  
                <View style={styles.shopInfoRow}>
                  <View style={styles.shopDetailsCol}>
                    {businessDetails.ownerName ? (
                      <View style={styles.detailItem}>
                        <Feather name="user" size={11} color="#E53935" style={{ marginTop: 2 }} />
                        <Text style={styles.detailText}>{businessDetails.ownerName}</Text>
                      </View>
                    ) : null}
                    {businessDetails.instagramId ? (
                      <View style={styles.detailItem}>
                        <Feather name="instagram" size={11} color="#E53935" style={{ marginTop: 2 }} />
                        <Text style={styles.detailText}>{businessDetails.instagramId}</Text>
                      </View>
                    ) : null}
                    {businessDetails.phoneNumbers ? (
                      <View style={styles.detailItem}>
                        <Feather name="phone" size={11} color="#E53935" style={{ marginTop: 2 }} />
                        <Text style={styles.detailText}>{businessDetails.phoneNumbers}</Text>
                      </View>
                    ) : null}
                    {businessDetails.shopAddress ? (
                      <View style={styles.detailItem}>
                        <Feather name="map-pin" size={11} color={colors.primary} style={{ marginTop: 2 }} />
                        <Text style={[styles.detailText, { flex: 1, color: colors.subtext }]}>
                          {businessDetails.shopAddress}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.metricDetailsCol}>
                    <View style={[styles.metricInputCol, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.metricLabelWide, { color: colors.subtext }]}>Bill No</Text>
                      <Text style={[styles.metricInput, { color: colors.secondary, textAlign: "center" }]}>
                        {currentBillId 
                          ? currentBillId.padStart(3, '0') 
                          : nextBillNumber.toString().padStart(3, '0')}
                      </Text>
                    </View>
                    <View style={[styles.metricInputCol, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.metricLabelWide, { color: colors.subtext }]}>Last Service</Text>
                      <View style={styles.meterInputContainer}>
                        <TextInput
                          style={[styles.metricInput, { color: colors.text }]}
                          placeholder="00000"
                          placeholderTextColor={colors.subtext}
                          value={lastMeter}
                          onChangeText={setLastMeter}
                          keyboardType="numeric"
                        />
                        <Text style={[styles.unitText, { color: colors.subtext }]}>km</Text>
                      </View>
                    </View>
                    <View style={[styles.metricInputCol, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.metricLabelWide, { color: colors.subtext }]}>Next Service</Text>
                      <View style={styles.meterInputContainer}>
                        <TextInput
                          style={[styles.metricInput, { color: colors.secondary }]}
                          placeholder="00000"
                          placeholderTextColor={colors.subtext}
                          value={nextMeter}
                          onChangeText={setNextMeter}
                          keyboardType="numeric"
                        />
                        <Text style={[styles.unitText, { color: colors.subtext }]}>km</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={[styles.customerInfoContainer, { borderBottomColor: colors.border }]}>
                  <View style={styles.compactInputRow}>
                    <View style={[styles.infoInputSubRow, { flex: 1.5, borderBottomColor: colors.border }]}>
                      <Feather name="user" size={13} color={colors.subtext} style={styles.infoIcon} />
                      <TextInput
                        style={[styles.compactInput, { color: colors.text }]}
                        placeholder="Customer Name"
                        placeholderTextColor={colors.subtext}
                        value={customerName}
                        onChangeText={setCustomerName}
                      />
                    </View>
                    <View style={[styles.infoInputSubRow, { flex: 1, borderBottomColor: colors.border }]}>
                      <MaterialCommunityIcons name="car-info" size={13} color={colors.subtext} style={styles.infoIcon} />
                      <TextInput
                        style={[styles.compactInput, { color: colors.text }]}
                        placeholder="Vehicle No"
                        placeholderTextColor={colors.subtext}
                        value={vehicleNumber}
                        onChangeText={setVehicleNumber}
                        autoCapitalize="characters"
                      />
                    </View>
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

              <View style={[styles.totalSection, { borderTopColor: colors.border }]}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.currencySymbol, { color: colors.secondary }]}>₹</Text>
                    <Text style={[styles.subtotalPrice, { color: colors.text }]}>{grandTotal}</Text>
                  </View>
                </View>

                {advanceAmount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.advanceLabel, { color: colors.primary }]}>Advance</Text>
                    <View style={styles.priceContainer}>
                      <Text style={[styles.currencySymbol, { color: colors.primary }]}>-₹</Text>
                      <Text style={[styles.advancePrice, { color: colors.primary }]}>{advanceAmount}</Text>
                    </View>
                  </View>
                )}

                <View style={[styles.finalBalanceRow, { backgroundColor: isDark ? "rgba(229, 57, 53, 0.1)" : "rgba(229, 57, 53, 0.05)", borderRadius: 8, paddingHorizontal: 12 }]}>
                  <Text style={[styles.totalLabel, { color: colors.primary }]}>Final Balance</Text>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.currencySymbol, { fontSize: 20, color: colors.primary }]}>₹</Text>
                    <Text style={[styles.totalPrice, { color: colors.primary }]}>{finalBalance}</Text>
                  </View>
                </View>
              </View>
            </Reanimated.View>
        </ViewShot>

        <View style={[styles.summaryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{cart.length}</Text>
            <Text style={[styles.summaryKey, { color: colors.subtext }]}>Parts</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₹{grandTotal}</Text>
            <Text style={[styles.summaryKey, { color: colors.subtext }]}>Subtotal</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>₹{finalBalance}</Text>
            <Text style={[styles.summaryKey, { color: colors.subtext }]}>Balance</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale: pdfButtonScale }], marginBottom: 10 }}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            onPress={handleNewBill}
            activeOpacity={0.85}
          >
            <Feather name="file-plus" size={18} color={colors.text} />
            <Text style={[styles.primaryButtonText, { color: colors.text }]}>New Bill</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.footerButtonRow, { transform: [{ scale: waButtonScale }] }]}>
          <TouchableOpacity
            style={[styles.pdfButton, isGenerating && { opacity: 0.7 }, { borderColor: isDark ? "rgba(255, 193, 7, 0.4)" : "rgba(255, 152, 0, 0.4)" }]}
            onPress={handleDownloadPDF}
            activeOpacity={0.85}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color={colors.secondary} size="small" />
            ) : (
              <MaterialCommunityIcons name="file-pdf-box" size={20} color={colors.secondary} />
            )}
            <Text style={[styles.pdfButtonText, { color: colors.secondary }]}>
              PDF
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isGenerating && { opacity: 0.7 }, { backgroundColor: colors.primary, flex: 1 }]}
            onPress={handleWhatsApp}
            activeOpacity={0.85}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" />
            )}
            <Text style={[styles.secondaryButtonText, { color: "#FFF" }]}>
              {isGenerating ? "GENERATING..." : "NEXT →"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
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
  headerAuto: {
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
  billLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
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
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16, 
    paddingVertical: 12,
    justifyContent: "flex-start", 
  },
  customerInfoContainer: {
    marginBottom: 8,
  },
  infoInputSubRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: 32,
  },
  compactInputRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 4,
  },
  compactInput: {
    flex: 1,
    color: colors.text,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    padding: 0,
  },
  infoIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10, // Smaller section labels
    color: "#555",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionGap: {
    height: 4, 
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5, 
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  swipeContainerRow: {
    backgroundColor: "#E53935",
  },
  swipeInnerRow: {
    backgroundColor: colors.card,
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
    fontSize: 14, // Slightly smaller
    color: "#FFFFFF",
    flex: 1,
    marginRight: 12,
  },
  billLabelBold: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: colors.text,
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
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  totalSection: {
    marginTop: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  finalBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  subtotalPrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#A0A0A0",
  },
  advanceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#E53935",
    flex: 1,
  },
  advancePrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#E53935",
  },
  totalPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: colors.text,
  },
  summaryRow: {
    backgroundColor: colors.card,
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
    color: colors.text,
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
    backgroundColor: colors.card,
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
  footerButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  pdfButton: {
    flex: 0.5,
    backgroundColor: "transparent",
    borderRadius: 18,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
  },
  pdfButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    letterSpacing: 0.5,
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
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
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
  shopHeader: {
    marginBottom: 8,
  },
  shopTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24, 
    color: "#E53935",
    letterSpacing: 1.2,
    textAlign: "center",
    textTransform: "uppercase",
  },
  shopSubtitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: colors.subtext,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  shopInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 0,
  },
  shopDetailsCol: {
    flex: 1.4,
    gap: 2,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  detailText: {
    fontFamily: "Inter_500Medium",
    fontSize: 8.5,
    color: colors.subtext,
    lineHeight: 12,
  },
  metricDetailsCol: {
    flex: 1.2,
    paddingLeft: 8,
    gap: 3,
    borderLeftWidth: 0.6,
    borderLeftColor: colors.border,
    alignItems: "center", 
  },
  metricInputCol: {
    flexDirection: "column",
    alignItems: "center", 
    gap: 2,
  },
  metricLabelWide: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 7.2,
    color: colors.subtext,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metricInput: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: colors.text,
    textAlign: "center", 
    padding: 0,
    minWidth: 40,
  },
  meterInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", 
  },
  unitText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: "#888",
    marginLeft: 3,
  },
  billFooter: {
    marginTop: 8,
    gap: 6,
    alignItems: "center",
  },
  footerContactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
  },
  footerText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: "#888",
  },
  footerDot: {
    color: "#A0A0A0",
    fontSize: 12,
    marginHorizontal: 4,
  },
});
