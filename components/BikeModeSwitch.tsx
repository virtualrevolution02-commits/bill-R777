import React, { useEffect } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import Svg, { Path, Circle, Defs, RadialGradient, Stop, G } from "react-native-svg";
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const BikeModeSwitch = () => {
  const { toggleTheme, isDark, colors } = useTheme();
  const lightOn = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    lightOn.value = withTiming(isDark ? 1 : 0, { duration: 400 });
  }, [isDark]);

  const animatedBeamProps = useAnimatedProps(() => {
    return {
      opacity: lightOn.value,
      fill: "url(#beamGradient)"
    };
  });

  const animatedHeadlightProps = useAnimatedProps(() => {
    return {
      fill: lightOn.value > 0.5 ? "#FFC107" : (isDark ? "#1E1E1E" : "#D1D1D6"),
      stroke: lightOn.value > 0.5 ? "#FFD54F" : (isDark ? "#333" : "#CCC"),
    };
  });

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={toggleTheme} 
      style={styles.container}
    >
      <Svg width="50" height="40" viewBox="0 0 50 40">
        <Defs>
          <RadialGradient
            id="beamGradient"
            cx="25"
            cy="15"
            rx="25"
            ry="25"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={isDark ? "#FFFFFF" : "#FFF9E6"} stopOpacity="0.6" />
            <Stop offset="1" stopColor={isDark ? "#FFFFFF" : "#FFF9E6"} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Headlight Beam */}
        <AnimatedPath
          d="M25,15 L0,40 L50,40 Z"
          animatedProps={animatedBeamProps}
        />

        {/* Front View Motorbike Outline */}
        <G>
          {/* Handlebars */}
          <Path
            d="M10 15 Q25 8 40 15"
            fill="none"
            stroke={colors.text}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Circle cx="10" cy="15" r="2.5" fill={colors.text} />
          <Circle cx="40" cy="15" r="2.5" fill={colors.text} />

          {/* Mirrors */}
          <Circle cx="13" cy="9" r="3.5" fill={colors.card} stroke={colors.text} strokeWidth="1.5" />
          <Circle cx="37" cy="9" r="3.5" fill={colors.card} stroke={colors.text} strokeWidth="1.5" />

          {/* Bike Body/Forks */}
          <Path
             d="M20 15 L22 30 M30 15 L28 30"
             stroke={colors.text}
             strokeWidth="2.5"
             strokeLinecap="round"
          />

          {/* Main Headlight Housing */}
          <Circle cx="25" cy="18" r="8" fill={colors.card} stroke={colors.text} strokeWidth="2" />
          
          {/* Internal Headlight Lens */}
          <AnimatedCircle
            cx="25"
            cy="18"
            r="6"
            animatedProps={animatedHeadlightProps}
          />
          
          {/* Front Fender/Tire partial */}
          <Path
            d="M20 35 Q25 32 30 35"
            fill="none"
            stroke={colors.text}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </G>
      </Svg>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
});
