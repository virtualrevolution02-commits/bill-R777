import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  FlatList,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
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
    <View style={styles.swipeContainer}>
      <Swipeable renderRightActions={renderRightActions} containerStyle={styles.swipeableWrapper} overshootRight={false}>
        {cardContent}
      </Swipeable>
    </View>
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

  // Sync profile state when context changes
  React.useEffect(() => {
    setPOwner(businessDetails.ownerName);
    setPShop(businessDetails.shopName);
    setPAddress(businessDetails.shopAddress);
    setPPhone(businessDetails.phoneNumbers);
    setPInsta(businessDetails.instagramId);
  }, [businessDetails]);

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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {businessDetails.shopName.split(' ')[0].toUpperCase()}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text }]} numberOfLines={1}>
            {businessDetails.shopName.split(' ').slice(1).join(' ').toUpperCase() || "AUTO WORKS"}
          </Text>
          <Text style={styles.headerTagline}>Sales & Service</Text>
        </View>

        <View style={styles.headerRight}>
          <BikeModeSwitch />
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: colors.card }]}
            onPress={() => setMenuOpen(!isMenuOpen)}
          >
            <Feather name="more-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {isMenuOpen && (
          <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                setShowProfileDetails(false); // Start with card view
                setProfileModalVisible(true);
              }}
            >
              <Feather name="user" size={18} color={colors.text} />
              <Text style={[styles.dropdownText, { color: colors.text }]}>Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
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
      </View>

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
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
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

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.nextButton, 
            cart.length === 0 && styles.nextButtonDisabled,
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
          <Text style={[styles.nextButtonText, { color: "#FFFFFF" }]}>NEXT →</Text>
          {cart.length > 0 && (
            <Text style={[styles.nextButtonSubtext, { color: isDark ? colors.secondary : "#FFFFFF" }]}>₹{grandTotal}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={isLabourModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLabourModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
          </View>
        </View>
      </Modal>

      <Modal
        visible={isProfileModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          {!showProfileDetails ? (
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setShowProfileDetails(true)}
              style={[styles.profileCardFull, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.profileCardHeader}>
                <View style={[styles.profileIconContainer, { backgroundColor: colors.primary }]}>
                  <Feather name="shield" size={32} color="#FFFFFF" />
                </View>
                <TouchableOpacity 
                  style={styles.profileCloseTop}
                  onPress={() => setProfileModalVisible(false)}
                >
                  <Feather name="x" size={24} color={colors.subtext} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.profileShopTitle, { color: colors.text }]}>{businessDetails.shopName}</Text>
              <Text style={[styles.profileShopOwner, { color: colors.subtext }]}>Owner: {businessDetails.ownerName}</Text>
              
              <View style={styles.profileCardDivider} />
              
              <View style={styles.tapToEdit}>
                <Feather name="edit-3" size={14} color={colors.primary} />
                <Text style={[styles.tapToEditText, { color: colors.primary }]}>TAP TO EDIT DETAILS</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '80%' }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowProfileDetails(false)}>
                  <Feather name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text, flex: 1, marginLeft: 12 }]}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                  <Feather name="x" size={24} color={colors.subtext} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
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
                         instagramId: pInsta
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
            </View>
          )}
        </View>
      </Modal>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={isDark ? 40 : 80} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
          </View>
        </View>
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
    marginBottom: 8,
    letterSpacing: -0.5,
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
});
