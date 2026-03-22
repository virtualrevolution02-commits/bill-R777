import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const lineScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(lineScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(progressWidth, {
        toValue: width - 64,
        duration: 2500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      handleAnimationComplete();
    });
  }, [lineScale, logoOpacity, logoScale, progressWidth, subtitleOpacity]);

  const handleAnimationComplete = () => {
    router.replace("/home");
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
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <Text style={[styles.logoSub, { color: colors.subtext, fontSize: 16, letterSpacing: 4, marginBottom: 8 }]}>BUILT BY</Text>
          <Text style={[styles.logo, { fontSize: 42, lineHeight: 48, textAlign: 'center' }]}>VISTARA</Text>
          <Text style={[styles.logo, { fontSize: 42, lineHeight: 48, textAlign: 'center' }]}>TECH</Text>
        </Animated.View>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: colors.accent }]}>
          <Animated.View
            style={[styles.progressBar, { width: progressWidth, backgroundColor: colors.primary }]}
          />
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    fontFamily: "Inter_700Bold",
    fontSize: 72,
    color: "#E53935",
    letterSpacing: 4,
    lineHeight: 80,
  },
  logoSub: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: colors.text,
    letterSpacing: 6,
    marginTop: -4,
  },
  logoDivider: {
    width: 40,
    height: 2,
    backgroundColor: "#E53935",
    marginTop: 16,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.subtext,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  bikeContainer: {
    width: width,
    height: height * 0.38,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bikeImage: {
    width: width,
    height: height * 0.35,
  },
  progressContainer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    width: "100%",
  },
  progressTrack: {
    height: 2,
    backgroundColor: "#2A2A2A",
    borderRadius: 1,
    overflow: "hidden",
  },
  progressBar: {
    height: 2,
    backgroundColor: "#E53935",
    borderRadius: 1,
  },
});
