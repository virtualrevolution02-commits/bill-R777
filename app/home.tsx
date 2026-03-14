import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  FlatList,
  Modal,
  Alert,
  Pressable,
} from "react-native";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useGarage, SparePart } from "@/context/GarageContext";
import { ALL_PARTS, BRANDS } from "@/constants/parts";

function PartCard({
  part,
  isSelected,
  quantity,
  onAdd,
  onRemove,
  onDoubleTap,
}: {
  part: SparePart;
  isSelected: boolean;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  onDoubleTap?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const lastTapRef = useRef<number>(0);

  const handleCardPress = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      if (onDoubleTap) onDoubleTap();
    }
    
    lastTapRef.current = now;
  };

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

  return (
    <Animated.View style={[styles.card, isSelected && styles.cardSelected, { transform: [{ scale }] }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleCardPress} />
      
      <View style={styles.cardMain} pointerEvents="none">
        <View style={styles.nameContainer}>
          <Text style={styles.cardName}>
            {part.name}
          </Text>
        </View>
        <Text style={styles.cardPrice}>₹{part.price}</Text>
      </View>
      
      <View style={styles.cardActions} pointerEvents="box-none">
        {isSelected && (
          <TouchableOpacity
            style={[styles.actionButton, styles.minusButton]}
            onPress={handleRemove}
            activeOpacity={0.7}
          >
            <Feather name="minus" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <View style={styles.plusContainer}>
          <TouchableOpacity
            style={[styles.actionButton, isSelected ? styles.plusButtonActive : styles.plusButton]}
            onPress={handleAdd}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          {isSelected && (
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityBadgeText}>{quantity}</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { addToCart, decreaseQuantity, cart, grandTotal } = useGarage();
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [recentParts, setRecentParts] = useState<SparePart[]>([]);
  const [hiddenParts, setHiddenParts] = useState<string[]>([]);

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
    return [...recentParts, ...ALL_PARTS].filter(p => !hiddenParts.includes(p.id));
  }, [recentParts, hiddenParts]);

  const allBrands = useMemo(() => ["Recent", ...BRANDS], []);

  const categories = useMemo(() => {
    if (!selectedBrand) return [];
    if (selectedBrand === "Recent") return [];
    return Array.from(new Set(combinedParts.filter(p => p.brand === selectedBrand).map(p => p.category)));
  }, [selectedBrand, combinedParts]);

  const filtered = useMemo(() => {
    return combinedParts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesBrand = !selectedBrand || p.brand === selectedBrand;
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      
      // If searching, show across all categories of selected brand
      if (search) return matchesSearch && matchesBrand;
      
      // Default hierarchical view
      return matchesBrand && matchesCategory;
    });
  }, [search, selectedBrand, selectedCategory, combinedParts]);

  const getCartItem = (id: string) => cart.find((c) => c.id === id);

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
    if (cart.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/bill");
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
        <View>
          <Text style={styles.headerTitle}>R777</Text>
          <Text style={styles.headerSubtitle}>Garage Workshop</Text>
        </View>
        <View style={{ position: "relative", zIndex: 10 }}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setMenuOpen(!isMenuOpen)}
          >
            <Feather name="menu" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          {isMenuOpen && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => {
                  setMenuOpen(false);
                  router.push("/history");
                }}
              >
                <Feather name="clock" size={16} color="#A0A0A0" />
                <Text style={styles.dropdownText}>History</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#666666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search spare parts"
          placeholderTextColor="#666666"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color="#666666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.brandContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandScroll}>
          {allBrands.map((brand) => (
            <TouchableOpacity
              key={brand}
              style={[styles.brandTab, selectedBrand === brand && styles.brandTabSelected]}
              onPress={() => {
                setSelectedBrand(brand);
                setSelectedCategory(null);
              }}
            >
              <Text style={[styles.brandTabText, selectedBrand === brand && styles.brandTabTextSelected]}>
                {brand}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedBrand && !search && (
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryTab, selectedCategory === cat && styles.categoryTabSelected]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryTabText, selectedCategory === cat && styles.categoryTabTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {selectedBrand || search ? (
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
                onDoubleTap={() => handleDoubleTapItem(item)}
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
          <Feather name="layers" size={48} color="#444444" />
          <Text style={styles.emptyText}>Select a bike brand to view parts</Text>
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, cart.length === 0 && styles.nextButtonDisabled]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
          <Text style={styles.nextButtonText}>NEXT →</Text>
          {cart.length > 0 && (
            <Text style={styles.nextButtonSubtext}>₹{grandTotal}</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Item</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#A0A0A0" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter item name"
                placeholderTextColor="#666"
                value={customName}
                onChangeText={setCustomName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price (₹)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0"
                placeholderTextColor="#666"
                value={customPrice}
                onChangeText={setCustomPrice}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity 
              style={styles.submitCustomButton}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
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
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#A0A0A0",
    letterSpacing: 1,
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E1E1E",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownMenu: {
    position: "absolute",
    top: 50,
    right: 0,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2C2C2C",
    paddingVertical: 8,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
    color: "#FFFFFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#FFFFFF",
    height: 48,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2C2C2C",
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 110,
  },
  cardSelected: {
    borderColor: "#E53935",
    backgroundColor: "#251B1B",
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
    color: "#FFFFFF",
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
    borderColor: "#1E1E1E",
  },
  quantityBadgeText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 10,
    color: "#000000",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  plusButton: {
    backgroundColor: "#333333",
  },
  plusButtonActive: {
    backgroundColor: "#E53935",
  },
  minusButton: {
    backgroundColor: "#444444",
  },
  brandContainer: {
    marginBottom: 8,
  },
  brandScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  brandTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#2C2C2C",
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
    backgroundColor: "#161616",
    borderWidth: 1,
    borderColor: "#222222",
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
    color: "#FFC107",
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
    color: "#666666",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  nextButton: {
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2C2C2C",
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
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  nextButtonSubtext: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFC107",
  },
  addCustomButtonEmpty: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#1E1E1E",
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
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#333",
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
    backgroundColor: "#0F0F0F",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
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
});
