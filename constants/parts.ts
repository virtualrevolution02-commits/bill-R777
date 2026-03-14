import { SparePart } from "@/context/GarageContext";
import { HERO_PARTS } from "./parts_hero_full";
import { TVS_PARTS } from "./parts_tvs_full";
import { HONDA_PARTS } from "./parts_honda_full";
import { YAMAHA_PARTS } from "./parts_yamaha_full";

export const BRANDS = ["Hero", "Honda", "TVS", "Yamaha", "KTM"];

const WATER_WASH_PARTS: SparePart[] = BRANDS.map((brand) => ({
  id: `water-wash-${brand}`,
  name: "Water Wash",
  price: 150,
  category: "Service",
  brand,
}));

export const ALL_PARTS: SparePart[] = [
  ...HERO_PARTS,
  ...TVS_PARTS,
  ...HONDA_PARTS,
  ...YAMAHA_PARTS,
  ...WATER_WASH_PARTS,
];
