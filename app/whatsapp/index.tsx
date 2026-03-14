import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Share,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import * as Sharing from "expo-sharing";

export default function WhatsAppScreen() {
  const insets = useSafeAreaInsets();

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

  const handleSendWhatsApp = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const shareUri = getShareUri();
    
    try {
      if (shareUri && await Sharing.isAvailableAsync()) {
        if (Platform.OS === "ios") {
          Share.share({ url: shareUri, title: "Ragu Auto Works Bill" });
        } else {
          await Sharing.shareAsync(shareUri, {
            dialogTitle: "Share via WhatsApp",
            mimeType: "image/jpeg",
            UTI: "public.jpeg",
          });
        }
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch {
      Alert.alert("Error", "Could not prepare the share sheet.");
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const shareUri = getShareUri();

    try {
      if (shareUri && await Sharing.isAvailableAsync()) {
        if (Platform.OS === "ios") {
          Share.share({ url: shareUri, title: "Ragu Auto Works Bill" });
        } else {
          await Sharing.shareAsync(shareUri, {
            dialogTitle: "Share Bill Image",
            mimeType: "image/jpeg",
            UTI: "public.jpeg",
          });
        }
      } else {
        Alert.alert("Error", "Sharing is not available.");
      }
    } catch {
      Alert.alert("Error", "Failed to launch native share.");
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
            <Text style={styles.contactName}>Ragu Auto Works</Text>
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
            {billImageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: billImageUri }} 
                  style={styles.billImagePreview} 
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Feather name="image" size={40} color="#555" />
                <Text style={styles.errorText}>Bill Image not found</Text>
              </View>
            )}
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
    borderRadius: 8,
    borderTopRightRadius: 2,
    padding: 3,
    maxWidth: "92%",
  },
  imagePreviewContainer: {
    width: 280,
    height: 380,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  billImagePreview: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    width: 280,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
  },
  errorText: {
    color: '#A0A0A0',
    marginTop: 10,
    fontFamily: 'Inter_400Regular',
  },
  messageTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(233,237,239,0.5)",
    textAlign: "right",
    marginTop: 4,
    marginRight: 4,
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
