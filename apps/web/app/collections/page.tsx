import CollectionScroll, {
  type CollectionSubcategory,
} from "../components/CollectionScroll/CollectionScroll";

const DUMMY_IMAGE = "/dummy/product-placeholder.png";

const RED_WHITE_BLUE: CollectionSubcategory["products"][number]["colors"] = [
  { name: "Red", hex: "#e2342a" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Blue", hex: "#1a3f8f" },
];

function dummyProducts(subcategoryKey: string, price: string, originalPrice: string) {
  return Array.from({ length: 6 }, (_, index) => ({
    key: `${subcategoryKey}-${index}`,
    imageSrc: DUMMY_IMAGE,
    title: "Lorem ipsum",
    subtitle: "Lorem ipsum",
    price,
    originalPrice,
    colors: RED_WHITE_BLUE,
    href: `/products/${subcategoryKey}-${index}`,
  }));
}

const categoryName = "Karate";

const subcategories: CollectionSubcategory[] = [
  {
    key: "gloves",
    imageSrc: DUMMY_IMAGE,
    eyebrow: "Martial Arts",
    title: "Gloves",
    description:
      "Engineered for precision, protection and performance. Trusted by athletes at every level.",
    href: "/collections/karate/gloves",
    products: dummyProducts("gloves", "₹2,499.00", "₹0.00"),
  },
  {
    key: "shin-guards",
    imageSrc: DUMMY_IMAGE,
    eyebrow: "Martial Arts",
    title: "Shin Guards",
    description: "Padded coverage that keeps footwork fast without giving up impact protection.",
    href: "/collections/karate/shin-guards",
    products: dummyProducts("shin-guards", "₹1,799.00", "₹2,099.00"),
  },
  {
    key: "chest-guard",
    imageSrc: DUMMY_IMAGE,
    eyebrow: "Martial Arts",
    title: "Chest Guard",
    description: "Full-torso coverage moulded to move with you through every sparring exchange.",
    href: "/collections/karate/chest-guard",
    products: dummyProducts("chest-guard", "₹2,899.00", "₹3,299.00"),
  },
  {
    key: "head-guard",
    imageSrc: DUMMY_IMAGE,
    eyebrow: "Martial Arts",
    title: "Head Guard",
    description: "Shock-absorbing padding with a clear field of vision for competition and drills.",
    href: "/collections/karate/head-guard",
    products: dummyProducts("head-guard", "₹2,199.00", "₹2,599.00"),
  },
  {
    key: "mouth-guard",
    imageSrc: DUMMY_IMAGE,
    eyebrow: "Martial Arts",
    title: "Mouth Guard",
    description: "Boil-and-bite fit for secure protection that stays comfortable round after round.",
    href: "/collections/karate/mouth-guard",
    products: dummyProducts("mouth-guard", "₹399.00", "₹499.00"),
  },
  {
    key: "abdomen-guard",
    imageSrc: DUMMY_IMAGE,
    eyebrow: "Martial Arts",
    title: "Abdomen Guard",
    description: "Core protection built to absorb body shots without slowing you down.",
    href: "/collections/karate/abdomen-guard",
    products: dummyProducts("abdomen-guard", "₹1,499.00", "₹1,799.00"),
  },
  {
    key: "supporter",
    imageSrc: DUMMY_IMAGE,
    eyebrow: "Martial Arts",
    title: "Supporter",
    description: "Everyday base-layer protection, breathable enough for the longest training sessions.",
    href: "/collections/karate/supporter",
    products: dummyProducts("supporter", "₹699.00", "₹899.00"),
  },
];

export default function CollectionsPage() {
  return <CollectionScroll categoryName={categoryName} subcategories={subcategories} />;
}
