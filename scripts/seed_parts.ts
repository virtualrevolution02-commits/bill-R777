import { db } from "../server/db";
import { parts } from "../shared/schema";
import "dotenv/config";

const SPARE_PARTS = [
  { id: "front-brake-pads-honda", name: "Front Brake Pads Honda", price: 1200 },
  { id: "rear-brake-shoes-pulsar", name: "Rear Brake Shoes Pulsar", price: 850 },
  { id: "brake-drum-front", name: "Brake Drum Front", price: 2500 },
  { id: "disc-rotor-rear", name: "Disc Rotor Rear", price: 3000 },
  { id: "brake-cable-front", name: "Brake Cable Front", price: 250 },
  { id: "tire-tube-300-17", name: "Tire Tube 3.00-17", price: 1800 },
  { id: "tire-275-18-hero", name: "Tire 2.75-18 Hero", price: 2200 },
  { id: "spoke-set-splendor", name: "Spoke Set Splendor", price: 450 },
  { id: "rim-lock-17-inch", name: "Rim Lock 17 inch", price: 150 },
  { id: "brake-lever-right", name: "Brake Lever Right", price: 300 },
  { id: "air-filter-bajaj", name: "Air Filter Bajaj", price: 350 },
  { id: "oil-filter-tvs-apache", name: "Oil Filter TVS Apache", price: 280 },
  { id: "spark-plug-ngk-cr8e", name: "Spark Plug NGK CR8E", price: 250 },
  { id: "clutch-plates-set-5", name: "Clutch Plates set/5", price: 1500 },
  { id: "piston-kit-100cc", name: "Piston Kit 100cc", price: 2800 },
  { id: "chain-sprocket-kit-428", name: "Chain Sprocket Kit 428", price: 1200 },
  { id: "kick-starter-shaft", name: "Kick Starter Shaft", price: 650 },
  { id: "carburetor-rebuild-kit", name: "Carburetor Rebuild Kit", price: 1000 },
  { id: "cylinder-kit-110cc", name: "Cylinder Kit 110cc", price: 3500 },
  { id: "valve-set-intake-exhaust", name: "Valve Set Intake/Exhaust", price: 800 },
  { id: "front-fork-oil-seal", name: "Front Fork Oil Seal", price: 400 },
  { id: "shock-absorber-mono-rear", name: "Shock Absorber Mono Rear", price: 2200 },
  { id: "swing-arm-bearing", name: "Swing Arm Bearing", price: 600 },
  { id: "headlight-bulb-35-35w", name: "Headlight Bulb 35/35W", price: 120 },
  { id: "tail-light-assembly", name: "Tail Light Assembly", price: 750 },
  { id: "side-mirror-set-l-r", name: "Side Mirror Set L/R", price: 500 },
  { id: "seat-cover-leatherette", name: "Seat Cover Leatherette", price: 1200 },
  { id: "muffler-silencer", name: "Muffler Silencer", price: 2800 },
  { id: "exhaust-pipe-header", name: "Exhaust Pipe Header", price: 1500 },
  { id: "footrest-rubber-set", name: "Footrest Rubber Set", price: 100 },
  { id: "handle-grip-rubber-pair", name: "Handle Grip Rubber Pair", price: 150 },
  { id: "throttle-cable", name: "Throttle Cable", price: 180 },
  { id: "clutch-cable", name: "Clutch Cable", price: 160 },
  { id: "chain-guard-plastic", name: "Chain Guard Plastic", price: 450 },
  { id: "battery-12v-4ah", name: "Battery 12V 4Ah", price: 1800 },
  { id: "cdi-unit-digital", name: "CDI Unit Digital", price: 1500 },
  { id: "ignition-coil", name: "Ignition Coil", price: 900 },
  { id: "regulator-rectifier", name: "Regulator Rectifier", price: 850 },
  { id: "stator-coil", name: "Stator Coil", price: 1100 },
  { id: "wiring-harness-main", name: "Wiring Harness Main", price: 1200 },
  { id: "horn-dc-12v", name: "Horn DC 12V", price: 250 },
  { id: "indicator-blinker-set", name: "Indicator Blinker Set", price: 600 },
  { id: "fuel-tank-cap-lock", name: "Fuel Tank Cap Lock", price: 400 },
  { id: "petrol-tap-vacuum", name: "Petrol Tap Vacuum", price: 350 },
  { id: "head-gasket", name: "Head Gasket", price: 450 },
  { id: "full-gasket-kit", name: "Full Gasket Kit", price: 1800 },
  { id: "chain-lube-400ml", name: "Chain Lube 400ml", price: 250 },
  { id: "engine-oil-seal-set", name: "Engine Oil Seal Set", price: 350 },
  { id: "gear-lever", name: "Gear Lever", price: 450 },
  { id: "side-stand-spring", name: "Side Stand Spring", price: 150 },
  { id: "speedometer-cable", name: "Speedometer Cable", price: 200 },
  { id: "kill-switch", name: "Kill Switch", price: 200 },
  { id: "neutral-switch", name: "Neutral Switch", price: 300 },
  { id: "brake-light-switch", name: "Brake Light Switch", price: 180 },
  { id: "clutch-switch", name: "Clutch Switch", price: 250 },
  { id: "tool-kit-complete", name: "Tool Kit Complete", price: 650 },
  { id: "crash-guard-steel", name: "Crash Guard Steel", price: 2500 },
  { id: "mud-flap-front-pair", name: "Mud Flap Front Pair", price: 250 },
  { id: "decal-set-graphics", name: "Decal Set Graphics", price: 800 },
  { id: "number-plate-bracket", name: "Number Plate Bracket", price: 300 },
  { id: "license-plate-lamp", name: "License Plate Lamp", price: 250 },
  { id: "meter-glass", name: "Meter Glass", price: 200 },
  { id: "trip-meter-button", name: "Trip Meter Button", price: 150 },
  { id: "fuel-gauge-sender", name: "Fuel Gauge Sender", price: 650 },
  { id: "horn-relay", name: "Horn Relay", price: 200 },
  { id: "flasher-relay", name: "Flasher Relay", price: 350 },
  { id: "spark-plug-cap", name: "Spark Plug Cap", price: 150 },
  { id: "air-filter-sponge", name: "Air Filter Sponge", price: 200 },
  { id: "oil-filter-wrench", name: "Oil Filter Wrench", price: 300 },
  { id: "chain-rivet-tool", name: "Chain Rivet Tool", price: 800 },
  { id: "tire-pressure-gauge", name: "Tire Pressure Gauge", price: 250 },
  { id: "disc-lock", name: "Disc Lock", price: 1200 },
  { id: "engine-guard", name: "Engine Guard", price: 1200 },
  { id: "leg-guard-set", name: "Leg Guard Set", price: 1800 },
  { id: "handlebar-grip-end", name: "Handlebar Grip End", price: 100 },
  { id: "mirror-mounting-kit", name: "Mirror Mounting Kit", price: 250 },
  { id: "chain-slider-pad", name: "Chain Slider Pad", price: 200 },
  { id: "swing-arm-bush", name: "Swing Arm Bush", price: 300 },
  { id: "fork-seal-driver", name: "Fork Seal Driver", price: 400 },
  { id: "clutch-cable-lubricant", name: "Clutch Cable Lubricant", price: 150 },
  { id: "nut-bolt-m6-set", name: "Nut Bolt M6 Set", price: 100 },
  { id: "fork-tube-chrome", name: "Fork Tube Chrome set/2", price: 3200 },
  { id: "front-wheel-hub", name: "Front Wheel Hub Splendor", price: 1400 },
  { id: "rear-wheel-hub", name: "Rear Wheel Hub Splendor", price: 1600 },
  { id: "brake-pedal-assembly", name: "Brake Pedal Assembly", price: 550 },
  { id: "side-stand-black", name: "Side Stand Black", price: 300 },
  { id: "main-stand-splendor", name: "Main Stand Splendor", price: 850 },
  { id: "speedometer-assembly", name: "Speedometer Assembly", price: 1800 },
  { id: "tachometer-assembly", name: "Tachometer Assembly", price: 1500 },
  { id: "fuel-tank-blue", name: "Fuel Tank Splendor Blue", price: 4500 },
  { id: "side-panel-set", name: "Side Panel Splendor Set", price: 1200 },
  { id: "tail-panel-splendor", name: "Tail Panel Splendor", price: 650 },
  { id: "front-mudguard-black", name: "Front Mudguard Black", price: 800 },
  { id: "rear-mudguard-splendor", name: "Rear Mudguard Splendor", price: 750 },
  { id: "handlebar-standard", name: "Handlebar Splendor Standard", price: 450 },
  { id: "horn-chrome-high", name: "Horn Chrome 12V High", price: 450 },
  { id: "ignition-switch-set", name: "Ignition Switch Set Splendor", price: 1200 },
  { id: "fuel-filter-universal", name: "Fuel Filter Universal", price: 80 },
  { id: "brake-fluid-dot4", name: "Brake Fluid DOT4 100ml", price: 150 },
  { id: "chain-tensioner-set", name: "Chain Tensioner Set", price: 200 }
];

async function seed() {
  console.log("Seeding parts...");
  try {
    // Clear existing parts
    await db.delete(parts);
    
    // Insert new parts
    await db.insert(parts).values(SPARE_PARTS);
    
    console.log("Successfully seeded 100 parts!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding parts:", err);
    process.exit(1);
  }
}

seed();
