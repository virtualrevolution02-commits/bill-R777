import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useGarage, SparePart } from "@/context/GarageContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const ALL_PARTS: SparePart[] = [
  {
    id: "headlight",
    name: "Head Light",
    price: 850,
    image: require("@/assets/images/parts/headlight.png"),
  },
  {
    id: "brake-cable",
    name: "Brake Cable",
    price: 180,
    image: require("@/assets/images/parts/brake-cable.png"),
  },
  {
    id: "engine-oil",
    name: "Engine Oil",
    price: 450,
    image: require("@/assets/images/parts/engine-oil.png"),
  },
  {
    id: "mirror",
    name: "Mirror",
    price: 250,
    image: require("@/assets/images/parts/mirror.png"),
  },
];

function PartCard({
  part,
  isSelected,
  quantity,
  onAdd,
}: {
  part: SparePart;
  isSelected: boolean;
  quantity: number;
  onAdd: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
    onAdd();
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
      <View style={styles.cardImageContainer}>
        <Image
          source={part.image}
          style={styles.cardImage}
          contentFit="cover"
        />
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>{quantity}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {part.name}
          </Text>
          <Text style={styles.cardPrice}>₹{part.price}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, isSelected && styles.addButtonSelected]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { addToCart, cart, grandTotal } = useGarage();
  const [search, setSearch] = useState("");

  const filtered = ALL_PARTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getCartItem = (id: string) => cart.find((c) => c.id === id);

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
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="menu" size={22} color="#FFFFFF" />
        </TouchableOpacity>
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {filtered.map((part) => {
            const cartItem = getCartItem(part.id);
            return (
              <PartCard
                key={part.id}
                part={part}
                isSelected={!!cartItem}
                quantity={cartItem?.quantity ?? 0}
                onAdd={() => addToCart(part)}
              />
            );
          })}
        </View>

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="package" size={40} color="#444444" />
            <Text style={styles.emptyText}>No parts found</Text>
          </View>
        )}
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardImageContainer: {
    position: "relative",
    width: "100%",
    height: CARD_WIDTH * 0.85,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#E53935",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  selectedBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#FFFFFF",
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  cardName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#FFFFFF",
    marginBottom: 3,
  },
  cardPrice: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFC107",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonSelected: {
    backgroundColor: "#E53935",
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
});
