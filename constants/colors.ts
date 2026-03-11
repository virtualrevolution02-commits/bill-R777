const Colors = {
  background: '#0F0F0F',
  card: '#1E1E1E',
  cardElevated: '#2A2A2A',
  accent: '#E53935',
  accentLight: '#FF5252',
  yellow: '#FFC107',
  white: '#FFFFFF',
  lightGrey: '#A0A0A0',
  midGrey: '#666666',
  darkGrey: '#333333',
  border: '#2C2C2C',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  success: '#4CAF50',
};

export default {
  light: {
    text: Colors.white,
    background: Colors.background,
    tint: Colors.accent,
    tabIconDefault: Colors.midGrey,
    tabIconSelected: Colors.accent,
  },
  ...Colors,
};
