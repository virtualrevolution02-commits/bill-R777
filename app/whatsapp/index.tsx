import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Animated,
  Platform,
  Share,
  ScrollView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useGarage } from "@/context/GarageContext";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";

export default function WhatsAppScreen() {
  const insets = useSafeAreaInsets();
  const { customerName, vehicleNumber, finalBalance } = useGarage();
  const params = useLocalSearchParams();
  const rawUri = Array.isArray(params.billImageUri) ? params.billImageUri[0] : params.billImageUri;
  const billImageUri = rawUri;

  const getShareUri = () => {
    if (!billImageUri) return null;
    let uri = billImageUri;
    if (Platform.OS === 'android' && !uri.startsWith('file://')) {
      uri = `file://${uri}`;
    }
    return uri;
  };

  const bubbleScale = useRef(new Animated.Value(0.9)).current;
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(bubbleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [bubbleOpacity, bubbleScale, headerOpacity]);

  const buildBillText = () => {
    let lines: string[] = [];
    lines.push("Dear Customer,");
    lines.push("");
    lines.push("Your vehicle service is completed.");
    lines.push("");
    lines.push(`Customer Name: ${customerName || "N/A"}`);
    lines.push(`Vehicle Number: ${vehicleNumber || "N/A"}`);
    lines.push("");
    lines.push("Please find the bill attached.");
    lines.push("More Details : 8526808766,8438597688");
    lines.push("Thank you.");
    lines.push("R777 Garage");
    return lines.join("\n");
  };

  const handleSendWhatsApp = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const message = buildBillText();
    const shareUri = getShareUri();
    
    try {
      if (shareUri && await Sharing.isAvailableAsync()) {
        await Clipboard.setStringAsync(message);
        if (Platform.OS === "ios") {
          Share.share({ message: message, url: shareUri, title: "R777 Garage Bill" });
        } else {
          Alert.alert(
            "Bill Copied & Ready!", 
            "The text has been copied. Select WhatsApp, then paste the text as the caption for the image.",
            [
              {
                text: "Okay",
                onPress: async () => {
                  try {
                    await Sharing.shareAsync(shareUri, {
                      dialogTitle: "Share via WhatsApp",
                      mimeType: "image/jpeg",
                      UTI: "public.jpeg",
                    });
                  } catch (e: any) {
                    console.log("Sharing error:", e);
                  }
                }
              }
            ]
          );
        }
      } else {
        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
        Linking.canOpenURL(url).then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Share.share({ message: message, title: "R777 Garage Bill" });
          }
        });
      }
    } catch (err: any) {
      Alert.alert("Error", "Could not prepare the share sheet.");
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = buildBillText();
    const shareUri = getShareUri();

    try {
      if (shareUri && await Sharing.isAvailableAsync()) {
        await Clipboard.setStringAsync(message);
        if (Platform.OS === "ios") {
          Share.share({ message: message, url: shareUri, title: "R777 Garage Bill" });
        } else {
          Alert.alert(
            "Text Copied!", 
            "The bill details are copied to your clipboard. Paste them when the sharing window opens.",
            [
              {
                text: "Share Image",
                onPress: async () => {
                  try {
                    await Sharing.shareAsync(shareUri, {
                      dialogTitle: "Share Bill Copy",
                      mimeType: "image/jpeg",
                      UTI: "public.jpeg",
                    });
                  } catch (e: any) {
                    console.log("Sharing auth error:", e);
                  }
                }
              }
            ]
          );
        }
      } else {
        Share.share({ message: message, title: "R777 Garage Bill" });
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to launch native share.");
    }
  };

  const displayLines = (() => {
    const lines: { text: string; bold: boolean; isTotal: boolean; isHeader?: boolean; isSmall?: boolean }[] = [];
    lines.push({ text: "Dear Customer,", bold: false, isTotal: false });
    lines.push({ text: "", bold: false, isTotal: false });
    lines.push({ text: "Your vehicle service is completed.", bold: false, isTotal: false });
    lines.push({ text: "", bold: false, isTotal: false });
    lines.push({ text: `Customer Name: ${customerName || "N/A"}`, bold: false, isTotal: false });
    lines.push({ text: `Vehicle Number: ${vehicleNumber || "N/A"}`, bold: false, isTotal: false });
    lines.push({ text: "", bold: false, isTotal: false });
    lines.push({ text: `Total Bill Amount: ₹${finalBalance}`, bold: true, isTotal: true });
    lines.push({ text: "", bold: false, isTotal: false });
    lines.push({ text: "Please find the bill attached.", bold: false, isTotal: false });
    lines.push({ text: "More Details : 8526808766,8438597688", bold: false, isTotal: false });
    lines.push({ text: "", bold: false, isTotal: false });
    lines.push({ text: "Thank you.", bold: false, isTotal: false });
    lines.push({ text: "R777 Garage", bold: true, isTotal: false });
    return lines;
  })();

  const prices = (() => {
    return displayLines.map(() => ({ price: "", bold: false }));
  })();

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
      <Animated.View style={[styles.whatsappHeader, { opacity: headerOpacity }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.contactInfo}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={22} color="#A0A0A0" />
          </View>
          <View>
            <Text style={styles.contactName}>R777 Garage</Text>
            <Text style={styles.contactStatus}>Online</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction}>
            <Feather name="phone" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Feather name="more-vertical" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.chatArea}>
        <ScrollView
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.messageBubble,
              {
                opacity: bubbleOpacity,
                transform: [{ scale: bubbleScale }],
              },
            ]}
          >
            {displayLines.map((line, i) => (
              <View
                key={i}
                style={[
                  styles.billLineRow,
                  line.isTotal && styles.billTotalRow,
                ]}
              >
                <Text
                  style={[
                    styles.billLineText,
                    line.bold && styles.billLineBold,
                    i === 0 && styles.billTitle,
                    line.isTotal && styles.billTotalText,
                  ]}
                >
                  {line.text}
                </Text>
                {prices[i]?.price ? (
                  <Text
                    style={[
                      styles.billPriceText,
                      prices[i].bold && styles.billTotalPrice,
                    ]}
                  >
                    {prices[i].price}
                  </Text>
                ) : null}
              </View>
            ))}

            <Text style={styles.messageTime}>Just now ✓✓</Text>
          </Animated.View>
        </ScrollView>
      </View>

      <View style={styles.inputBarMock}>
        <View style={styles.mockInput}>
          <Ionicons name="happy-outline" size={22} color="#A0A0A0" />
          <Text style={styles.mockInputText}>Type a message</Text>
          <Feather name="paperclip" size={20} color="#A0A0A0" />
          <Feather name="camera" size={20} color="#A0A0A0" />
        </View>
        <TouchableOpacity style={styles.sendButton} onPress={handleSendWhatsApp} activeOpacity={0.85}>
          <MaterialCommunityIcons name="whatsapp" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.sendWhatsAppButton}
          onPress={handleSendWhatsApp}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="whatsapp" size={20} color="#FFFFFF" />
          <Text style={styles.sendWhatsAppText}>Open in WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Feather name="share-2" size={18} color="#A0A0A0" />
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111B21",
  },
  whatsappHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2C34",
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2A3942",
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contactName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#E9EDEF",
  },
  contactStatus: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#00A884",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerAction: {
    padding: 6,
  },
  chatArea: {
    flex: 1,
    backgroundColor: "#0B141A",
  },
  chatContent: {
    padding: 16,
    alignItems: "flex-end",
  },
  messageBubble: {
    backgroundColor: "#005C4B",
    borderRadius: 12,
    borderTopRightRadius: 2,
    padding: 14,
    maxWidth: "90%",
    minWidth: 200,
  },
  billLineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
    gap: 20,
  },
  billTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
    marginTop: 4,
    paddingTop: 8,
  },
  billTitle: {
    fontSize: 16,
    letterSpacing: 0.5,
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  billLineText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#E9EDEF",
    flex: 1,
  },
  billLineBold: {
    fontFamily: "Inter_600SemiBold",
  },
  billTotalText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#E9EDEF",
  },
  billPriceText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#E9EDEF",
    textAlign: "right",
  },
  billTotalPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  messageTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(233,237,239,0.5)",
    textAlign: "right",
    marginTop: 8,
  },
  inputBarMock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2C34",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  mockInput: {
    flex: 1,
    backgroundColor: "#2A3942",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  mockInputText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#8696A0",
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#00A884",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "#1F2C34",
    gap: 10,
  },
  sendWhatsAppButton: {
    flex: 1,
    backgroundColor: "#25D366",
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendWhatsAppText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  shareButton: {
    backgroundColor: "#2A3942",
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#A0A0A0",
  },
});
