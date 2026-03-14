import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line, Ellipse, Rect } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');

// Master viewBox: 360 x 200 — all part positions reference this
const VW = 360;
const VH = 200;
const SCALE = (SW * 0.7) / VW;
const W = VW * SCALE;
const H = VH * SCALE;

// ─── Part-assembly animation ───────────────────────────────────────────────
interface PartProps {
  children: React.ReactNode;
  fromX: number;
  fromY: number;
  delay: number;
  onLand?: () => void;
}

function Part({ children, fromX, fromY, delay, onLand }: PartProps) {
  const tx = useSharedValue(fromX);
  const ty = useSharedValue(fromY);
  const rot = useSharedValue(fromX > 0 ? 25 : -25);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.55);

  useEffect(() => {
    const spring = { damping: 16, stiffness: 85, mass: 0.85 };
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    tx.value = withDelay(delay, withSpring(0, spring));
    ty.value = withDelay(delay, withSpring(0, spring));
    rot.value = withDelay(delay, withTiming(0, { duration: 950, easing: Easing.out(Easing.quad) }));
    scale.value = withDelay(delay, withSpring(1, { damping: 14, stiffness: 110 }));
    if (onLand) setTimeout(onLand, delay + 1150);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
      { scale: scale.value },
    ],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

function SmokeParticle({ delay }: { delay: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useEffect(() => {
    const duration = 1000;
    opacity.value = withDelay(delay, withSequence(
      withTiming(0.6, { duration: 200 }),
      withTiming(0, { duration: 800 })
    ));
    scale.value = withDelay(delay, withTiming(2.5, { duration }));
    tx.value = withDelay(delay, withTiming(-60 - Math.random() * 40, { duration }));
    ty.value = withDelay(delay, withTiming(-20 + Math.random() * 40, { duration }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    opacity: opacity.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Svg width={20} height={20}>
        <Circle cx={10} cy={10} r={8} fill="#AAAAAA" />
      </Svg>
    </Animated.View>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function makeSpokes(cx: number, cy: number, r1: number, r2: number, n: number, color = '#3C3C3C') {
  return Array.from({ length: n }, (_, i) => {
    const a = ((i * 360) / n) * (Math.PI / 180);
    return (
      <Line
        key={i}
        x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1}
        x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2}
        stroke={color} strokeWidth="1.4"
      />
    );
  });
}

function makeTread(cx: number, cy: number, r: number, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = ((i * 360) / n) * (Math.PI / 180);
    const da = (3.5 * Math.PI) / 180;
    const x1 = cx + Math.cos(a - da) * r;
    const y1 = cy + Math.sin(a - da) * r;
    const x2 = cx + Math.cos(a + da) * r;
    const y2 = cy + Math.sin(a + da) * r;
    const ox = cx + Math.cos(a) * (r - 4.5);
    const oy = cy + Math.sin(a) * (r - 4.5);
    return <Path key={i} d={`M ${x1} ${y1} L ${ox} ${oy} L ${x2} ${y2}`} stroke="#1E1E1E" strokeWidth="1.8" fill="none" />;
  });
}

// ─── Main Component ─────────────────────────────────────────────────────────
interface Props { onComplete: () => void; }

export default function BikeRepairAnimation({ onComplete }: Props) {
  const bikeX   = useSharedValue(0);
  const bikeY   = useSharedValue(0);
  const bikeRot = useSharedValue(0);
  const bikeO   = useSharedValue(1);
  const showSmoke = useSharedValue(false);

  const runPostAssembly = useCallback(() => {
    setTimeout(() => {
      // Wheelie
      showSmoke.value = true;
      bikeY.value   = withSequence(
        withTiming(-28, { duration: 560, easing: Easing.out(Easing.quad) }),
        withDelay(280, withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) }))
      );
      bikeRot.value = withSequence(
        withTiming(-17, { duration: 560, easing: Easing.out(Easing.quad) }),
        withDelay(280, withTiming(0, { duration: 420, easing: Easing.out(Easing.quad) }))
      );
      // Zoom off
      setTimeout(() => {
        bikeX.value = withTiming(SW + 400, { duration: 720, easing: Easing.in(Easing.exp) });
        bikeO.value = withTiming(0, { duration: 700 });
        setTimeout(() => runOnJS(onComplete)(), 760);
      }, 1350);
    }, 450);
  }, [bikeX, bikeY, bikeRot, bikeO, onComplete]);

  const bikeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: bikeX.value },
      { translateY: bikeY.value },
      { rotate:    `${bikeRot.value}deg` },
    ],
    opacity: bikeO.value,
  }));

  const smokeStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: W * 0.1,
    top: H * 0.7,
    display: showSmoke.value ? 'flex' : 'none',
  }));

  // Pre-compute spoke/tread arrays (stable between renders)
  const rwOuter = 40, rwInner = 26, rwCx = 42, rwCy = 42;
  const fwOuter = 36, fwInner = 23, fwCx = 38, fwCy = 38;
  const rwSpokes = makeSpokes(rwCx, rwCy, 7, rwInner - 1, 10);
  const fwSpokes = makeSpokes(fwCx, fwCy, 6, fwInner - 1, 9);
  const rwTread  = makeTread(rwCx, rwCy, rwOuter - 1, 32);
  const fwTread  = makeTread(fwCx, fwCy, fwOuter - 1, 28);

  return (
    <View style={styles.container}>
      <Animated.View style={bikeStyle}>
        <View style={{ width: W, height: H }}>
          <Animated.View style={smokeStyle}>
            {Array.from({ length: 15 }).map((_, i) => (
              <SmokeParticle key={i} delay={i * 100} />
            ))}
          </Animated.View>

          {/* ══════════════════════════════════════════════════
              REAR WHEEL  — master pos: cx=72, cy=158, r=40
              Part box top-left: (30, 116) → svg 84×84
          ════════════════════════════════════════════════════ */}
          <View style={[styles.abs, { left: 30 * SCALE, top: 116 * SCALE }]}>
            <Part fromX={-SW * 0.75} fromY={SH * 0.35} delay={0}>
              <Svg width={84 * SCALE} height={84 * SCALE} viewBox="0 0 84 84">
                {/* Outer tire band */}
                <Circle cx={rwCx} cy={rwCy} r={rwOuter}   fill="#101010" />
                <Circle cx={rwCx} cy={rwCy} r={rwOuter-3} fill="#181818" />
                {/* Tread blocks */}
                {rwTread}
                {/* Tyre sidewall ring */}
                <Circle cx={rwCx} cy={rwCy} r={rwOuter-4.5} fill="none" stroke="#252525" strokeWidth="1" />
                {/* Rim outer */}
                <Circle cx={rwCx} cy={rwCy} r={rwInner+1} fill="none" stroke="#2A2A2A" strokeWidth="2.5" />
                {/* Rim lip */}
                <Circle cx={rwCx} cy={rwCy} r={rwInner-1} fill="none" stroke="#1E1E1E" strokeWidth="1" />
                {/* Spokes */}
                {rwSpokes}
                {/* Brake disc */}
                <Circle cx={rwCx} cy={rwCy} r={20} fill="none" stroke="#3A3A3A" strokeWidth="1.2" strokeDasharray="5,3" />
                {[0,60,120,180,240,300].map(deg => {
                  const a = deg * Math.PI / 180;
                  return <Circle key={deg} cx={rwCx+Math.cos(a)*17} cy={rwCy+Math.sin(a)*17} r={2.8} fill="#131313" stroke="#404040" strokeWidth="1" />;
                })}
                {/* Hub shell */}
                <Circle cx={rwCx} cy={rwCy} r={9}   fill="#161616" stroke="#2E2E2E" strokeWidth="2" />
                <Circle cx={rwCx} cy={rwCy} r={5.5} fill="#111"    stroke="#3C3C3C" strokeWidth="1" />
                {/* Hub bolts */}
                {[0,72,144,216,288].map(deg => {
                  const a = deg * Math.PI / 180;
                  return <Circle key={deg} cx={rwCx+Math.cos(a)*7.2} cy={rwCy+Math.sin(a)*7.2} r={1.5} fill="#2A2A2A" stroke="#555" strokeWidth="0.8" />;
                })}
                {/* Axle */}
                <Circle cx={rwCx} cy={rwCy} r={2.8} fill="#606060" />
                <Circle cx={rwCx} cy={rwCy} r={1.4} fill="#999" />
              </Svg>
            </Part>
          </View>

          {/* ══════════════════════════════════════════════════
              FRONT WHEEL — master pos: cx=280, cy=158, r=36
              Part box top-left: (242, 120) → svg 76×76
          ════════════════════════════════════════════════════ */}
          <View style={[styles.abs, { left: 242 * SCALE, top: 120 * SCALE }]}>
            <Part fromX={SW * 0.75} fromY={SH * 0.35} delay={200}>
              <Svg width={76 * SCALE} height={76 * SCALE} viewBox="0 0 76 76">
                <Circle cx={fwCx} cy={fwCy} r={fwOuter}   fill="#101010" />
                <Circle cx={fwCx} cy={fwCy} r={fwOuter-3} fill="#181818" />
                {fwTread}
                <Circle cx={fwCx} cy={fwCy} r={fwOuter-4.5} fill="none" stroke="#252525" strokeWidth="1" />
                <Circle cx={fwCx} cy={fwCy} r={fwInner+1} fill="none" stroke="#2A2A2A" strokeWidth="2.5" />
                {fwSpokes}
                {/* Disc */}
                <Circle cx={fwCx} cy={fwCy} r={18} fill="none" stroke="#3A3A3A" strokeWidth="1.2" strokeDasharray="4,3" />
                {[0,72,144,216,288].map(deg => {
                  const a = deg * Math.PI / 180;
                  return <Circle key={deg} cx={fwCx+Math.cos(a)*15} cy={fwCy+Math.sin(a)*15} r={2.5} fill="#131313" stroke="#404040" strokeWidth="1" />;
                })}
                <Circle cx={fwCx} cy={fwCy} r={8}   fill="#161616" stroke="#2E2E2E" strokeWidth="2" />
                <Circle cx={fwCx} cy={fwCy} r={4.5} fill="#111"    stroke="#3C3C3C" strokeWidth="1" />
                {[0,90,180,270].map(deg => {
                  const a = deg * Math.PI / 180;
                  return <Circle key={deg} cx={fwCx+Math.cos(a)*6.2} cy={fwCy+Math.sin(a)*6.2} r={1.4} fill="#2A2A2A" stroke="#555" strokeWidth="0.8" />;
                })}
                <Circle cx={fwCx} cy={fwCy} r={2.5} fill="#606060" />
                <Circle cx={fwCx} cy={fwCy} r={1.2} fill="#999" />
              </Svg>
            </Part>
          </View>

          {/* ══════════════════════════════════════════════════
              MAIN FRAME — master region: (55,55)→(275,175)
              svg 220×120  (whole tubular structure)
          ════════════════════════════════════════════════════ */}
          <View style={[styles.abs, { left: 55 * SCALE, top: 55 * SCALE }]}>
            <Part fromX={0} fromY={-SH * 0.65} delay={420}>
              <Svg width={220 * SCALE} height={120 * SCALE} viewBox="0 0 220 120">
                {/* Swingarm (lower rear tube, connects rear axle to pivot) */}
                <Path d="M14,103 Q30,95 55,85 L60,85"
                  stroke="#B71C1C" strokeWidth="4" fill="none" strokeLinecap="round" />
                <Path d="M18,107 Q34,100 57,90"
                  stroke="#D32F2F" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                {/* Seat stays (go up from rear axle area to top frame) */}
                <Path d="M22,104 L40,60 L62,62"
                  stroke="#C62828" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* Main backbone – top tube */}
                <Path d="M62,62 Q110,48 160,52 L188,60"
                  stroke="#E53935" strokeWidth="4" fill="none" strokeLinecap="round" />
                {/* Seat tube (vertical) */}
                <Path d="M62,62 L58,88"
                  stroke="#E53935" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                {/* Chain stay lower */}
                <Path d="M58,88 Q40,95 22,104"
                  stroke="#C62828" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                {/* Down tube (diagonal main structural tube) */}
                <Path d="M58,88 Q100,105 155,95 L188,75"
                  stroke="#E53935" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* Head tube (short vertical, front) */}
                <Path d="M188,60 L188,80"
                  stroke="#E53935" strokeWidth="7" fill="none" strokeLinecap="round" />
                {/* Gusset plates at junctions */}
                <Path d="M58,62 Q60,75 55,88"  stroke="#9B0000" strokeWidth="2" fill="none" />
                <Path d="M186,60 Q190,70 186,82" stroke="#9B0000" strokeWidth="2" fill="none" />
                {/* Sub-frame seat section */}
                <Path d="M62,62 Q50,65 42,72 L28,90 L22,104"
                  stroke="#A00000" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* Bracing strut */}
                <Path d="M120,62 L115,90"
                  stroke="#A00000" strokeWidth="2" fill="none" strokeDasharray="4,2" />
                {/* Frame bolt holes */}
                {[[60,62],[60,88],[188,60],[188,80],[118,76]].map(([x,y],i) => (
                  <Circle key={i} cx={x} cy={y} r={4} fill="#E53935" stroke="#8B0000" strokeWidth="1.2" />
                ))}
                {/* Rear shock mount */}
                <Path d="M55,78 L48,95" stroke="#C62828" strokeWidth="3" fill="none" strokeLinecap="round" />
                <Ellipse cx={46} cy={97} rx={5} ry={4} fill="#1A1A1A" stroke="#E53935" strokeWidth="1.5" />
              </Svg>
            </Part>
          </View>

          {/* ══════════════════════════════════════════════════
              ENGINE — master: (120,100)→(220,158)
              svg 100×60
          ════════════════════════════════════════════════════ */}
          <View style={[styles.abs, { left: 120 * SCALE, top: 100 * SCALE }]}>
            <Part fromX={0} fromY={SH * 0.55} delay={560}>
              <Svg width={100 * SCALE} height={60 * SCALE} viewBox="0 0 100 60">
                {/* Main casing */}
                <Path d="M4,6 Q4,2 8,2 L92,2 Q96,2 96,6 L96,50 Q96,56 90,56 L10,56 Q4,56 4,50 Z"
                  fill="#141414" stroke="#272727" strokeWidth="1.8" />
                {/* Cylinder head block (top) */}
                <Rect x={22} y={2} width={38} height={12} rx={2} fill="#1A1A1A" stroke="#303030" strokeWidth="1.2"  />
                {/* Cooling fins */}
                {Array.from({length: 7}, (_, i) => (
                  <Line key={i} x1={22} y1={3.5+i*1.5} x2={60} y2={3.5+i*1.5} stroke="#252525" strokeWidth="0.7" />
                ))}
                {/* Spark plugs */}
                <Circle cx={33} cy={2} r={3.5} fill="#111" stroke="#444" strokeWidth="1.2" />
                <Circle cx={49} cy={2} r={3.5} fill="#111" stroke="#444" strokeWidth="1.2" />
                {/* Left crankcase */}
                <Path d="M4,30 Q4,20 12,18 L28,18 L28,46 L12,46 Q4,46 4,38 Z"
                  fill="#1A1A1A" stroke="#2A2A2A" strokeWidth="1" />
                {/* Clutch cover */}
                <Ellipse cx={80} cy={32} rx={13} ry={17} fill="#181818" stroke="#2C2C2C" strokeWidth="1.5" />
                <Ellipse cx={80} cy={32} rx={8}  ry={11} fill="#111"    stroke="#333"   strokeWidth="1" />
                <Ellipse cx={80} cy={32} rx={4}  ry={5}  fill="#0E0E0E" stroke="#444"   strokeWidth="0.8" />
                {/* Horizontal texture lines on crankcase */}
                {[22,28,34,40].map(y => (
                  <Line key={y} x1={32} y1={y} x2={62} y2={y} stroke="#1E1E1E" strokeWidth="0.8" />
                ))}
                {/* Case bolts */}
                {[[8,12],[8,50],[92,12],[92,50],[50,2],[50,56]].map(([x,y],i) => (
                  <Circle key={i} cx={x} cy={y} r={2.8} fill="#121212" stroke="#3A3A3A" strokeWidth="1" />
                ))}
                {/* Oil sight glass */}
                <Circle cx={20} cy={42} r={5} fill="#0A120A" stroke="#2A3A2A" strokeWidth="1" />
                <Circle cx={20} cy={42} r={3} fill="#0D1F0D" />
                {/* Exhaust port stub */}
                <Rect x={0} y={36} width={6} height={8} rx={1} fill="#1E1E1E" stroke="#333" strokeWidth="1" />
              </Svg>
            </Part>
          </View>

          {/* ══════════════════════════════════════════════════
              FUEL TANK — master: (130,38)→(250,82)
              svg 120×48
          ════════════════════════════════════════════════════ */}
          <View style={[styles.abs, { left: 130 * SCALE, top: 38 * SCALE }]}>
            <Part fromX={-SW * 0.55} fromY={-SH * 0.5} delay={660}>
              <Svg width={120 * SCALE} height={48 * SCALE} viewBox="0 0 120 48">
                {/* Main tank shell */}
                <Path d="M8,44 Q2,44 2,38 L2,20 Q2,4 18,4 L102,4 Q116,4 116,18 L116,38 Q116,44 108,44 Z"
                  fill="#101010" stroke="#222" strokeWidth="1.5" />
                {/* Red accent body line */}
                <Path d="M8,12 Q60,4 112,14"
                  stroke="#E53935" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.8" />
                <Path d="M8,14 Q60,7 112,16"
                  stroke="#FF5252" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.3" />
                {/* Tank badge recess */}
                <Path d="M38,22 Q38,14 46,14 L74,14 Q82,14 82,22 L82,36 Q82,44 74,44 L46,44 Q38,44 38,36 Z"
                  fill="#0C0C0C" stroke="#202020" strokeWidth="1" />
                {/* Knee grip pads — left */}
                <Path d="M6,28 Q8,22 14,22 L26,22 Q32,22 32,28 L32,42 Q32,46 26,46 L14,46 Q8,46 6,42 Z"
                  fill="#191919" stroke="#2D2D2D" strokeWidth="1" />
                {Array.from({length:6}, (_, i) => (
                  <Line key={i} x1={8} y1={24+i*3} x2={30} y2={24+i*3} stroke="#1E1E1E" strokeWidth="0.8" />
                ))}
                {/* Knee grip pads — right */}
                <Path d="M88,28 Q90,22 96,22 L108,22 Q114,22 114,28 L114,42 Q114,46 108,46 L96,46 Q90,46 88,42 Z"
                  fill="#191919" stroke="#2D2D2D" strokeWidth="1" />
                {Array.from({length:6}, (_, i) => (
                  <Line key={i} x1={90} y1={24+i*3} x2={112} y2={24+i*3} stroke="#1E1E1E" strokeWidth="0.8" />
                ))}
                {/* Tank filler cap */}
                <Circle cx={60} cy={6}  r={7}   fill="#1A1A1A" stroke="#3A3A3A" strokeWidth="1.5" />
                <Circle cx={60} cy={6}  r={4.5} fill="#101010" stroke="#474747" strokeWidth="1" />
                <Circle cx={60} cy={6}  r={2}   fill="#333" />
                <Line x1={57} y1={3.5} x2={63} y2={8.5} stroke="#555" strokeWidth="0.9" />
                <Line x1={63} y1={3.5} x2={57} y2={8.5} stroke="#555" strokeWidth="0.9" />
                {/* Seam line */}
                <Path d="M2,24 L116,24" stroke="#1A1A1A" strokeWidth="0.8" strokeDasharray="4,3" />
              </Svg>
            </Part>
          </View>

          {/* ══════════════════════════════════════════════════
              SEAT / TAIL UNIT — master: (84,60)→(148,94)
              svg 64×38
          ════════════════════════════════════════════════════ */}
          <View style={[styles.abs, { left: 84 * SCALE, top: 60 * SCALE }]}>
            <Part fromX={SW * 0.55} fromY={-SH * 0.45} delay={740}>
              <Svg width={64 * SCALE} height={38 * SCALE} viewBox="0 0 64 38">
                {/* Tail section structure */}
                <Path d="M4,34 Q2,34 2,30 L2,18 Q2,8 10,6 L56,4 Q62,4 62,10 L62,26 Q62,34 54,36 L8,36 Q4,36 4,34 Z"
                  fill="#0E0E0E" stroke="#252525" strokeWidth="1.2" />
                {/* Seat cushion surface */}
                <Path d="M6,32 Q4,32 4,28 L4,16 Q4,8 11,8 L55,6 Q60,6 60,12 L60,26 Q60,32 53,34 L8,34 Z"
                  fill="#151515" />
                {/* Cushion centre line */}
                <Path d="M8,20 Q32,14 58,18" stroke="#222" strokeWidth="1" strokeDasharray="4,2" fill="none" />
                <Path d="M8,24 Q32,18 58,22" stroke="#222" strokeWidth="1" strokeDasharray="4,2" fill="none" />
                {/* Seat stitching */}
                <Path d="M6,28 Q32,22 60,26" stroke="#1E1E1E" strokeWidth="0.7" strokeDasharray="2.5,2" fill="none" />
                {/* Rear LED strip */}
                <Rect x={2} y={32} width={62} height={3} rx={1} fill="#E53935" opacity={0.85} />
                <Rect x={4} y={32.8} width={58} height={1.5} fill="#FF5252" opacity={0.4} />
                {/* Grab handle */}
                <Path d="M50,6 Q58,5 60,10" stroke="#3A3A3A" strokeWidth="2" fill="none" strokeLinecap="round" />
                {/* Pillion peg mount */}
                <Circle cx={54} cy={36} r={3} fill="#1A1A1A" stroke="#3C3C3C" strokeWidth="1" />
              </Svg>
            </Part>
          </View>

          {/* ══════════════════════════════════════════════════
              FRONT FORK + HEADLIGHT — master: (232,54)→(305,164)
              svg 73×110
          ════════════════════════════════════════════════════ */}
          <View style={[styles.abs, { left: 232 * SCALE, top: 54 * SCALE }]}>
            <Part fromX={SW * 0.45} fromY={-SH * 0.5} delay={860} onLand={runPostAssembly}>
              <Svg width={73 * SCALE} height={110 * SCALE} viewBox="0 0 73 110">
                {/* Fork outer tubes (upper) */}
                <Path d="M16,28 L8,100"  stroke="#2E2E2E" strokeWidth="6.5" strokeLinecap="round" />
                <Path d="M26,28 L34,100" stroke="#2E2E2E" strokeWidth="6.5" strokeLinecap="round" />
                {/* Fork inner sliders (chrome lower) */}
                <Path d="M16,28 L10,72"  stroke="#484848" strokeWidth="3.5" strokeLinecap="round" />
                <Path d="M26,28 L32,72"  stroke="#484848" strokeWidth="3.5" strokeLinecap="round" />
                {/* Fork dust seals band */}
                <Path d="M10,60 L32,62" stroke="#1E1E1E" strokeWidth="5" strokeLinecap="round" />
                <Path d="M10,64 L32,66" stroke="#2A2A2A" strokeWidth="2.5" strokeLinecap="round" />
                {/* Fork lower legs (bigger tubes) */}
                <Path d="M8,68  L7,100"  stroke="#1E1E1E" strokeWidth="9" strokeLinecap="round" />
                <Path d="M34,70 L35,100" stroke="#1E1E1E" strokeWidth="9" strokeLinecap="round" />
                {/* Axle yoke at bottom */}
                <Rect x={5} y={97} width={33} height={8} rx={2} fill="#191919" stroke="#2D2D2D" strokeWidth="1" />
                {/* Brake caliper */}
                <Rect x={3} y={72} width={10} height={18} rx={2} fill="#141414" stroke="#E53935" strokeWidth="1" />
                <Rect x={5} y={74} width={6}  height={6}  rx={1} fill="#0A0A0A" stroke="#333" strokeWidth="0.8" />
                {/* Upper triple clamp */}
                <Path d="M10,24 L32,24 Q36,24 36,28 L36,34 Q36,38 32,38 L10,38 Q6,38 6,34 L6,28 Q6,24 10,24 Z"
                  fill="#181818" stroke="#2A2A2A" strokeWidth="1.2" />
                {/* Triple clamp bolts */}
                {[[10,31],[32,31]].map(([x,y],i) => (
                  <Circle key={i} cx={x} cy={y} r={2.5} fill="#111" stroke="#3D3D3D" strokeWidth="1" />
                ))}
                {/* Steering stem */}
                <Rect x={19} y={10} width={4} height={16} rx={1} fill="#333" stroke="#444" strokeWidth="1" />
                {/* Headlight housing */}
                <Path d="M5,4 Q5,1 22,1 Q36,1 36,4 L36,20 Q36,24 22,24 Q5,24 5,20 Z"
                  fill="#0A0A0A" stroke="#E53935" strokeWidth="1.8" />
                {/* Headlight projector lens */}
                <Path d="M8,6 Q22,5 34,6 L34,18 Q22,20 8,18 Z"
                  fill="#060614" stroke="#12122A" strokeWidth="1" />
                {/* DRL inner ring */}
                <Ellipse cx={22} cy={12.5} rx={10} ry={6.5} fill="none" stroke="#E53935" strokeWidth="1.2" opacity={0.7} />
                {/* Projector bowl */}
                <Ellipse cx={22} cy={12.5} rx={6} ry={4} fill="#0C0C1A" stroke="#1A1A3A" strokeWidth="1" />
                <Ellipse cx={22} cy={12}   rx={3} ry={2} fill="#101028" />
                {/* Lens glass highlight */}
                <Path d="M10,7 Q17,6 22,6.5" stroke="#FFFFFF" strokeWidth="0.8" opacity={0.12} fill="none" strokeLinecap="round" />
                {/* Top DRL bar */}
                <Rect x={7} y={2} width={28} height={2.5} rx={1} fill="#E53935" opacity={0.8} />
                {/* Turn indicators */}
                <Circle cx={6}   cy={13} r={3} fill="#0D0D0D" stroke="#5D4037" strokeWidth="1" />
                <Circle cx={38}  cy={13} r={3} fill="#0D0D0D" stroke="#5D4037" strokeWidth="1" />
                {/* Speedo cable/brake line */}
                <Path d="M8,75 Q5,82 6,95" stroke="#2A2A2A" strokeWidth="1" fill="none" strokeDasharray="3,2" />
              </Svg>
            </Part>
          </View>

          {/* ══════════════════════════════════════════════════
              EXHAUST — master: (38,130)→(145,170)
              svg 110×44
          ════════════════════════════════════════════════════ */}
          <View style={[styles.abs, { left: 38 * SCALE, top: 130 * SCALE }]}>
            <Part fromX={-SW * 0.45} fromY={SH * 0.4} delay={560}>
              <Svg width={110 * SCALE} height={44 * SCALE} viewBox="0 0 110 44">
                {/* Header pipe (from engine) */}
                <Path d="M108,8 Q70,8 50,20 Q30,32 14,34 L4,34"
                  stroke="#363636" strokeWidth="5" fill="none" strokeLinecap="round" />
                {/* Inner pipe highlight */}
                <Path d="M108,8 Q70,8 50,20 Q30,32 14,34"
                  stroke="#4E4E4E" strokeWidth="2" fill="none" strokeLinecap="round" />
                {/* Heat shield */}
                <Path d="M90,7 Q55,7 38,18" stroke="#2E2E2E" strokeWidth="8" fill="none" strokeLinecap="round" opacity={0.55} />
                {/* Shield clamps */}
                {[86,68,50].map((x,i) => {
                  const t = i / 2;
                  const y = 7 + t * 11;
                  return <Rect key={x} x={x-3} y={y-2.5} width={6} height={5} rx={1} fill="#252525" stroke="#3A3A3A" strokeWidth="0.8" />;
                })}
                {/* Muffler can */}
                <Path d="M2,28 L2,40 Q2,44 8,44 L22,44 Q28,44 28,40 L28,28 Q28,24 22,24 L8,24 Q2,24 2,28 Z"
                  fill="#191919" stroke="#333" strokeWidth="1.5" />
                {/* Muffler outlet */}
                <Ellipse cx={29} cy={34} rx={4.5} ry={10} fill="#111" stroke="#2D2D2D" strokeWidth="1.5" />
                <Ellipse cx={28} cy={34} rx={2.5} ry={7}  fill="#080808" />
                {/* Muffler detail bands */}
                <Line x1={4} y1={30} x2={26} y2={30} stroke="#222" strokeWidth="0.8" />
                <Line x1={4} y1={36} x2={26} y2={36} stroke="#222" strokeWidth="0.8" />
                {/* Carbon wrap pattern on pipe end */}
                {Array.from({length:5}, (_, i) => (
                  <Path key={i} d={`M ${70-i*8},6 L ${75-i*8},12`} stroke="#2A2A2A" strokeWidth="3" fill="none" strokeLinecap="round" />
                ))}
              </Svg>
            </Part>
          </View>

        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SW,
    height: SH * 0.44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  abs: {
    position: 'absolute',
  },
});
