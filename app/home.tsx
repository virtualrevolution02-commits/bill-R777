import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Modal,
  Alert,
  ScrollView,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import Reanimated, { FadeInDown, Layout, ZoomIn } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import { Swipeable } from "react-native-gesture-handler";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useGarage, SparePart } from "@/context/GarageContext";
import { useTheme } from "@/context/ThemeContext";
import { BikeModeSwitch } from "@/components/BikeModeSwitch";

function PartCard({
  part,
  isSelected,
  quantity,
  onAdd,
  onRemove,
  onSwipeDelete,
}: {
  part: SparePart;
  isSelected: boolean;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  onSwipeDelete?: () => void;
}) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const scale = useRef(new Animated.Value(1)).current;

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animatePress();
    onAdd();
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animatePress();
    onRemove();
  };

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderRightActions = (progress: any, dragX: any) => {
    if (!onSwipeDelete) return null;
    const trans = dragX.interpolate({
      inputRange: [-80, -20, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSwipeDelete();
        }}
        activeOpacity={0.8}
      >
        <Animated.View style={[{ opacity: trans, transform: [{ scale: trans }] }, { backgroundColor: colors.primary }]}>
          <Feather name="trash-2" size={24} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const cardContent = (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {}}
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          { backgroundColor: colors.card, borderColor: colors.border }
        ]}
      >
        <View style={styles.cardMain} pointerEvents="none">
          <View style={styles.nameContainer}>
            <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={2}>
              {part.name}
            </Text>
          </View>
          <Text style={[styles.cardPrice, { color: colors.secondary }]}>₹{part.price}</Text>
        </View>
        
        <View style={styles.cardActions} pointerEvents="box-none">
          {isSelected && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.minusButton,
                { backgroundColor: colors.accent }
              ]}
              onPress={handleRemove}
              activeOpacity={0.7}
            >
              <Feather name="minus" size={18} color={colors.text} />
            </TouchableOpacity>
          )}

          <View style={styles.plusContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isSelected ? styles.plusButtonActive : styles.plusButton,
                isSelected ? { backgroundColor: colors.primary } : { backgroundColor: colors.accent }
              ]}
              onPress={handleAdd}
              activeOpacity={0.7}
            >
              <Feather
                name={isSelected ? "check" : "plus"}
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            {isSelected && (
              <View style={[styles.quantityBadge, { backgroundColor: colors.secondary }]}>
                <Text style={styles.quantityBadgeText}>{quantity}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <Reanimated.View 
      style={styles.swipeContainer} 
      entering={FadeInDown.springify().damping(22).mass(0.8)} 
      layout={Layout.springify().damping(22)}
    >
      <Swipeable renderRightActions={renderRightActions} containerStyle={styles.swipeableWrapper} overshootRight={false}>
        {cardContent}
      </Swipeable>
    </Reanimated.View>
  );
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const { 
    addToCart, 
    decreaseQuantity, 
    cart, 
    grandTotal, 
    businessDetails,
    updateBusinessDetails
  } = useGarage();
  const [search, setSearch] = useState("");
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [hiddenParts, setHiddenParts] = useState<string[]>([]);
  const [recentParts, setRecentParts] = useState<SparePart[]>([]);
  const [isGuideModalVisible, setGuideModalVisible] = useState(false);
  const [currentGuideStep, setCurrentGuideStep] = useState(0);

  const [isLabourModalVisible, setLabourModalVisible] = useState(false);
  const [labourName, setLabourName] = useState("");
  const [labourPrice, setLabourPrice] = useState("");

  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  
  // Profile state
  const [pOwner, setPOwner] = useState(businessDetails.ownerName);
  const [pShop, setPShop] = useState(businessDetails.shopName);
  const [pAddress, setPAddress] = useState(businessDetails.shopAddress);
  const [pPhone, setPPhone] = useState(businessDetails.phoneNumbers);
  const [pInsta, setPInsta] = useState(businessDetails.instagramId);
  const [pLogo, setPLogo] = useState(businessDetails.shopLogo);
  const [pDesc, setPDesc] = useState(businessDetails.shopDescription);

  // Sync profile state when context changes
  React.useEffect(() => {
    setPOwner(businessDetails.ownerName);
    setPShop(businessDetails.shopName);
    setPAddress(businessDetails.shopAddress);
    setPPhone(businessDetails.phoneNumbers);
    setPInsta(businessDetails.instagramId);
    setPLogo(businessDetails.shopLogo);
    setPDesc(businessDetails.shopDescription);
  }, [businessDetails]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setPLogo(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const storedRecent = await AsyncStorage.getItem("recent_items");
        if (storedRecent) setRecentParts(JSON.parse(storedRecent));
        const storedHidden = await AsyncStorage.getItem("hidden_items");
        if (storedHidden) setHiddenParts(JSON.parse(storedHidden));
      } catch {
        // Ignore error
      }
    };
    loadData();
  }, []);

  const [isModalVisible, setModalVisible] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const submitCustomItem = async () => {
    if (!customName.trim()) {
      Alert.alert("Error", "Please enter a name for the item.");
      return;
    }
    const priceNum = parseInt(customPrice) || 0;
    
    const newItem = {
      id: `custom-part-${Date.now()}`,
      name: customName,
      price: priceNum,
      category: "Custom",
      brand: "Recent",
    };

    addToCart(newItem);
    
    const updatedRecent = [
      newItem, 
      ...recentParts.filter((i) => i.name.toLowerCase() !== customName.toLowerCase())
    ].slice(0, 50);
    
    setRecentParts(updatedRecent);
    try {
      await AsyncStorage.setItem("recent_items", JSON.stringify(updatedRecent));
    } catch {
      // Ignore error
    }
    
    setModalVisible(false);
    setSearch("");
  };

  const combinedParts = useMemo(() => {
    return recentParts.filter(p => !hiddenParts.includes(p.id));
  }, [recentParts, hiddenParts]);

  const { addLabour } = useGarage();

  const submitLabourItem = () => {
    if (!labourName.trim()) {
      Alert.alert("Error", "Please enter a name for the labour.");
      return;
    }
    addLabour({
      id: `custom-labour-${Date.now()}`,
      name: labourName,
      price: parseInt(labourPrice) || 0,
    });
    setLabourModalVisible(false);
    setLabourName("");
    setLabourPrice("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const getCartItem = (id: string) => cart.find((c) => c.id === id);

  const filtered = useMemo(() => {
    return combinedParts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [search, combinedParts]);

  const handleDoubleTapItem = (itemToRemove: SparePart) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Remove Item",
      `Are you sure you want to remove ${itemToRemove.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
             if (itemToRemove.brand === "Recent") {
                const updated = recentParts.filter(p => p.id !== itemToRemove.id);
                setRecentParts(updated);
                try {
                  await AsyncStorage.setItem("recent_items", JSON.stringify(updated));
                } catch { }
             } else {
                const updatedHidden = [...hiddenParts, itemToRemove.id];
                setHiddenParts(updatedHidden);
                try {
                  await AsyncStorage.setItem("hidden_items", JSON.stringify(updatedHidden));
                } catch { }
             }
          }
        }
      ]
    );
  };

  const handleNext = () => {
    if (cart.length === 0) {
      Alert.alert("Empty Bill", "Please select at least one item before proceeding.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.navigate("/bill");
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colors.background
        },
      ]}
    >
          <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1 }}>
          {businessDetails.shopName ? (
            <>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {businessDetails.shopName.split(' ')[0].toUpperCase()}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.text }]} numberOfLines={1}>
                {businessDetails.shopName.split(' ').slice(1).join(' ').toUpperCase() || "AUTO WORKS"}
              </Text>
            </>
          ) : (
            <Text style={styles.headerTitle} numberOfLines={1}>
              MOTORCYCLE HUB
            </Text>
          )}
          {businessDetails.shopDescription ? (
            <Text style={styles.headerTagline}>{businessDetails.shopDescription}</Text>
          ) : null}
        </View>

        {businessDetails.shopLogo && (
          <Image 
            source={{ uri: businessDetails.shopLogo }} 
            style={styles.headerLogo} 
            resizeMode="contain" 
          />
        )}

        <View style={styles.headerRight}>
          <BikeModeSwitch />
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: colors.card }]}
            onPress={() => setMenuOpen(!isMenuOpen)}
          >
            <Feather name="settings" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Modal
          visible={isMenuOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMenuOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setMenuOpen(false)}>
            <View style={{ flex: 1 }}>
              <TouchableWithoutFeedback>
                <View 
                  style={[styles.dropdownMenu, { top: insets.top + 60, right: 20, backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setMenuOpen(false);
                      router.push("/history");
                    }}
                  >
                    <Feather name="clock" size={18} color={colors.text} />
                    <Text style={[styles.dropdownText, { color: colors.text }]}>History</Text>
                  </TouchableOpacity>

                  <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 12, marginVertical: 4 }} />

                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setMenuOpen(false);
                      router.push("/earnings");
                    }}
                  >
                    <Ionicons name="stats-chart" size={18} color={colors.text} />
                    <Text style={[styles.dropdownText, { color: colors.text }]}>Earnings</Text>
                  </TouchableOpacity>
                  <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 12, marginVertical: 4 }} />

                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setMenuOpen(false);
                      setGuideModalVisible(true);
                    }}
                  >
                    <Feather name="help-circle" size={18} color={colors.text} />
                    <Text style={[styles.dropdownText, { color: colors.text }]}>How to Use</Text>
                  </TouchableOpacity>
                  
                  <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 12, marginVertical: 4 }} />

                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setMenuOpen(false);
                      setShowProfileDetails(false); // Start with card view
                      setProfileModalVisible(true);
                    }}
                  >
                    <Feather name="user" size={18} color={colors.text} />
                    <Text style={[styles.dropdownText, { color: colors.text }]}>Profile</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
      <Reanimated.View 
        entering={FadeInDown.delay(100).springify().damping(22).mass(0.8)}
        style={[styles.searchContainer, { backgroundColor: colors.card }]}
      >
        <Feather name="search" size={20} color={colors.subtext} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search spare parts..."
          placeholderTextColor={colors.subtext}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.subtext} />
          </TouchableOpacity>
        )}
      </Reanimated.View>

      <View style={styles.quickAddRow}>
        <TouchableOpacity 
          style={[styles.quickAddButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            setCustomName("");
            setCustomPrice("");
            setModalVisible(true);
          }}
        >
          <Feather name="plus-circle" size={18} color={colors.secondary} />
          <Text style={[styles.quickAddText, { color: colors.text }]}>Item</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.quickAddButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setLabourModalVisible(true)}
        >
          <Feather name="tool" size={18} color={colors.secondary} />
          <Text style={[styles.quickAddText, { color: colors.text }]}>Labour</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionHeaderText, { color: colors.subtext }]}>
          {search ? "Results" : "Recent Items"}
        </Text>
      </View>

      {filtered.length > 0 ? (
        <Reanimated.FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          itemLayoutAnimation={Layout.springify().damping(22)}
          renderItem={({ item, index }) => {
            const cartItem = getCartItem(item.id);
            return (
              <PartCard
                part={item}
                isSelected={!!cartItem}
                quantity={cartItem?.quantity ?? 0}
                onAdd={() => addToCart(item)}
                onRemove={() => decreaseQuantity(item.id)}
                onSwipeDelete={() => handleDoubleTapItem(item)}
              />
            );
          }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="package" size={40} color="#444444" />
              <Text style={styles.emptyText}>No items found</Text>
              {search.length > 0 && (
                <TouchableOpacity 
                  style={styles.addCustomButtonEmpty}
                  onPress={() => {
                    setCustomName(search);
                    setCustomPrice("");
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.addCustomButtonText}>+ Add new item</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
        />
      ) : (
        <View style={styles.emptyState}>
          <Feather name="plus-circle" size={48} color={isDark ? "#444" : "#BBB"} />
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            Tap &quot;+&quot; to add items manually
          </Text>
        </View>
      )}
      {(cart.length > 0 || grandTotal > 0) && (
        <Reanimated.View 
          entering={FadeInDown.duration(300)}
          layout={Layout.duration(200)}
          style={[styles.footer, { backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border }]}
        >
          <TouchableOpacity
            style={[
              styles.nextButton, 
              (cart.length === 0 && grandTotal === 0) && styles.nextButtonDisabled,
              { backgroundColor: isDark ? colors.card : "#E53935" }
            ]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            {cartCount > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: isDark ? colors.primary : "#FFFFFF" }]}>
                <Text style={[styles.cartBadgeText, { color: isDark ? "#FFFFFF" : "#E53935" }]}>{cartCount}</Text>
              </View>
            )}
            <Text style={[styles.nextButtonText, { color: "#FFFFFF", marginLeft: cartCount > 0 ? 0 : 0 }]}>NEXT →</Text>
            {cartCount > 0 && (
              <Text style={[styles.nextButtonSubtext, { color: isDark ? colors.secondary : "#FFFFFF", marginLeft: 10 }]}>₹{grandTotal}</Text>
            )}
          </TouchableOpacity>
        </Reanimated.View>
      )}

      <Modal
        visible={isGuideModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setGuideModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <Reanimated.View 
            entering={ZoomIn.springify().damping(22).mass(0.8).duration(400)}
            style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '80%' }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>How to Use</Text>
              <TouchableOpacity onPress={() => setGuideModalVisible(false)}>
                <Feather name="x" size={24} color={colors.subtext} />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', minHeight: 250, justifyContent: 'center', marginBottom: 20 }}>
              {currentGuideStep === 0 && (
                <Reanimated.View entering={FadeInDown.springify().damping(22)} style={{ alignItems: 'center', width: '100%' }}>
                  <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(229,57,53,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Feather name="plus-circle" size={48} color="#E53935" />
                  </View>
                  <Text style={{ fontFamily: "Inter_800ExtraBold", fontSize: 20, color: colors.text, marginBottom: 12, textAlign: 'center' }}>
                    1. Selecting Items
                  </Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: colors.subtext, lineHeight: 22, textAlign: 'center', paddingHorizontal: 10 }}>
                    Tap the &quot;+&quot; icon next to any spare part to add it to the bill. Use &quot;Item&quot; or &quot;Labour&quot; at the top for custom entries.
                  </Text>
                </Reanimated.View>
              )}
              {currentGuideStep === 1 && (
                <Reanimated.View entering={FadeInDown.springify().damping(22)} style={{ alignItems: 'center', width: '100%' }}>
                  <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,193,7,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Feather name="arrow-right-circle" size={48} color="#FFC107" />
                  </View>
                  <Text style={{ fontFamily: "Inter_800ExtraBold", fontSize: 20, color: colors.text, marginBottom: 12, textAlign: 'center' }}>
                    2. Pressing Next
                  </Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: colors.subtext, lineHeight: 22, textAlign: 'center', paddingHorizontal: 10 }}>
                    Once items are added to your cart, a &quot;NEXT →&quot; button appears at the bottom. Tap it to proceed to the bill preview.
                  </Text>
                </Reanimated.View>
              )}
              {currentGuideStep === 2 && (
                <Reanimated.View entering={FadeInDown.springify().damping(22)} style={{ alignItems: 'center', width: '100%' }}>
                  <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(76,175,80,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Feather name="file-text" size={48} color="#4CAF50" />
                  </View>
                  <Text style={{ fontFamily: "Inter_800ExtraBold", fontSize: 20, color: colors.text, marginBottom: 12, textAlign: 'center' }}>
                    3. Reviewing the Bill
                  </Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: colors.subtext, lineHeight: 22, textAlign: 'center', paddingHorizontal: 10 }}>
                    On the Bill screen, you can review the customer details, items, labour charges, and modify discounts before finalizing.
                  </Text>
                </Reanimated.View>
              )}
              {currentGuideStep === 3 && (
                <Reanimated.View entering={FadeInDown.springify().damping(22)} style={{ alignItems: 'center', width: '100%' }}>
                  <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(33,150,243,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Feather name="share-2" size={48} color="#2196F3" />
                  </View>
                  <Text style={{ fontFamily: "Inter_800ExtraBold", fontSize: 20, color: colors.text, marginBottom: 12, textAlign: 'center' }}>
                    4. Sharing via PDF/WhatsApp
                  </Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: colors.subtext, lineHeight: 22, textAlign: 'center', paddingHorizontal: 10 }}>
                    After tapping &quot;GENERATE BILL&quot;, select &quot;Share &amp; Export&quot; to print, download as PDF, or send directly via WhatsApp.
                  </Text>
                </Reanimated.View>
              )}
              {currentGuideStep === 4 && (
                <Reanimated.View entering={FadeInDown.springify().damping(22)} style={{ alignItems: 'center', width: '100%' }}>
                  <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(156,39,176,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Feather name="trending-up" size={48} color="#9C27B0" />
                  </View>
                  <Text style={{ fontFamily: "Inter_800ExtraBold", fontSize: 20, color: colors.text, marginBottom: 12, textAlign: 'center' }}>
                    5. Tracking History &amp; Earnings
                  </Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: colors.subtext, lineHeight: 22, textAlign: 'center', paddingHorizontal: 10 }}>
                    Use the settings menu to view past generated bills under &quot;History&quot;, and track your business&apos;s progress under &quot;Earnings&quot;.
                  </Text>
                </Reanimated.View>
              )}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity 
                disabled={currentGuideStep === 0}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentGuideStep(Math.max(0, currentGuideStep - 1));
                }}
                style={{ padding: 10, opacity: currentGuideStep === 0 ? 0.3 : 1 }}
              >
                <Feather name="chevron-left" size={32} color={colors.text} />
              </TouchableOpacity>
              
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[0, 1, 2, 3, 4].map((step) => (
                  <View key={step} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: currentGuideStep === step ? colors.primary : colors.border }} />
                ))}
              </View>

              <TouchableOpacity 
                disabled={currentGuideStep === 4}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentGuideStep(Math.min(4, currentGuideStep + 1));
                }}
                style={{ padding: 10, opacity: currentGuideStep === 4 ? 0.3 : 1 }}
              >
                <Feather name="chevron-right" size={32} color={colors.text} />
              </TouchableOpacity>
            </View>
          </Reanimated.View>
        </View>
      </Modal>

      <Modal
        visible={isLabourModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLabourModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <Reanimated.View 
                entering={ZoomIn.springify().damping(22).mass(0.8).duration(400)}
                style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Add Labour</Text>
                  <TouchableOpacity onPress={() => setLabourModalVisible(false)}>
                    <Feather name="x" size={24} color={colors.subtext} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.subtext }]}>Labour Name</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="e.g. Engine Service"
                    placeholderTextColor={colors.subtext}
                    value={labourName}
                    onChangeText={setLabourName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.subtext }]}>Labour Cost (₹)</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="0"
                    placeholderTextColor={colors.subtext}
                    value={labourPrice}
                    onChangeText={setLabourPrice}
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.submitCustomButton, { backgroundColor: colors.primary }]}
                  onPress={submitLabourItem}
                >
                  <Text style={styles.submitCustomButtonText}>Add Labour</Text>
                </TouchableOpacity>
              </Reanimated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={isProfileModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            {!showProfileDetails ? (
            <Reanimated.View
              entering={ZoomIn.springify().damping(22).mass(0.8).duration(400)}
              style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => setShowProfileDetails(true)}
                style={[styles.profileCardFull, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={{ width: '100%', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 }}>
                  <TouchableOpacity 
                    style={[styles.profileCloseTop, { position: 'absolute', right: 20, top: 15, zIndex: 10 }]}
                    onPress={() => setProfileModalVisible(false)}
                  >
                    <Feather name="x" size={24} color={colors.subtext} />
                  </TouchableOpacity>

                  {businessDetails.shopLogo ? (
                    <Image source={{ uri: businessDetails.shopLogo }} style={[styles.profileLogoLarge, { position: 'absolute', left: 20, top: 15, width: 32, height: 32, marginBottom: 0 }]} />
                  ) : (
                    <View style={[styles.profileIconContainer, { position: 'absolute', left: 20, top: 15, backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16 }]}>
                      <Feather name="shield" size={16} color="#FFFFFF" />
                    </View>
                  )}

                  <View style={{ width: '100%', alignItems: 'center', paddingHorizontal: 70, minHeight: 60, justifyContent: 'center' }}>
                                 <Text style={[styles.profileShopTitle, { color: colors.text, textAlign: 'center', fontSize: 34, lineHeight: 38 }]} numberOfLines={1} adjustsFontSizeToFit>{businessDetails.shopName || "MOTORCYCLE HUB"}</Text>
                    {businessDetails.shopDescription ? (
                      <Text style={[styles.profileShopDesc, { color: colors.subtext, textAlign: 'center', width: '100%', marginTop: 0 }]} numberOfLines={1} adjustsFontSizeToFit>{businessDetails.shopDescription}</Text>
                    ) : null}
                    {(businessDetails.ownerName || businessDetails.instagramId) ? (
                      <Text style={[styles.profileShopOwner, { color: colors.text, marginTop: 2, fontSize: 13, opacity: 0.85 }]} numberOfLines={1} adjustsFontSizeToFit>
                        {businessDetails.ownerName}{businessDetails.ownerName && businessDetails.instagramId ? ' • ' : ''}{businessDetails.instagramId}
                      </Text>
                    ) : null}
                  </View>
                </View>
                
                {(businessDetails.shopName || businessDetails.ownerName) && <View style={styles.profileCardDivider} />}
                
                <View style={styles.tapToEdit}>
                  <Feather name="edit-3" size={14} color={colors.primary} />
                  <Text style={[styles.tapToEditText, { color: colors.primary }]}>TAP TO EDIT DETAILS</Text>
                </View>
              </TouchableOpacity>
            </Reanimated.View>
          ) : (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <Reanimated.View 
                entering={ZoomIn.springify().damping(22).mass(0.8).duration(400)}
                style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '80%' }]}
              >
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setShowProfileDetails(false)}>
                    <Feather name="arrow-left" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: colors.text, flex: 1, marginLeft: 12 }]}>Edit Profile</Text>
                  <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                    <Feather name="x" size={24} color={colors.subtext} />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={{ paddingBottom: 20 }}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                >
                  <View style={styles.logoPickerContainer}>
                    <TouchableOpacity 
                      onPress={pickImage}
                      style={[styles.logoPicker, { backgroundColor: colors.background, borderColor: colors.border }]}
                    >
                      {pLogo ? (
                        <Image source={{ uri: pLogo }} style={styles.logoPreview} />
                      ) : (
                        <View style={styles.logoPlaceholder}>
                          <Feather name="camera" size={24} color={colors.subtext} />
                          <Text style={[styles.logoPlaceholderText, { color: colors.subtext }]}>Add Logo</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {pLogo && (
                      <TouchableOpacity 
                        style={styles.removeLogoButton}
                        onPress={() => {
                          setPLogo(undefined);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        }}
                      >
                        <Text style={styles.removeLogoText}>Remove Logo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.subtext }]}>Shop Name</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="e.g. My Workshop"
                      placeholderTextColor={colors.subtext}
                      value={pShop}
                      onChangeText={setPShop}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.subtext }]}>Service Description</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="Shop Description (optional)"
                      placeholderTextColor={colors.subtext}
                      value={pDesc}
                      onChangeText={setPDesc}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.subtext }]}>Owner Name</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="e.g. Ragu"
                      placeholderTextColor={colors.subtext}
                      value={pOwner}
                      onChangeText={setPOwner}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.subtext }]}>Shop Address</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, height: 60 }]}
                      placeholder="Full address"
                      placeholderTextColor={colors.subtext}
                      value={pAddress}
                      onChangeText={setPAddress}
                      multiline
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.subtext }]}>Phone Number(s)</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="e.g. 9876543210"
                      placeholderTextColor={colors.subtext}
                      value={pPhone}
                      onChangeText={setPPhone}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.subtext }]}>Instagram Handle</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="@your_handle"
                      placeholderTextColor={colors.subtext}
                      value={pInsta}
                      onChangeText={setPInsta}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.submitCustomButton, { backgroundColor: colors.primary, marginTop: 10 }]}
                    onPress={async () => {
                       try {
                         await updateBusinessDetails({
                           ownerName: pOwner,
                           shopName: pShop,
                           shopAddress: pAddress,
                           phoneNumbers: pPhone,
                           instagramId: pInsta,
                           shopLogo: pLogo,
                           shopDescription: pDesc
                         });
                         setProfileModalVisible(false);
                         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                     } catch {
                       Alert.alert("Error", "Failed to save profile.");
                     }
                    }}
                  >
                    <Text style={styles.submitCustomButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </ScrollView>
              </Reanimated.View>
            </TouchableWithoutFeedback>
          )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <Reanimated.View 
                entering={ZoomIn.springify().damping(22).mass(0.8).duration(400)}
                style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Add Item</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Feather name="x" size={24} color={colors.subtext} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.subtext }]}>Item Name</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter item name"
                    placeholderTextColor={colors.subtext}
                    value={customName}
                    onChangeText={setCustomName}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.subtext }]}>Price (₹)</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="0"
                    placeholderTextColor={colors.subtext}
                    value={customPrice}
                    onChangeText={setCustomPrice}
                    keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.submitCustomButton, { backgroundColor: colors.primary }]}
                  onPress={submitCustomItem}
                >
                  <Text style={styles.submitCustomButtonText}>Add to Bill</Text>
                </TouchableOpacity>
              </Reanimated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: "#E53935",
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: colors.text,
    marginTop: -4,
  },
  headerTagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: colors.subtext,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginLeft: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownMenu: {
    position: "absolute",
    top: 50,
    right: 0,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  dropdownText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.text,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.text,
    height: 48,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: isDark ? "#251B1B" : "#FEECEB",
  },
  cardMain: {
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
    paddingRight: 60, // Space for side buttons
    paddingLeft: 4,
  },
  nameContainer: {
    minHeight: 24,
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  cardName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.text,
    textAlign: "left",
    lineHeight: 22,
  },
  cardPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFC107",
    textAlign: "left",
  },
  cardActions: {
    position: "absolute",
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plusContainer: {
    position: "relative",
  },
  quantityBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFC107",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  quantityBadgeText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 10,
    color: "#FFFFFF",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  plusButton: {
    backgroundColor: colors.accent,
  },
  plusButtonActive: {
    backgroundColor: colors.primary,
  },
  minusButton: {
    backgroundColor: colors.accent,
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
    width: 65,
    height: "100%",
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  quickAddRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickAddButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAddText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.text,
  },
  sectionHeader: {
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#444",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  brandScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  brandTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandTabSelected: {
    backgroundColor: "#E53935",
    borderColor: "#E53935",
  },
  brandTabText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#A0A0A0",
  },
  brandTabTextSelected: {
    color: "#FFFFFF",
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryTabSelected: {
    borderColor: "#FFC107",
    backgroundColor: "#221C10",
  },
  categoryTabText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#666666",
  },
  categoryTabTextSelected: {
    color: colors.secondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.subtext,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  nextButton: {
    backgroundColor: colors.card,
    borderRadius: 20,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    position: "relative",
    overflow: "hidden",
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  cartBadge: {
    backgroundColor: "#E53935",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  cartBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#FFFFFF",
  },
  nextButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: colors.text,
    letterSpacing: 2,
  },
  nextButtonSubtext: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.secondary,
  },
  addCustomButtonEmpty: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E53935",
  },
  addCustomButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#E53935",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
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
    color: colors.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#A0A0A0",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  submitCustomButton: {
    backgroundColor: "#E53935",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitCustomButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  profileCardFull: {
    width: "100%",
    padding: 30,
    borderRadius: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
  },
  profileCardHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    position: "relative",
  },
  profileIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  profileCloseTop: {
    position: "absolute",
    right: 15,
    top: 15,
    padding: 8,
  },
  profileShopTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 24,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  profileShopDesc: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    textAlign: "center",
    marginTop: 2,
  },
  profileShopOwner: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
  },
  profileCardDivider: {
    width: "40%",
    height: 1,
    backgroundColor: "rgba(150,150,150,0.2)",
    marginVertical: 24,
  },
  tapToEdit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    opacity: 0.9,
  },
  tapToEditText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 1,
  },
  profileLogoLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 0,
  },
  logoPickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  logoPicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoPlaceholderText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  removeLogoButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removeLogoText: {
    color: '#E53935',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
});
